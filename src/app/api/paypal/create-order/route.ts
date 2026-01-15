import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { buildOrderItems } from "@/lib/orders";
import { createPaypalOrder } from "@/lib/paypal";

type IncomingItem = { id?: string; quantity?: number };

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth();
  const userId: string | null = session?.user?.id ?? null;
  const userEmail: string | null = session?.user?.email ?? null;

  const body = await request.json().catch(() => null);
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

  if (!items.length || (isGuest && !isValidEmail)) {
    return NextResponse.json(
      { error: "Missing or invalid items/email" },
      { status: 400 }
    );
  }

  let total = 0;
  try {
    const built = await buildOrderItems(items);
    total = built.total;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to build order";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    const paypalOrder = await createPaypalOrder(total);

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
      error instanceof Error
        ? error.message
        : "Unable to create PayPal order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
