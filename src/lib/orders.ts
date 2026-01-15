import { prisma } from "@/lib/prisma";

// id và quantity không có optional vì đã validate ở bước trước
type OrderItemInput = {
  id: string;
  quantity: number;
};

type BuiltOrderItems = {
  orderItems: { productId: string; quantity: number; price: number }[];
  total: number;
};

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
export async function createOrderFromCart(
  userId: string | null,
  items: OrderItemInput[]
) {
  const { orderItems, total } = await buildOrderItems(items);

  return prisma.order.create({
    data: {
      userId: userId ?? null,
      total,
      status: "PAID",
      items: {
        create: orderItems,
      },
    },
    include: {
      items: {
        include: {
          product: {
            select: { id: true, slug: true, title: true, image: true },
          },
        },
      },
    },
  });
}

export async function buildOrderItems(
  items: OrderItemInput[]
): Promise<BuiltOrderItems> {
  // map: chuẩn hóa (duyệt từng phần tử trong mảng và biến đổi thành phần tử mới. Nhận vào item, trả ra object mới)
  // filter: kiểm tra tính hợp lệ
  const normalized: { productId: string; quantity: number }[] = items
    .map((item) => ({
      productId: String(item.id ?? "").trim(),
      quantity: clampQuantity(item.quantity, 1),
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

  // select = chỉ lấy các cột cần thiết.
  // true nghĩa là lấy field đó.
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, title: true, slug: true, image: true, price: true },
  });

  // Map là cấu trúc key-value.
  // products.map((p) => [p.id, p]) tạo mảng cặp:
  // [key, value]
  // [productId, productObject]
  // giúp tra cứu nhanh product theo id: productMap.get(item.productId)
  const productMap = new Map(products.map((p) => [p.id, p]));

  // Tạo orderItems chỉ gồm sản phẩm tồn tại trong DB
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
  const total = orderItems.reduce(
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
  return { orderItems, total };
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
export async function getRecentOrders(limit = 30) {
  return prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
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
            },
          },
        },
      },
    },
  });
}
