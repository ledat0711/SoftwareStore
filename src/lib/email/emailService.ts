import { Resend } from "resend";
import { EmailStatus, EmailType, Prisma } from "@prisma/client";
import { ReactElement, createElement } from "react";
import prisma from "@/lib/prisma";
import OrderSuccessEmail from "@/emails/OrderSuccessEmail";
import OrderFailedEmail from "@/emails/OrderFailedEmail";
import CartAbandonedEmail from "@/emails/CartAbandonedEmail";

const resendApiKey = process.env.RESEND_API_KEY;
const resendFrom = process.env.RESEND_FROM;

if (!resendApiKey) {
  console.warn("[email] RESEND_API_KEY is not set. Emails will fail until configured.");
}

if (!resendFrom) {
  console.warn("[email] RESEND_FROM is not set. Emails will fail until configured.");
}

const resend = new Resend(resendApiKey || "");

const MAX_RETRY = 3;

type BaseMeta = {
  userId?: string | null;
  orderId?: string | null;
  cartId?: string | null;
};

type SendPayload = BaseMeta & {
  type: EmailType;
  to: string;
  subject: string;
  react: ReactElement;
};

function buildUniqueKey(type: EmailType, meta: BaseMeta) {
  if (meta.orderId) return `${type}:order:${meta.orderId}`;
  if (meta.cartId) return `${type}:cart:${meta.cartId}`;
  if (meta.userId) return `${type}:user:${meta.userId}`;
  return `${type}:recipient:${Math.random().toString(36).slice(2)}`;
}

async function backoff(attempt: number) {
  const ms = Math.min(1000 * 2 ** attempt, 8000);
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function upsertLog(uniqueKey: string, data: Prisma.EmailLogUncheckedCreateInput) {
  return prisma.emailLog.upsert({
    where: { uniqueKey },
    create: data,
    update: {
      status: data.status,
      retryCount: data.retryCount,
      lastError: data.lastError,
      sentAt: data.sentAt,
    },
  });
}

async function sendWithLogging(payload: SendPayload) {
  const uniqueKey = buildUniqueKey(payload.type, payload);
  const existing = await prisma.emailLog.findUnique({ where: { uniqueKey } });

  if (existing?.status === EmailStatus.SENT) {
    return { skipped: true, reason: "already-sent", uniqueKey };
  }

  let retryCount = existing?.retryCount ?? 0;

  while (retryCount < MAX_RETRY) {
    try {
      await upsertLog(uniqueKey, {
        id: existing?.id ?? undefined,
        uniqueKey,
        type: payload.type,
        status: EmailStatus.PENDING,
        retryCount,
        lastError: existing?.lastError ?? null,
        userId: payload.userId ?? null,
        orderId: payload.orderId ?? null,
        cartId: payload.cartId ?? null,
      });

      const { error } = await resend.emails.send({
        from: resendFrom || "no-reply@example.com",
        to: payload.to,
        subject: payload.subject,
        react: payload.react,
      });

      if (error) {
        throw error;
      }

      await upsertLog(uniqueKey, {
        id: existing?.id ?? undefined,
        uniqueKey,
        type: payload.type,
        status: EmailStatus.SENT,
        retryCount,
        lastError: null,
        userId: payload.userId ?? null,
        orderId: payload.orderId ?? null,
        cartId: payload.cartId ?? null,
        sentAt: new Date(),
      });

      return { uniqueKey, retryCount };
    } catch (err) {
      retryCount += 1;
      await upsertLog(uniqueKey, {
        id: existing?.id ?? undefined,
        uniqueKey,
        type: payload.type,
        status: retryCount >= MAX_RETRY ? EmailStatus.FAILED : EmailStatus.PENDING,
        retryCount,
        lastError: err instanceof Error ? err.message : String(err),
        userId: payload.userId ?? null,
        orderId: payload.orderId ?? null,
        cartId: payload.cartId ?? null,
      });

      if (retryCount >= MAX_RETRY) {
        throw err;
      }

      await backoff(retryCount);
    }
  }

  return { uniqueKey, retryCount };
}

export const emailService = {
  async sendOrderSuccess(params: {
    order: {
      id: string;
      code: string;
      total: number;
      subtotal?: number | null;
      discountTotal?: number | null;
    };
    to: string;
    userId?: string | null;
  }) {
    const subject = `Đơn hàng ${params.order.code} đã thanh toán thành công`;
    
    return sendWithLogging({
      type: EmailType.ORDER_SUCCESS,
      to: params.to,
      subject,
      react: createElement(OrderSuccessEmail, {
        orderCode: params.order.code,
        total: params.order.total,
        subtotal: params.order.subtotal ?? params.order.total,
        discountTotal: params.order.discountTotal ?? 0,
        orderId: params.order.id,
        appUrl: process.env.APP_URL,
      }),
      orderId: params.order.id,
      userId: params.userId,
    });
  },

  async sendOrderFailed(params: {
    order: { id: string; code: string; total: number };
    to: string;
    userId?: string | null;
  }) {
    const subject = `Thanh toán đơn ${params.order.code} thất bại`;
    return sendWithLogging({
      type: EmailType.ORDER_FAILED,
      to: params.to,
      subject,
      react: createElement(OrderFailedEmail, {
        orderCode: params.order.code,
        total: params.order.total,
        orderId: params.order.id,
        appUrl: process.env.APP_URL,
      }),
      orderId: params.order.id,
      userId: params.userId,
    });
  },

  async sendCartAbandoned(params: { cartId: string; to: string; userId?: string | null }) {
    const subject = "Hoàn tất giỏ hàng của bạn";
    return sendWithLogging({
      type: EmailType.CART_ABANDONED,
      to: params.to,
      subject,
      react: createElement(CartAbandonedEmail, { appUrl: process.env.APP_URL }),
      cartId: params.cartId,
      userId: params.userId,
    });
  },
};
