import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  addCartItemForUser,
  clearCartForUser,
  getCartItemsForUser,
  removeCartItemForUser,
  updateCartItemForUser,
} from "@/lib/cart-db";
import { prisma } from "@/lib/prisma";

function normalizeProductId(value: unknown) {
  const id = String(value ?? "").trim();
  return id.length > 0 ? id : null;
}

function isNotFoundError(error: unknown) {
  return (
    error instanceof Error &&
    (error as Error & { code?: string }).code === "NOT_FOUND"
  );
}

async function requireUserId() {
  const session = await auth();
  return session?.user?.id ?? null;
}

async function loadCartSummary(userId: string) {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      coupon: { select: { code: true } },
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

  const items =
    cart?.items.map((item) => ({
      id: item.product.id,
      slug: item.product.slug,
      title: item.product.title,
      price: item.product.price,
      image: item.product.image ?? null,
      quantity: item.quantity,
    })) ?? [];

  return {
    items,
    cartId: cart?.id ?? null,
    couponCode: cart?.coupon?.code ?? null,
  };
}

export async function GET() {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summary = await loadCartSummary(userId);
  return NextResponse.json(summary);
}

export async function POST(request: Request) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const productId = normalizeProductId(body?.productId);
  if (!productId) {
    return NextResponse.json({ error: "Missing productId" }, { status: 400 });
  }

  try {
    await addCartItemForUser(userId, productId, body?.quantity);
    const summary = await loadCartSummary(userId);
    return NextResponse.json(summary);
  } catch (error) {
    if (isNotFoundError(error)) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Unable to update cart" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const productId = normalizeProductId(body?.productId);
  const quantity = Number(body?.quantity);

  if (!productId || !Number.isFinite(quantity)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  await updateCartItemForUser(userId, productId, quantity);
  const summary = await loadCartSummary(userId);
  return NextResponse.json(summary);
}

export async function DELETE(request: Request) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const productId = normalizeProductId(searchParams.get("productId"));

  if (productId) {
    await removeCartItemForUser(userId, productId);
    const summary = await loadCartSummary(userId);
    return NextResponse.json(summary);
  }

  await clearCartForUser(userId);
  const summary = await loadCartSummary(userId);
  return NextResponse.json(summary);
}
