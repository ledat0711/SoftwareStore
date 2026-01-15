import { NextResponse } from "next/server";

import { buildOrderItems } from "@/lib/orders";
import { createPaypalOrder } from "@/lib/paypal";

type IncomingItem = { id?: string; quantity?: number };

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json().catch(() => null);
  const rawItems: IncomingItem[] = Array.isArray(body?.items)
    ? body.items
    : [];

  const items = rawItems
    .map((item) => ({
      id: String(item?.id ?? "").trim(),
      quantity: Number(item?.quantity ?? 0),
    }))
    .filter((item) => item.id && Number.isFinite(item.quantity));

  if (!items.length) {
    return NextResponse.json(
      { error: "Missing or invalid items" },
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
