import { prisma } from "@/lib/prisma";

// id và quantity không có optional vì đã validate ở bước trước
type OrderItemInput = {
  id: string;
  quantity: number;
};

export type BuiltOrderItems = {
  orderItems: { productId: string; quantity: number; price: number }[];
  totalMoney: number;
};

function generateOrderCode(date: Date, index: number): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `ORD-${y}${m}${d}-${String(index).padStart(4, "0")}`;
}

function isUniqueConstraintError(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
  );
}

function clampQuantity(value: unknown, fallback = 1) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.floor(parsed), 1), 99);
}

// async: hàm có thể chờ những việc tốn thời gian (gọi DB, gọi API…) mà không làm “đứng” luồng xử lý.
// Hễ trong hàm có await thì hàm phải là async.
// createOrderFromCart: Tạo Order dựa trên items trong cart.
// items: OrderItemInput[] nghĩa là:
// items là một mảng
// mỗi phần tử có dạng { id, quantity }

// hàm createOrderFromCart làm 4 việc chính:
// Chuẩn hóa items + tính tổng tiền từ giỏ hàng (buildOrderItems)
// Tạo khoảng thời gian “hôm nay theo UTC” để đếm số đơn trong ngày
// Sinh mã đơn code theo ngày + số thứ tự trong ngày
// Ghi Order + OrderItems vào DB bằng Prisma, và retry tối đa 3 lần nếu code bị trùng (unique)
export async function createOrderFromCart(
  userId: string | null,
  items: OrderItemInput[],
  guestEmail?: string | null
) {
  const { orderItems, totalMoney } = await buildOrderItems(items);

  const now = new Date();
  const startOfDay = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const endOfDay = new Date(startOfDay);
  endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const dailyCount = await prisma.order.count({
      where: {
        createdAt: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
    });

    // tạo mã đơn
    const code = generateOrderCode(now, dailyCount + 1 + attempt);

    try {
      return await prisma.order.create({
        data: {
          userId: userId ?? null,
          guestEmail: guestEmail?.trim() || null,
          total: totalMoney,
          status: "PAID",
          code,
          items: {
            create: orderItems,
          },
        },
        include: {
          items: {
            include: {
              product: {
                select: { id: true, slug: true, title: true, image: true, isDeleted: true},
              },
            },
          },
        },
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        continue;
      }
      throw error;
    }
  }

  throw new Error("Unable to generate unique order code");
}

export async function buildOrderItems(
  items: OrderItemInput[]
): Promise<BuiltOrderItems> {
  // map: chuẩn hóa (duyệt từng phần tử trong mảng và biến đổi thành phần tử mới. Nhận vào item, trả ra object mới)
  // filter: kiểm tra tính hợp lệ
  const normalized: { productId: string; quantity: number }[] = items
    .map((item) => ({
      productId: String(item.id ?? "").trim(),
      quantity: clampQuantity(item.quantity, 1), // clampQuantity: giới hạn số lượng từ 1 đến 99
    }))
    .filter((item) => item.productId && item.quantity > 0);

  // mảng normalized rỗng: "fail fast" Ngay khi phát hiện lỗi, trả về lỗi ngay lập tức
  if (!normalized.length) {
    // ném lỗi
    // dừng hàm ngay lập tức
    throw new Error("No valid items to create order");
  }

  // normalized.map((item) => item.productId):
  //    lấy ra mảng chỉ gồm productId
  //    ví dụ: ["A", "A", "B"]
  // new Set(...):
  //    Set là cấu trúc dữ liệu không cho trùng
  //    new Set(["A","A","B"]) → Set chỉ còn { "A", "B" }
  // [...] (spread):
  //    chuyển Set về lại mảng
  //    ...[set] → ["A", "B"]
  // => Mục đích:
  //    tránh query DB lặp
  //    tối ưu performance
  const productIds = [...new Set(normalized.map((item) => item.productId))];

  // select = chỉ lấy các cột cần thiết.
  // true nghĩa là lấy field đó.Nó có nghĩa là:

  // câu lệnh prisma.product.findMany bên dưới có ý nghĩa:
  // Lấy nhiều sản phẩm
  // Điều kiện:
  // id nằm trong danh sách productIds
  // Chỉ lấy các cột:
  // id
  // title
  // slug
  // image
  // price

  // Chuyển sang câu query PostgreSQL tương đương:
  // SELECT
  //   id,
  //   title,
  //   slug,
  //   image,
  //   price
  // FROM "Product"
  // WHERE id IN (
  //   'id1',
  //   'id2',
  //   'id3'
  // );
  // 'id1', 'id2', 'id3' là các phần tử trong mảng productIds
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isDeleted: false },
    select: { id: true, title: true, slug: true, image: true, price: true },
  });

  // Map là cấu trúc key-value.
  // products.map((p) => [p.id, p]) tạo mảng cặp:
  // [key, value]
  // [productId, productObject]
  // giúp tra cứu nhanh product theo id: productMap.get(item.productId)
  const productMap = new Map(products.map((p) => [p.id, p]));

  // Tạo orderItems chỉ gồm sản phẩm tồn tại trong DB
  // ***** Ngắn gọn: kiểm tra dữ liệu product mà client gửi lên có tồn tại trong DB không. Nếu không tồn tại thì loại bỏ sản phẩm đó. *****
  const orderItems: {
    productId: string;
    quantity: number;
    price: number;
  }[] = normalized
    .map((item) => {
      // .get(key) trả về:
      // object product nếu có
      // hoặc undefined nếu không có
      const product = productMap.get(item.productId);

      // Nếu client gửi id product không tồn tại trong các record sản phẩm ở DB → loại bỏ sản phẩm với id product đó.
      // bên dưới .filter bên dưới: Boolean là callback, truyền tham chiếu hàm Boolean vào, bên trong hàm filter sẽ truyền giá trị từng phần tử vào hàm Boolean
      // Boolean(null) = false
      // Boolean(undefined) = false
      // loại null và undefined
      // e) as { ... }[]: Ép kiểu TypeScript để an toàn dữ liệu
      if (!product) return null;
      return {
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
      };
    })
    .filter(Boolean) as {
    productId: string;
    quantity: number;
    price: number;
  }[];

  // client gửi toàn id giả
  // hoặc product đã bị xóa khỏi DB
  // quăng lỗi không hoạt động tiếp
  if (!orderItems.length) {
    throw new Error("No matching products for order items");
  }

  // reduce gom mảng thành 1 giá trị.
  // sum là tổng hiện tại.
  // 0 là giá trị khởi tạo.
  // Mỗi vòng:
  // cộng thêm item.price * item.quantity
  const totalMoney = orderItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // prisma.order.create: Prisma thực hiện 3 việc liên tiếp (trong 1 transaction):
  // INSERT Order
  // INSERT nhiều OrderItem (liên kết bằng orderId)
  // SELECT lại Order + OrderItem + Product để trả về
  // PostgreSQL không có khái niệm include, nên ta phải viết nhiều câu SQL.
  // Bảng so sánh:
  // Prisma	                               PostgreSQL
  // order.create()	                       INSERT INTO "Order"
  // items.create	                         INSERT INTO "OrderItem"
  // include.items.include.product	       LEFT JOIN OrderItem + Product
  // Tự động transaction	                 Phải BEGIN / COMMIT
  // Trả object lồng nhau	                 SQL trả bảng phẳng
  //
  // chuyển thành câu lệnh PostgreSQL:
  // Tổng quát:
  // BEGIN;

  // -- 1. Tạo Order
  // INSERT INTO "Order" (...)
  // RETURNING id;

  // -- 2. Tạo OrderItem
  // INSERT INTO "OrderItem" (...)

  // -- 3. Lấy dữ liệu giống Prisma include
  // SELECT ...
  // FROM "Order"
  // LEFT JOIN ...

  // COMMIT;
  // BEGIN;
  // chi tiết
  // INSERT INTO "Order" (
  //   id,
  //   "userId",
  //   total,
  //   status,
  //   "createdAt"
  // )
  // VALUES (
  //   gen_random_uuid(),        -- hoặc cuid() nếu bạn tự xử lý
  //   $1,                       -- userId (nullable)
  //   $2,                       -- total
  //   'PAID',
  //   NOW()
  // )
  // RETURNING id;

  // [
  //   { productId, quantity, price },
  //   { productId, quantity, price },
  // ]
  return { orderItems, totalMoney: totalMoney };
}

