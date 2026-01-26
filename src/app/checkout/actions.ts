"use server";

import { auth } from "@/auth";
import { OrderStatus } from "@prisma/client";
import { z } from "zod";

import { createOrderFromCart } from "@/lib/orders";
import { orderService } from "@/lib/services/orderService";

const payloadSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        quantity: z.number().int().min(1),
      }),
    )
    .min(1),
  email: z.string().email().optional(),
  paypalOrderId: z.string().optional(), // for observability/debug only
});

export async function handlePaypalErrorAction(input: unknown) {
  const parsed = payloadSchema.parse(input);
  const session = await auth();

  const userId = session?.user?.id ?? null;
  const email = session?.user?.email ?? parsed.email;

  if (!email) {
    throw new Error("Missing email for failed PayPal payment.");
  }

  // Create a FAILED order snapshot to keep context and allow email content to link back.
  const order = await createOrderFromCart(
    userId,
    parsed.items,
    email,
    OrderStatus.FAILED,
  );

  // Send transactional email (server-side) with logging + retry handled inside emailService.
  await orderService.markFailed(order.id);

  return { ok: true, orderId: order.id };
}
