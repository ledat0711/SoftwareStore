import {
  DiscountScope,
  DiscountStatus,
  DiscountValueType,
  Prisma,
  PrismaClient,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { computeCartPricingWithDiscounts } from "@/lib/discounts";

type TxClient = Prisma.TransactionClient | PrismaClient;

type DiscountWithProducts = Prisma.DiscountGetPayload<{
  include: { products: true };
}>;

type ProductForPricing = Prisma.ProductGetPayload<{
  select: {
    id: true;
    slug: true;
    title: true;
    description: true;
    image: true;
    price: true;
    rating: true;
    category: true;
    platform: true;
    badge: true;
  };
}>;

export type ProductPricing = {
  originalPrice: number;
  discountAmount: number;
  finalPrice: number;
  appliedDiscount?: {
    id: string;
    label: string;
    expiresAt: Date | null;
  };
};

export type ProductWithPricing = ProductForPricing & { pricing: ProductPricing };
export type GlobalDiscountInfo = {
  id: string;
  name: string;
  value: number;
  valueType: DiscountValueType;
  endsAt: Date | null;
};

const clampMoney = (value: number) =>
  Math.max(0, Math.round(value * 100) / 100);

const isWithinWindow = (discount: DiscountWithProducts, now: Date) =>
  (!discount.startAt || discount.startAt <= now) &&
  (!discount.endAt || discount.endAt >= now);

const formatLabel = (discount: DiscountWithProducts) =>
  discount.valueType === DiscountValueType.PERCENT
    ? `${discount.value}% OFF`
    : `-$${discount.value.toFixed(2)}`;

function calculateAmount(
  discount: DiscountWithProducts,
  base: number,
): number {
  if (base <= 0) return 0;
  const raw =
    discount.valueType === DiscountValueType.PERCENT
      ? (base * discount.value) / 100
      : discount.value;
  const capped =
    discount.maxValue != null ? Math.min(raw, discount.maxValue) : raw;
  return clampMoney(capped);
}

async function loadActiveProductDiscounts(
  productIds: string[],
  tx: TxClient = prisma,
) {
  const now = new Date();
  return tx.discount.findMany({
    where: {
      status: DiscountStatus.ACTIVE,
      startAt: { lte: now },
      OR: [{ endAt: null }, { endAt: { gte: now } }],
      AND: [
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

function applyProductPricing(
  products: ProductForPricing[],
  discounts: DiscountWithProducts[],
  now = new Date(),
): ProductWithPricing[] {
  return products.map((product) => {
    const applicable = discounts.filter(
      (d) =>
        d.scope === DiscountScope.PRODUCT &&
        isWithinWindow(d, now) &&
        d.products.some((p) => p.productId === product.id),
    );

    const best = applicable.reduce<
      { discount: DiscountWithProducts | null; amount: number }
    >(
      (current, discount) => {
        const amount = calculateAmount(discount, product.price);
        return !current.discount || amount > current.amount
          ? { discount, amount }
          : current;
      },
      { discount: null, amount: 0 },
    );

    const discountAmount = best.amount;
    const finalPrice = clampMoney(product.price - discountAmount);

    return {
      ...product,
      pricing: {
        originalPrice: product.price,
        discountAmount,
        finalPrice,
        appliedDiscount: best.discount
          ? {
              id: best.discount.id,
              label: formatLabel(best.discount),
              expiresAt: best.discount.endAt ?? null,
            }
          : undefined,
      },
    };
  });
}

export const pricingService = {
  applyProductPricing,
  async getActiveGlobalDiscount(
    tx: TxClient = prisma,
  ): Promise<GlobalDiscountInfo | null> {
    const now = new Date();
    const discount = await tx.discount.findFirst({
      where: {
        scope: DiscountScope.GLOBAL,
        status: DiscountStatus.ACTIVE,
        startAt: { lte: now },
        OR: [{ endAt: null }, { endAt: { gte: now } }],
      },
      orderBy: [{ endAt: "asc" }],
    });
    if (!discount) return null;
    return {
      id: discount.id,
      name: discount.name,
      value: discount.value,
      valueType: discount.valueType,
      endsAt: discount.endAt ?? null,
    };
  },

  async getLatestVisibleProductsWithPricing(limit = 4): Promise<ProductWithPricing[]> {
    const products = await prisma.product.findMany({
      where: { hidden: false, isDeleted: false },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        image: true,
        price: true,
        rating: true,
        category: true,
        platform: true,
        badge: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const discounts = await loadActiveProductDiscounts(products.map((p) => p.id));
    return applyProductPricing(products, discounts);
  },

  async getVisibleProductsWithPricing(
    categoryFilter: string[] = [],
    platformFilter: string[] = [],
  ): Promise<ProductWithPricing[]> {
    const products = await prisma.product.findMany({
      where: {
        hidden: false,
        isDeleted: false,
        category: categoryFilter.length ? { in: categoryFilter } : undefined,
        platform: platformFilter.length ? { in: platformFilter } : undefined,
      },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        image: true,
        price: true,
        rating: true,
        category: true,
        platform: true,
        badge: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const discounts = await loadActiveProductDiscounts(products.map((p) => p.id));
    return applyProductPricing(products, discounts);
  },

  async getProductWithPricing(
    slug: string,
  ): Promise<ProductWithPricing | null> {
    const product = await prisma.product.findFirst({
      where: { slug, isDeleted: false },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        image: true,
        price: true,
        rating: true,
        category: true,
        platform: true,
        badge: true,
      },
    });
    if (!product) return null;

    const discounts = await loadActiveProductDiscounts([product.id]);
    return applyProductPricing([product], discounts)[0];
  },

  // Cart / checkout / PayPal reuse existing pricing pipeline
  priceCart: computeCartPricingWithDiscounts,
};
