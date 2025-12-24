import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  addCartItemForUser,
  clearCartForUser,
  getCartItemsForUser,
  removeCartItemForUser,
  updateCartItemForUser,
} from "@/lib/cart-db";

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

export async function GET() {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await getCartItemsForUser(userId);
  return NextResponse.json({ items });
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
    const items = await addCartItemForUser(userId, productId, body?.quantity);
    return NextResponse.json({ items });
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

  const items = await updateCartItemForUser(userId, productId, quantity);
  return NextResponse.json({ items });
}

export async function DELETE(request: Request) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const productId = normalizeProductId(searchParams.get("productId"));

  if (productId) {
    const items = await removeCartItemForUser(userId, productId);
    return NextResponse.json({ items });
  }

  await clearCartForUser(userId);
  return NextResponse.json({ items: [] });
}
