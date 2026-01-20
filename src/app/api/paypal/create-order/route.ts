import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { buildOrderItems, BuiltOrderItems } from "@/lib/orders";
import { createPaypalOrder } from "@/lib/paypal";

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

  if (!items.length || (isGuest && !isValidEmail)) {
    return NextResponse.json(
      { error: "Missing or invalid items/email" },
      { status: 400 }
    );
  }

  let totalMoney = 0;
  try {
    const builtOrderItems: BuiltOrderItems = await buildOrderItems(items);
    totalMoney = builtOrderItems.totalMoney;
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

    return NextResponse.json({
      id: paypalOrder.id,
      status: paypalOrder.status,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create PayPal order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
