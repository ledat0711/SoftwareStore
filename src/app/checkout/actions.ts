"use server";

import { auth } from "@/auth";
import { OrderStatus } from "@prisma/client";
import { z as zod } from "zod";

import { createOrderFromCart } from "@/lib/orders";
import { orderService } from "@/lib/services/orderService";

const payloadSchema = zod.object({
  items: zod
    .array(
      // {
      //   items: [
      //     {
      //       id: "string không rỗng",
      //       quantity: số nguyên >= 1
      //     }
      //   ],
      //   email?: "email hợp lệ",
      //   paypalOrderId?: "string"
      // }
      zod.object({
        id: zod.string().min(1),
        quantity: zod.number().int().min(1),
      }),
    )
    .min(1),

  email: zod.string().email().optional(),
  paypalOrderId: zod.string().optional(), // for observability/debug only
});

export async function handlePaypalErrorAction(inputData: unknown) {
  // parse() của Zod sẽ:
  //    Kiểm tra input có đúng shape + kiểu dữ liệu + ràng buộc không
  //    Nếu đúng → trả về dữ liệu đã được validate (parsed)
  //    Nếu sai → ném lỗi (throw Error) và dừng toàn bộ hàm
  const parsedData = payloadSchema.parse(inputData);
  const session = await auth();

  const userId = session?.user?.id ?? null;
  const email = session?.user?.email ?? parsedData.email;

  if (!email) {
    throw new Error("Missing email for failed PayPal payment.");
  }

  // Create a FAILED order snapshot to keep context and allow email content to link back.
  const order = await createOrderFromCart(
    userId,
    parsedData.items,
    email,
    OrderStatus.FAILED,
  );

  // Send transactional email (server-side) with logging + retry handled inside emailService.
  await orderService.markFailed(order.id);

  return { ok: true, orderId: order.id };
}
