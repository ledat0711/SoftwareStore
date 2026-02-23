import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { computeCartPricingWithDiscounts, PricedItem } from "@/lib/discounts";

type IncomingItem = { id?: string; quantity?: number };

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id ?? null;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const code: string = typeof body?.code === "string" ? body.code.trim() : "";
  const cartId: string = typeof body?.cartId === "string" ? body.cartId.trim() : "";
  const rawItems: IncomingItem[] = Array.isArray(body?.items) ? body.items : [];

  if (!code || !cartId) {
    return NextResponse.json({ error: "Missing code or cartId" }, { status: 400 });
  }

  // Build priced items from DB to avoid client tampering
  const cart = await prisma.cart.findUnique({
    where: { id: cartId, userId },
    include: {
      items: {
        include: {
          product: { select: { id: true, price: true, isDeleted: true } },
        },
      },
    },
  });

  if (!cart || cart.items.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  const items: PricedItem[] = cart.items
    .filter((item) => !item.product.isDeleted)
    .map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
      price: item.product.price,
    }));

  try {
    const { pricing, coupon, usageId } = await computeCartPricingWithDiscounts(
      items,
      { couponCode: code, cartId, userId, reserveCoupon: true },
    );

    await prisma.cart.update({
      where: { id: cartId },
      data: { couponId: coupon?.id ?? null },
    });

    return NextResponse.json({
      pricing,
      coupon: coupon ? { id: coupon.id, code: coupon.code, name: coupon.name } : null,
      couponUsageId: usageId ?? null,
      cartId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to apply coupon";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
