import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  cancelCouponReservation,
  computeCartPricingWithDiscounts,
} from "@/lib/discounts";
import {
  buildOrderItems,
  createOrderFromCartWithDiscounts,
} from "@/lib/orders";
import { capturePaypalOrder } from "@/lib/paypal";
import { orderService } from "@/lib/services/orderService";
import { prisma } from "@/lib/prisma";

type IncomingItem = { id?: string; quantity?: number };

export async function POST(request: Request) {
  const session = await auth();
  const userId: string | null = session?.user?.id ?? null;
  const userEmail: string | null = session?.user?.email ?? null;

  const body = await request.json().catch(() => null);
  const orderId = typeof body?.orderId === "string" ? body.orderId.trim() : "";
  const rawItems: IncomingItem[] = Array.isArray(body?.items) ? body.items : [];
  const guestEmailRaw =
    typeof body?.email === "string" ? body.email.trim() : "";
  let cartId: string =
    typeof body?.cartId === "string" ? body.cartId.trim() : "";
  const couponCode: string =
    typeof body?.coupon === "string" ? body.coupon.trim() : "";
  const couponUsageId: string =
    typeof body?.couponUsageId === "string" ? body.couponUsageId.trim() : "";

  const items = rawItems
    .map((item) => ({
      id: String(item?.id ?? "").trim(),
      quantity: Number(item?.quantity ?? 0),
    }))
    .filter((item) => item.id && Number.isFinite(item.quantity));

  const isGuest = !userId;
  const emailToUse = isGuest ? guestEmailRaw : userEmail ?? guestEmailRaw;
  const isValidEmail =
    typeof emailToUse === "string" &&
    emailToUse.length > 3 &&
    emailToUse.includes("@");

  // Fallback: nếu client không gửi cartId nhưng user đã đăng nhập, tự lấy cart đang mở.
  if (!cartId && userId) {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      select: { id: true },
    });
    cartId = cart?.id ?? "";
  }

  if (!orderId || !items.length || (isGuest && !isValidEmail)) {
    return NextResponse.json(
      { error: "Missing orderId/items/email" },
      { status: 400 },
    );
  }

  if (couponCode && !cartId) {
    return NextResponse.json(
      { error: "cartId required when using coupon" },
      { status: 400 },
    );
  }

  // Server-side pricing to assert amount and finalize coupon usage
  let pricing:
    | {
        subtotal: number;
        discounts: { id: string; amount: number }[];
        total: number;
      }
    | undefined;
  let reservedUsageId: string | undefined = couponUsageId || undefined;
  try {
    const built = await buildOrderItems(
      items.map((i) => ({ id: i.id, quantity: i.quantity })),
    );
    const pricedItems = built.orderItems.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
      price: i.price,
    }));

    const { pricing: computed, usageId } =
      await computeCartPricingWithDiscounts(pricedItems, {
        couponCode: couponCode || undefined,
        cartId,
        userId,
      });
    pricing = computed;
    reservedUsageId = reservedUsageId || usageId;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Pricing failed" },
      { status: 400 },
    );
  }

  let capture;
  try {
    capture = await capturePaypalOrder(orderId);
  } catch (error) {
    if (reservedUsageId) await cancelCouponReservation(reservedUsageId);
    const message =
      error instanceof Error ? error.message : "Unable to capture PayPal order";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const captureStatus =
    capture?.status ??
    capture?.purchase_units?.[0]?.payments?.captures?.[0]?.status ??
    null;

  type PurchaseUnit = {
    amount?: { value?: string };
    payments?: { captures?: { amount?: { value?: string } }[] };
  };

  const purchaseUnit: PurchaseUnit | undefined =
    (capture as { purchase_units?: PurchaseUnit[] } | null | undefined)
      ?.purchase_units?.[0];
  const capturedAmountRaw =
    purchaseUnit?.amount?.value ??
    purchaseUnit?.payments?.captures?.[0]?.amount?.value ??
    null;
  const capturedAmount = capturedAmountRaw ? Number(capturedAmountRaw) : null;

  if (pricing && capturedAmount !== null) {
    const diff = Math.abs(capturedAmount - pricing.total);
    if (diff > 0.01) {
      if (reservedUsageId) await cancelCouponReservation(reservedUsageId);
      return NextResponse.json(
        {
          error: "Captured amount mismatches server pricing",
          serverTotal: pricing.total,
          capturedAmount,
        },
        { status: 400 },
      );
    }
  }

  if (captureStatus !== "COMPLETED") {
    if (reservedUsageId) {
      await cancelCouponReservation(reservedUsageId);
    }
    return NextResponse.json(
      { error: "PayPal capture not completed", status: captureStatus },
      { status: 400 },
    );
  }

  try {
    const order = await createOrderFromCartWithDiscounts({
      userId,
      items,
      cartId,
      couponCode,
      guestEmail: emailToUse,
    });

    try {
      await orderService.markPaid(order.id);
    } catch (emailError) {
      console.error("[paypal-capture] send email failed", emailError);
    }

    return NextResponse.json({ order, capture, pricing });
  } catch (error) {
    if (reservedUsageId) await cancelCouponReservation(reservedUsageId);
    const message =
      error instanceof Error ? error.message : "Unable to save order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
