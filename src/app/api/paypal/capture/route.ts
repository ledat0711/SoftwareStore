// Client (PayPal SDK - onApprove)
//         │
//         │ POST /api/paypal/capture
//         │ body:
//         │ {
//         │   orderId,
//         │   items: [{ id, quantity }],
//         │   email
//         │ }
//         ▼
// ────────────────────────────────────
// POST(request)
// │
// ├─ auth() → lấy session
// │     ├─ userId
// │     └─ userEmail
// │
// ├─ request.json()
// │     └─ body
// │
// ├─ Validate input
// │     ├─ orderId
// │     ├─ items
// │     └─ email (guest)
// │
// ├─ capturePaypalOrder(orderId)
// │     └─ gọi PayPal API
// │
// ├─ Check captureStatus === "COMPLETED"
// │
// ├─ createOrderFromCart(...)
// │     └─ lưu Order + OrderItems vào DB
// │
// └─ return JSON { order, capture }
// ────────────────────────────────────
//         ▲
//         │
//      Client nhận kết quả

// File này là là API route của NextJS App Router
// Nó chỉ chạy khi client gọi: POST /api/paypal/capture

// PayPal SDK bên client, trong onApprove(), sẽ gọi API route này
// để capture order đã được người dùng approve trên cửa sổ PayPal popup

import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { createOrderFromCart } from "@/lib/orders";
import { capturePaypalOrder } from "@/lib/paypal";

type IncomingItem = { id?: string; quantity?: number };

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth();
  // Nếu có userId → user thật
  // Nếu null → guest
  const userId: string | null = session?.user?.id ?? null;
  const userEmail: string | null = session?.user?.email ?? null;

  // các bước xử lý cơ bản khi nhận request
  // 1. Lấy dữ liệu thô, nếu có lỗi trả về null: const body = await request.json(): truy xuất body của request: JSON string => JavaScript object
  const body = await request.json().catch(() => null);
  const orderId = typeof body?.orderId === "string" ? body.orderId.trim() : "";
  const rawItems: IncomingItem[] = Array.isArray(body?.items) ? body.items : [];
  const guestEmailRaw =
    typeof body?.email === "string" ? body.email.trim() : "";

  // 2. Chuẩn hóa bằng map
  // 3. Lọc dữ liệu hợp lệ bằng filter
  const items = rawItems
    .map((item) => ({
      id: String(item?.id ?? "").trim(),
      quantity: Number(item?.quantity ?? 0),
    }))
    .filter((item) => item.id && Number.isFinite(item.quantity));

  const isGuest = !userId;
  const emailToUse = isGuest ? guestEmailRaw : (userEmail ?? guestEmailRaw);
  const isValidEmail =
    typeof emailToUse === "string" &&
    emailToUse.length > 3 &&
    emailToUse.includes("@");

  // 4. fail fast: kiểm tra lỗi
  if (!orderId || !items.length || (isGuest && !isValidEmail)) {
    return NextResponse.json(
      { error: "Missing orderId/items/email" },
      { status: 400 },
    );
  }

  // capture: là hành động của Paypal: trừ tiền người mua chuyển cho chủ cửa hàng
  let capture;
  try {
    // truyền orderId lấy từ client vào hàm capturePaypalOrder để thực hiện chuyển tiền thực sự từ người mua sang chủ cửa hàng
    capture = await capturePaypalOrder(orderId);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to capture PayPal order";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const captureStatus =
    capture?.status ??
    capture?.purchase_units?.[0]?.payments?.captures?.[0]?.status ??
    null;

  // nếu chuyển tiền không thành công trả về lỗi 400 cho client với lý do chuyển tiền không hoàn tất (captureStatus !== "COMPLETED")
  // captureStatus: trạng thái capture
  // "COMPLETED": thành công
  // "DECLINED": từ chối
  // "PENDING": đang chờ xử lý
  if (captureStatus !== "COMPLETED") {
    return NextResponse.json(
      { error: "PayPal capture not completed", status: captureStatus },
      { status: 400 },
    );
  }

  // nếu chuyển tiền thành công, lưu order vào DB
  // nhận order, capture trả về cho client
  try {
    const order = await createOrderFromCart(userId, items, emailToUse);
    return NextResponse.json({ order, capture });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to save order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
