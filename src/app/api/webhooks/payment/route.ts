import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { orderService } from "@/lib/services/orderService";

export const runtime = "nodejs";

const payloadSchema = z.object({
  orderId: z.string().min(1),
  status: z.enum(["paid", "failed"]),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = payloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }

    const { orderId, status } = parsed.data;

    if (status === "paid") {
      await orderService.markPaid(orderId);
    } else {
      await orderService.markFailed(orderId);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[payment-webhook] error", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
