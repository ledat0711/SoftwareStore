import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { createOrderFromCart } from "@/lib/orders";
import { capturePaypalOrder } from "@/lib/paypal";

type IncomingItem = { id?: string; quantity?: number };

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth();
  const userId: string | null = session?.user?.id ?? null;
  const userEmail: string | null = session?.user?.email ?? null;

  const body = await request.json().catch(() => null);
  const orderId =
    typeof body?.orderId === "string" ? body.orderId.trim() : "";
  const rawItems: IncomingItem[] = Array.isArray(body?.items)
    ? body.items
    : [];
  const guestEmailRaw =
    typeof body?.email === "string" ? body.email.trim() : "";

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

  if (!orderId || !items.length || (isGuest && !isValidEmail)) {
    return NextResponse.json(
      { error: "Missing orderId/items/email" },
      { status: 400 }
    );
  }

  let capture;
  try {
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

  if (captureStatus !== "COMPLETED") {
    return NextResponse.json(
      { error: "PayPal capture not completed", status: captureStatus },
      { status: 400 }
    );
  }

  try {
    const order = await createOrderFromCart(userId, items, emailToUse);
    return NextResponse.json({ order, capture });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to save order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
