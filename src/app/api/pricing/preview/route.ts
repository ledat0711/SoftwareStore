import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { computeCartPricingWithDiscounts, PricedItem } from "@/lib/discounts";

type IncomingItem = { id?: string; quantity?: number };

export async function POST(request: Request) {
  const session = await auth();
  const userId: string | null = session?.user?.id ?? null;

  const body = await request.json().catch(() => null);
  const rawItems: IncomingItem[] = Array.isArray(body?.items) ? body.items : [];
  const cartId: string | null =
    typeof body?.cartId === "string" ? body.cartId.trim() : null;
  const couponCode: string | null =
    typeof body?.coupon === "string" ? body.coupon.trim() : null;

  const normalized = rawItems
    .map((item) => ({
      id: String(item?.id ?? "").trim(),
      quantity: Number(item?.quantity ?? 0),
    }))
    .filter((item) => item.id && Number.isFinite(item.quantity) && item.quantity > 0);

  if (!normalized.length) {
    return NextResponse.json({ error: "Missing items" }, { status: 400 });
  }

  const productIds = [...new Set(normalized.map((i) => i.id))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isDeleted: false },
    select: { id: true, price: true },
  });
  const priceMap = new Map(products.map((p) => [p.id, p.price]));

  const pricedItems: PricedItem[] = normalized
    .map((item) => {
      const price = priceMap.get(item.id);
      if (price == null) return null;
      return { productId: item.id, quantity: item.quantity, price };
    })
    .filter(Boolean) as PricedItem[];

  if (!pricedItems.length) {
    return NextResponse.json({ error: "No valid items" }, { status: 400 });
  }

  try {
    const { pricing } = await computeCartPricingWithDiscounts(pricedItems, {
      couponCode: couponCode || undefined,
      cartId: cartId || undefined,
      userId,
      reserveCoupon: false, // preview only, do not hold usage
    });

    return NextResponse.json({ pricing });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to preview pricing";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
