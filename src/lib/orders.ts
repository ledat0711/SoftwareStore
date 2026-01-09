import { prisma } from "@/lib/prisma";

type OrderItemInput = {
  id: string;
  quantity: number;
};

function clampQuantity(value: unknown, fallback = 1) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.floor(parsed), 1), 99);
}

export async function createOrderFromCart(
  userId: string | null,
  items: OrderItemInput[]
) {
  const normalized = items
    .map((item) => ({
      productId: String(item.id ?? "").trim(),
      quantity: clampQuantity(item.quantity, 1),
    }))
    .filter((item) => item.productId && item.quantity > 0);

  if (!normalized.length) {
    throw new Error("No valid items to create order");
  }

  const productIds = [...new Set(normalized.map((item) => item.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, title: true, slug: true, image: true, price: true },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  const orderItems = normalized
    .map((item) => {
      const product = productMap.get(item.productId);
      if (!product) return null;
      return {
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
      };
    })
    .filter(Boolean) as { productId: string; quantity: number; price: number }[];

  if (!orderItems.length) {
    throw new Error("No matching products for order items");
  }

  const total = orderItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

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
          product: { select: { id: true, slug: true, title: true, image: true } },
        },
      },
    },
  });
}

export async function getRecentOrders(limit = 30) {
  return prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: { select: { id: true, email: true, name: true } },
      items: {
        include: {
          product: {
            select: { id: true, title: true, slug: true, image: true, price: true },
          },
        },
      },
    },
  });
}
