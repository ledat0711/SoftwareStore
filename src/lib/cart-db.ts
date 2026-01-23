import type { CartItem } from "@/lib/cart";
import prisma from "@/lib/prisma";

const MAX_QUANTITY = 99;

function clampQuantity(value: unknown, fallback = 1) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.floor(parsed), 1), MAX_QUANTITY);
}

async function ensureCartId(userId: string) {
  const cart = await prisma.cart.upsert({
    where: { userId },
    create: { userId },
    update: {},
    select: { id: true },
  });
  return cart.id;
}

async function ensureProductExists(productId: string) {
  const product = await prisma.product.findFirst({
    where: { id: productId, isDeleted: false },
    select: { id: true },
  });
  if (!product) {
    const error = new Error("Product not found");
    (error as Error & { code?: string }).code = "NOT_FOUND";
    throw error;
  }
}

// define kiểu dữ liệu
type CartItemRow = {
  quantity: number;
  product: {
    id: string;
    slug: string;
    title: string;
    price: number;
    image: string | null;
  };
};

function mapCartItems(rows: CartItemRow[]): CartItem[] {
  return rows.map((item) => ({
    id: item.product.id,
    slug: item.product.slug,
    title: item.product.title,
    price: item.product.price,
    image: item.product.image ?? null,
    quantity: item.quantity,
  }));
}

export async function getCartItemsForUser(userId: string): Promise<CartItem[]> {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        where: { product: { isDeleted: false } },
        orderBy: { updatedAt: "desc" },
        include: {
          product: {
            select: { id: true, slug: true, title: true, price: true, image: true },
          },
        },
      },
    },
  });

  if (!cart) return [];
  return mapCartItems(cart.items);
}

export async function addCartItemForUser(
  userId: string,
  productId: string,
  quantity = 1
): Promise<CartItem[]> {
  await ensureProductExists(productId);
  const cartId = await ensureCartId(userId);
  const qty = clampQuantity(quantity);

  const existing = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId, productId } },
    select: { id: true, quantity: true },
  });

  if (existing) {
    const nextQty = clampQuantity(existing.quantity + qty);
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: nextQty },
    });
  } else {
    await prisma.cartItem.create({
      data: { cartId, productId, quantity: qty },
    });
  }

  return getCartItemsForUser(userId);
}

export async function updateCartItemForUser(
  userId: string,
  productId: string,
  quantity: number
): Promise<CartItem[]> {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!cart) return [];

  if (quantity <= 0) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId } });
    return getCartItemsForUser(userId);
  }

  const qty = clampQuantity(quantity);
  await prisma.cartItem.updateMany({
    where: { cartId: cart.id, productId },
    data: { quantity: qty },
  });

  return getCartItemsForUser(userId);
}

export async function removeCartItemForUser(
  userId: string,
  productId: string
): Promise<CartItem[]> {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!cart) return [];

  await prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId } });
  return getCartItemsForUser(userId);
}

export async function clearCartForUser(userId: string) {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!cart) return;
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
}
