import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { buildOrderItems, BuiltOrderItems } from "@/lib/orders";
import {
  cancelCouponReservation,
  computeCartPricingWithDiscounts,
} from "@/lib/discounts";
import { createPaypalOrder } from "@/lib/paypal";
import { prisma } from "@/lib/prisma";

type IncomingItem = { id?: string; quantity?: number };

export async function POST(request: Request): Promise<NextResponse> {
  // Xác định: User đã đăng nhập hay guest
  const session = await auth();
  const userId: string | null = session?.user?.id ?? null;
  const userEmail: string | null = session?.user?.email ?? null;

  // LẤY DỮ LIỆU THÔ THÔNG QUA REQUEST
  // Lấy dữ liệu từ client, nếu JSON lỗi → body = null (fail safe)
  const body = await request.json().catch(() => null);
  const rawItems: IncomingItem[] = Array.isArray(body?.items) ? body.items : [];
  const guestEmailRaw =
    typeof body?.email === "string" ? body.email.trim() : "";
  let cartId: string =
    typeof body?.cartId === "string" ? body.cartId.trim() : "";
  const couponCodeRaw: string =
    typeof body?.coupon === "string" ? body.coupon.trim() : "";

  // map: chuẩn hóa dữ liệu, filter: kiểm tra (lọc) dữ liệu hợp lệ
  const items = rawItems
    .map((item) => ({
      id: String(item?.id ?? "").trim(),
      quantity: Number(item?.quantity ?? 0),
    }))
    .filter((item) => item.id && Number.isFinite(item.quantity));

  // Kiểm tra email guest
  // cho dù là khách hay là user đã đăng nhập
  // thì email cũng phải hợp lệ
  // Nếu là guest thì email lấy từ form
  // Nếu là user đã đăng nhập thì truy xuất email của user thông qua session
  // nếu không hợp lệ trả về lỗi 400
  // Ở riêng hàm POST này: email chỉ để kiểm tra điều kiện, email không dùng để lưu vào đâu cả
  const isGuest = !userId;
  const emailToUse = isGuest ? guestEmailRaw : userEmail ?? guestEmailRaw;
  const isValidEmail: boolean =
    typeof emailToUse === "string" &&
    emailToUse.length > 3 &&
    emailToUse.includes("@");

  // Fallback: nếu client chưa gửi cartId nhưng user đã đăng nhập, tự lấy cart hiện tại để phục vụ áp coupon.
  if (!cartId && userId) {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      select: { id: true },
    });
    cartId = cart?.id ?? "";
  }

  if (!items.length || (isGuest && !isValidEmail)) {
    return NextResponse.json(
      { error: "Missing or invalid items/email" },
      { status: 400 }
    );
  }

  let totalMoney = 0;
  let usageId: string | undefined;
  let pricingPayload: {
    subtotal: number;
    discounts: { id: string; name: string; amount: number }[];
    total: number;
  } | null = null;

  try {
    const builtOrderItems: BuiltOrderItems = await buildOrderItems(items);
    const pricedItems = builtOrderItems.orderItems.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
    }));

    if (couponCodeRaw && !cartId) {
      return NextResponse.json(
        { error: "cartId required when applying coupon" },
        { status: 400 }
      );
    }

    const { pricing, usageId: reservedUsageId } =
      await computeCartPricingWithDiscounts(pricedItems, {
        couponCode: couponCodeRaw || undefined,
        cartId: cartId || undefined,
        userId,
      });

    pricingPayload = {
      subtotal: pricing.subtotal,
      discounts: pricing.discounts.map((d) => ({
        id: d.id,
        name: d.name,
        amount: d.amount,
      })),
      total: pricing.total,
    };

    usageId = reservedUsageId;
    totalMoney = pricing.total;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to build order";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    const paypalOrder = await createPaypalOrder(totalMoney);

    if (!paypalOrder?.id) {
      return NextResponse.json(
        { error: "PayPal order id missing" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        id: paypalOrder.id,
        status: paypalOrder.status,
        pricing: pricingPayload,
        couponUsageId: usageId,
      },
      { status: 201 }
    );
  } catch (error) {
    if (usageId) {
      await cancelCouponReservation(usageId);
    }
    const message =
      error instanceof Error ? error.message : "Unable to create PayPal order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
