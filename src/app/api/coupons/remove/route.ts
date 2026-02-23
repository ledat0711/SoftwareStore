import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { cancelCouponReservation } from "@/lib/discounts";

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id ?? null;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const cartId: string = typeof body?.cartId === "string" ? body.cartId.trim() : "";
  if (!cartId) return NextResponse.json({ error: "Missing cartId" }, { status: 400 });

  const cart = await prisma.cart.findUnique({
    where: { id: cartId, userId },
    select: { id: true, couponId: true },
  });
  if (!cart) return NextResponse.json({ error: "Cart not found" }, { status: 404 });

  // Cancel pending usage if exists
  const pendingUsage = await prisma.discountUsage.findFirst({
    where: { cartId, status: "PENDING" },
    select: { id: true },
  });
  if (pendingUsage) {
    await cancelCouponReservation(pendingUsage.id);
  }

  await prisma.cart.update({
    where: { id: cartId },
    data: { couponId: null },
  });

  return NextResponse.json({ ok: true });
}
