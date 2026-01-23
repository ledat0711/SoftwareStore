import { OrderStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { emailService } from "@/lib/email/emailService";

type OrderWithUser = Awaited<ReturnType<typeof loadOrder>>;

async function loadOrder(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: { user: { select: { id: true, email: true, name: true } } },
  });
}

function resolveRecipient(order: OrderWithUser) {
  return order?.email ?? order?.guestEmail ?? order?.user?.email ?? null;
}

async function setStatus(orderId: string, status: OrderStatus) {
  const order = await loadOrder(orderId);
  if (!order) throw new Error("Order not found");

  if (order.status === status) return order;

  return prisma.order.update({
    where: { id: orderId },
    data: {
      status,
      email: order.email ?? order.guestEmail ?? order.user?.email ?? null,
    },
    include: { user: { select: { id: true, email: true, name: true } } },
  });
}

export const orderService = {
  async markPaid(orderId: string) {
    const order = await setStatus(orderId, OrderStatus.PAID);
    const recipient = resolveRecipient(order);

    if (recipient) {
      await emailService.sendOrderSuccess({
        order: { id: order.id, code: order.code, total: order.total },
        to: recipient,
        userId: order.userId,
      });
    }

    return order;
  },

  async markFailed(orderId: string) {
    const order = await setStatus(orderId, OrderStatus.FAILED);
    const recipient = resolveRecipient(order);

    if (recipient) {
      await emailService.sendOrderFailed({
        order: { id: order.id, code: order.code, total: order.total },
        to: recipient,
        userId: order.userId,
      });
    }

    return order;
  },
};
