import {
  DiscountScope,
  DiscountStatus,
  DiscountUsageStatus,
  DiscountValueType,
  Prisma,
  PrismaClient,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

type TxClient = Prisma.TransactionClient | PrismaClient;

export type PricedItem = {
  productId: string;
  quantity: number;
  price: number;
};

type DiscountWithProducts = Prisma.DiscountGetPayload<{
  include: { products: true };
}>;

export type PricingDiscountLine = {
  id: string;
  scope: DiscountScope;
  name: string;
  code?: string | null;
  amount: number;
};

export type PricingBreakdown = {
  subtotal: number;
  discounts: PricingDiscountLine[];
  total: number;
};

function clampMoney(value: number) {
  return Math.max(0, Math.round(value * 100) / 100); // round to cents
}

function isWithinWindow(discount: DiscountWithProducts, now: Date) {
  if (discount.startAt && discount.startAt > now) return false;
  if (discount.endAt && discount.endAt < now) return false;
  return true;
}

function calculateDiscountAmount(
  discount: DiscountWithProducts,
  baseAmount: number,
) {
  if (baseAmount <= 0) return 0;
  const raw =
    discount.valueType === DiscountValueType.PERCENT
      ? (baseAmount * discount.value) / 100
      : discount.value;
  const capped =
    discount.maxValue != null ? Math.min(raw, discount.maxValue) : raw;
  return clampMoney(capped);
}

function aggregateProductDiscounts(
  items: PricedItem[],
  discounts: DiscountWithProducts[],
) {
  const productDiscounts = discounts.filter(
    (d) => d.scope === DiscountScope.PRODUCT,
  );

  const perDiscountAmount = new Map<string, number>();

  for (const item of items) {
    const applicable = productDiscounts.filter((d) =>
      d.products.some((p) => p.productId === item.productId),
    );
    if (!applicable.length) continue;

    // pick the single best discount for this item to avoid stacking
    let best: { discount: DiscountWithProducts; amount: number } | null = null;
    for (const discount of applicable) {
      const amount = calculateDiscountAmount(
        discount,
        item.price * item.quantity,
      );
      if (!best || amount > best.amount) {
        best = { discount, amount };
      }
    }

    if (best && best.amount > 0) {
      const current = perDiscountAmount.get(best.discount.id) ?? 0;
      const next = best.discount.maxValue
        ? Math.min(current + best.amount, best.discount.maxValue)
        : current + best.amount;
      perDiscountAmount.set(best.discount.id, next);
    }
  }

  return perDiscountAmount;
}

function pickBestGlobalDiscount(
  base: number,
  discounts: DiscountWithProducts[],
) {
  const globals = discounts.filter((d) => d.scope === DiscountScope.GLOBAL);
  let best: { discount: DiscountWithProducts; amount: number } | null = null;

  for (const discount of globals) {
    const amount = calculateDiscountAmount(discount, base);
    if (!best || amount > best.amount) {
      best = { discount, amount };
    }
  }

  return best;
}

export async function loadAutomaticDiscounts(
  productIds: string[],
  tx: TxClient = prisma,
) {
  const now = new Date();
  return tx.discount.findMany({
    where: {
      status: DiscountStatus.ACTIVE,
      AND: [
        { startAt: { lte: now } },
        { OR: [{ endAt: null }, { endAt: { gte: now } }] },
        {
          OR: [
            { scope: DiscountScope.GLOBAL },
            {
              scope: DiscountScope.PRODUCT,
              products: { some: { productId: { in: productIds } } },
            },
          ],
        },
      ],
    },
    include: { products: true },
  });
}

async function filterAutomaticDiscountsByPerUserLimit(
  discounts: DiscountWithProducts[],
  userId?: string | null,
  tx: TxClient = prisma,
) {
  if (!userId) return discounts;

  const perUserLimited = discounts.filter((d) => (d.maxUsagePerUser ?? 0) > 0);
  if (!perUserLimited.length) return discounts;

  const usageRows = await tx.discountUsage.groupBy({
    by: ["discountId"],
    where: {
      userId,
      discountId: { in: perUserLimited.map((d) => d.id) },
      status: DiscountUsageStatus.COMPLETED,
    },
    _count: { _all: true },
  });

  const usedByDiscountId = new Map(
    usageRows.map((row) => [row.discountId, row._count._all]),
  );

  return discounts.filter((discount) => {
    if (!discount.maxUsagePerUser) return true;
    const used = usedByDiscountId.get(discount.id) ?? 0;
    return used < discount.maxUsagePerUser;
  });
}

export function computePricing(
  items: PricedItem[],
  automaticDiscounts: DiscountWithProducts[],
  coupon?: DiscountWithProducts | null,
): PricingBreakdown {
  const subtotal = clampMoney(
    items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  );

  const discounts: PricingDiscountLine[] = [];
  let running = subtotal;

  // 1) product-level discounts (best per item, aggregated per discount)
  const perDiscountAmount = aggregateProductDiscounts(
    items,
    automaticDiscounts,
  );
  for (const [id, amount] of perDiscountAmount.entries()) {
    if (amount <= 0) continue;
    const discount = automaticDiscounts.find((d) => d.id === id);
    if (!discount) continue;
    discounts.push({
      id: discount.id,
      scope: discount.scope,
      name: discount.name,
      code: discount.code,
      amount,
    });
    running -= amount;
  }

  // 2) single best global discount
  const bestGlobal = pickBestGlobalDiscount(running, automaticDiscounts);
  if (bestGlobal && bestGlobal.amount > 0) {
    discounts.push({
      id: bestGlobal.discount.id,
      scope: bestGlobal.discount.scope,
      name: bestGlobal.discount.name,
      code: bestGlobal.discount.code,
      amount: bestGlobal.amount,
    });
    running -= bestGlobal.amount;
  }

  // 3) optional coupon (only one at a time)
  if (coupon) {
    const amount = calculateDiscountAmount(coupon, running);
    if (amount > 0) {
      discounts.push({
        id: coupon.id,
        scope: coupon.scope,
        name: coupon.name,
        code: coupon.code,
        amount,
      });
      running -= amount;
    }
  }

  const total = clampMoney(running);
  return { subtotal, discounts, total };
}

type ReserveCouponParams = {
  code: string;
  cartId: string;
  userId?: string | null;
  cartSubtotal: number;
};

type CouponValidationParams = {
  code: string;
  userId?: string | null;
  cartId?: string;
  cartSubtotal: number;
  tx?: TxClient;
};

async function loadCouponForPreview({
  code,
  userId,
  cartId,
  cartSubtotal,
  tx = prisma,
}: CouponValidationParams) {
  const normalized = code.trim().toUpperCase();
  if (!normalized) throw new Error("Coupon code is required");

  const now = new Date();

  const coupon = await tx.discount.findFirst({
    where: {
      code: normalized,
      scope: DiscountScope.COUPON,
      status: DiscountStatus.ACTIVE,
    },
    include: { products: true },
  });

  if (!coupon) throw new Error("Coupon khong hop le hoac da het han");
  if (!isWithinWindow(coupon, now))
    throw new Error("Coupon khong con hieu luc");
  if (!coupon.allowGuest && !userId) {
    throw new Error("Coupon chi ap dung cho nguoi dung da dang nhap");
  }
  if (coupon.minOrderAmount && cartSubtotal < coupon.minOrderAmount) {
    throw new Error("Khong dat gia tri don hang toi thieu cho coupon nay");
  }

  if (coupon.maxUsage) {
    const usage = await tx.discountUsage.count({
      where: {
        discountId: coupon.id,
        status: {
          in: [DiscountUsageStatus.PENDING, DiscountUsageStatus.COMPLETED],
        },
        ...(cartId
          ? { NOT: { cartId, status: DiscountUsageStatus.PENDING } }
          : {}),
      },
    });
    if (usage >= coupon.maxUsage) {
      throw new Error("Coupon da dat gioi han su dung");
    }
  }

  if (coupon.maxUsagePerUser && userId) {
    const usageByUser = await tx.discountUsage.count({
      where: {
        discountId: coupon.id,
        userId,
        status: {
          in: [DiscountUsageStatus.PENDING, DiscountUsageStatus.COMPLETED],
        },
        ...(cartId
          ? { NOT: { cartId, status: DiscountUsageStatus.PENDING } }
          : {}),
      },
    });
    if (usageByUser >= coupon.maxUsagePerUser) {
      throw new Error("Ban da dung coupon nay toi da so lan cho phep");
    }
  }

  return coupon;
}

export async function reserveCouponCode({
  code,
  cartId,
  userId,
  cartSubtotal,
}: ReserveCouponParams) {
  const normalized = code.trim().toUpperCase();
  if (!normalized) {
    throw new Error("Coupon code is required");
  }

  const now = new Date();

  return prisma.$transaction(
    async (tx) => {
      const coupon = await tx.discount.findFirst({
        where: {
          code: normalized,
          scope: DiscountScope.COUPON,
          status: DiscountStatus.ACTIVE,
        },
        include: { products: true },
      });

      if (!coupon) throw new Error("Coupon không hợp lệ hoặc đã hết hạn");
      if (!isWithinWindow(coupon, now))
        throw new Error("Coupon không còn hiệu lực");
      if (!coupon.allowGuest && !userId) {
        throw new Error("Coupon chỉ áp dụng cho người dùng đã đăng nhập");
      }
      if (coupon.minOrderAmount && cartSubtotal < coupon.minOrderAmount) {
        throw new Error("Không đạt giá trị đơn hàng tối thiểu cho coupon này");
      }

      if (coupon.maxUsage) {
        const usage = await tx.discountUsage.count({
          where: {
            discountId: coupon.id,
            status: {
              in: [DiscountUsageStatus.PENDING, DiscountUsageStatus.COMPLETED],
            },
            NOT: { cartId, status: DiscountUsageStatus.PENDING },
          },
        });
        if (usage >= coupon.maxUsage) {
          throw new Error("Coupon đã đạt giới hạn sử dụng");
        }
      }

      if (coupon.maxUsagePerUser && userId) {
        const usageByUser = await tx.discountUsage.count({
          where: {
            discountId: coupon.id,
            userId,
            status: {
              in: [DiscountUsageStatus.PENDING, DiscountUsageStatus.COMPLETED],
            },
            NOT: { cartId, status: DiscountUsageStatus.PENDING },
          },
        });
        if (usageByUser >= coupon.maxUsagePerUser) {
          throw new Error("Bạn đã dùng coupon này tối đa số lần cho phép");
        }
      }

      const existingUsage = await tx.discountUsage.findFirst({
        where: { discountId: coupon.id, cartId },
      });

      if (existingUsage) {
        if (existingUsage.status === DiscountUsageStatus.COMPLETED) {
          // Giữ record đã hoàn tất nhưng giải phóng cartId để không chặn lần dùng sau
          await tx.discountUsage.update({
            where: { id: existingUsage.id },
            data: { cartId: null },
          });
        } else if (existingUsage.status !== DiscountUsageStatus.PENDING) {
          const updated = await tx.discountUsage.update({
            where: { id: existingUsage.id },
            data: {
              status: DiscountUsageStatus.PENDING,
              userId: userId ?? null,
            },
          });
          return { coupon, usage: updated };
        } else {
          return { coupon, usage: existingUsage };
        }
      }

      const usage = await tx.discountUsage.create({
        data: {
          discountId: coupon.id,
          cartId,
          userId: userId ?? null,
          status: DiscountUsageStatus.PENDING,
        },
      });

      return { coupon, usage };
    },
    { isolationLevel: "Serializable" },
  );
}

export async function cancelCouponReservation(usageId: string) {
  await prisma.$transaction(
    async (tx) => {
      const usage = await tx.discountUsage.findUnique({
        where: { id: usageId },
      });
      if (!usage || usage.status !== DiscountUsageStatus.PENDING) return;

      await tx.discountUsage.update({
        where: { id: usageId },
        data: { status: DiscountUsageStatus.CANCELLED },
      });
    },
    { isolationLevel: "Serializable" },
  );
}

type FinalizeParams = {
  usageId: string;
  orderId: string;
  amount: number;
};

export async function finalizeCouponUsage({
  usageId,
  orderId,
  amount,
}: FinalizeParams) {
  await prisma.$transaction(
    async (tx) => {
      const usage = await tx.discountUsage.findUnique({
        where: { id: usageId },
      });
      if (!usage) return;
      if (usage.status === DiscountUsageStatus.COMPLETED) return;

      await tx.discountUsage.update({
        where: { id: usageId },
        data: {
          status: DiscountUsageStatus.COMPLETED,
          orderId,
          cartId: null, // giải phóng ràng buộc (discountId, cartId) để user có thể dùng lại coupon ở cart sau
          amount: clampMoney(amount),
        },
      });

      await tx.discount.update({
        where: { id: usage.discountId },
        data: { usageCount: { increment: 1 } },
      });
    },
    { isolationLevel: "Serializable" },
  );
}

type FinalizeAutomaticDiscountUsagesParams = {
  orderId: string;
  userId?: string | null;
  discounts: PricingDiscountLine[];
};

export async function finalizeAutomaticDiscountUsages({
  orderId,
  userId,
  discounts,
}: FinalizeAutomaticDiscountUsagesParams) {
  const automaticDiscounts = discounts.filter(
    (line) =>
      line.amount > 0 &&
      (line.scope === DiscountScope.GLOBAL ||
        line.scope === DiscountScope.PRODUCT),
  );
  if (!automaticDiscounts.length) return;

  // Defensive dedupe: pricing should already aggregate by discount id.
  const uniqueByDiscountId = new Map<string, PricingDiscountLine>();
  for (const line of automaticDiscounts) {
    if (!uniqueByDiscountId.has(line.id)) {
      uniqueByDiscountId.set(line.id, line);
    }
  }

  await prisma.$transaction(
    async (tx) => {
      for (const line of uniqueByDiscountId.values()) {
        const amount = clampMoney(line.amount);
        const existingUsage = await tx.discountUsage.findFirst({
          where: {
            discountId: line.id,
            orderId,
          },
        });

        if (existingUsage) {
          const nextUserId = userId ?? existingUsage.userId ?? null;
          if (existingUsage.status !== DiscountUsageStatus.COMPLETED) {
            await tx.discountUsage.update({
              where: { id: existingUsage.id },
              data: {
                status: DiscountUsageStatus.COMPLETED,
                userId: nextUserId,
                amount,
                cartId: null,
              },
            });

            await tx.discount.update({
              where: { id: line.id },
              data: { usageCount: { increment: 1 } },
            });
          } else if (
            existingUsage.amount !== amount ||
            existingUsage.userId !== nextUserId
          ) {
            await tx.discountUsage.update({
              where: { id: existingUsage.id },
              data: {
                userId: nextUserId,
                amount,
              },
            });
          }
          continue;
        }

        await tx.discountUsage.create({
          data: {
            discountId: line.id,
            userId: userId ?? null,
            orderId,
            amount,
            status: DiscountUsageStatus.COMPLETED,
          },
        });

        await tx.discount.update({
          where: { id: line.id },
          data: { usageCount: { increment: 1 } },
        });
      }
    },
    { isolationLevel: "Serializable" },
  );
}

export async function computeCartPricingWithDiscounts(
  items: PricedItem[],
  options: {
    couponCode?: string;
    cartId?: string;
    userId?: string | null;
    reserveCoupon?: boolean;
  } = {},
) {
  const subtotal = clampMoney(
    items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  );

  const automaticDiscountCandidates = (
    await loadAutomaticDiscounts(items.map((i) => i.productId))
  ).filter(
    (d) =>
      (!d.minOrderAmount || subtotal >= (d.minOrderAmount ?? 0)) &&
      (!d.maxUsage || d.usageCount < d.maxUsage),
  );

  const automaticDiscounts = await filterAutomaticDiscountsByPerUserLimit(
    automaticDiscountCandidates,
    options.userId ?? null,
  );

  let coupon: DiscountWithProducts | null = null;
  let usageId: string | undefined;

  if (options.couponCode && options.cartId && options.reserveCoupon !== false) {
    const { coupon: foundCoupon, usage } = await reserveCouponCode({
      code: options.couponCode,
      cartId: options.cartId,
      userId: options.userId ?? null,
      cartSubtotal: subtotal,
    });
    coupon = foundCoupon;
    usageId = usage.id;
  } else if (options.couponCode) {
    coupon = await loadCouponForPreview({
      code: options.couponCode,
      userId: options.userId ?? null,
      cartId: options.cartId,
      cartSubtotal: subtotal,
    });
  }

  const pricing = computePricing(
    items,
    automaticDiscounts,
    coupon ?? undefined,
  );
  return { pricing, coupon, usageId };
}