// async giúp không block chương trình khi đang chờ lấy dữ liệu từ database
// Nhiệm vụ: lấy danh sách đơn hàng gần nhất từ database
// order là model Order trong schema.prisma
// findMany = lấy nhiều record
// Prisma sẽ query trực tiếp DB, KHÔNG chạy ở browser
// orderBy: { createdAt: "desc" }: Sắp xếp đơn hàng theo ngày tạo giảm dần (mới nhất trước)
// "desc": mới nhất → cũ hơn
// Đơn hàng mới sẽ hiển thị trước

// PostgreSQL FULL QUERY
// SELECT
//   o.id              AS order_id,
//   o.created_at      AS order_created_at,

//   u.id              AS user_id,
//   u.email           AS user_email,
//   u.name            AS user_name,

//   oi.id             AS order_item_id,
//   oi.quantity       AS order_item_quantity,
//   oi.price          AS order_item_price,

//   p.id              AS product_id,
//   p.title           AS product_title,
//   p.slug            AS product_slug,
//   p.image           AS product_image,
//   p.price           AS product_price

// FROM "Order" o
// LEFT JOIN "User" u
//   ON u.id = o."userId"

// LEFT JOIN "OrderItem" oi
//   ON oi."orderId" = o.id

// LEFT JOIN "Product" p
//   ON p.id = oi."productId"

