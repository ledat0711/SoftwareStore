import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createOrderFromCart } from "@/lib/orders";

type IncomingItem = { id?: string; quantity?: number };

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id ?? null;

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

  try {
    const order = await createOrderFromCart(userId, items);
    return NextResponse.json({ order });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to create order" },
      { status: 500 }
    );
  }
}