// ORDER BY o."createdAt" DESC
// LIMIT 30;
const orderInclude = {
  user: { select: { id: true, email: true, name: true } },
  items: {
    include: {
      product: {
        select: {
          id: true,
          title: true,
          slug: true,
          image: true,
          price: true,
          isDeleted: true,
          hidden: true,
        },
      },
    },
  },
};

export async function getRecentOrders(limit = 30) {
  return prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: orderInclude,
  });
}

// hàm getOrdersPage: lấy danh sách đơn hàng theo từng trang (pagination)
export async function getOrdersPage(page = 1, pageSize = 10) {
  const take = Math.max(1, pageSize);
  const total = await prisma.order.count();
  const totalPages = Math.max(1, Math.ceil(total / take)); // làm tròn lên: ví dụ: 25 đơn, mỗi trang 10 đơn → 3 trang, nếu nhỏ hơn 1 thì vẫn là 1 trang, Math.max: đề phòng trường hợp total = 0
  const currentPage = Math.min(Math.max(page, 1), totalPages); // currentPage: từ 1 đến totalPages

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" }, // sắp xếp đơn hàng theo ngày tạo, mới nhất hiển thị trước.
    skip: (currentPage - 1) * take,
    take,
    include: orderInclude,
  });

  return { orders, total, totalPages, pageSize: take, currentPage };
}

export async function getUserOrdersPage(
  userId: string,
  page = 1,
  pageSize = 10
) {
  const take = Math.max(1, pageSize);
  if (!userId) {
    return {
      orders: [],
      total: 0,
      totalPages: 1,
      pageSize: take,
      currentPage: 1,
    };
  }

  const total = await prisma.order.count({ where: { userId } });
  const totalPages = Math.max(1, Math.ceil(total / take));
  const currentPage = Math.min(Math.max(page, 1), totalPages);

  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    skip: (currentPage - 1) * take,
    take,
    include: orderInclude,
  });

  return { orders, total, totalPages, pageSize: take, currentPage };
}
