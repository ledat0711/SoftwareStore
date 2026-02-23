import { NextResponse } from "next/server";
import {
  DiscountScope,
  DiscountStatus,
  DiscountValueType,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

function parseDate(value: unknown) {
  const s = typeof value === "string" ? value : null;
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function normalizeCode(code?: string | null) {
  if (!code) return null;
  const trimmed = code.trim().toUpperCase();
  if (!trimmed) return null;
  if (trimmed.length > 5) throw new Error("Mã coupon tối đa 5 ký tự");
  return trimmed;
}

type DiscountPayload = {
  name?: string;
  description?: string | null;
  scope?: DiscountScope;
  value?: number;
  valueType?: DiscountValueType;
  maxValue?: number | null;
  minOrderAmount?: number | null;
  allowGuest?: boolean;
  maxUsage?: number | null;
  maxUsagePerUser?: number | null;
  startAt?: string | null;
  endAt?: string | null;
  status?: DiscountStatus;
  code?: string | null;
  productIds?: string[];
};

function buildUpdate(payload: DiscountPayload): Prisma.DiscountUncheckedUpdateInput {
  const data: Prisma.DiscountUncheckedUpdateInput = {};

  if (payload.name !== undefined) data.name = payload.name;
  if (payload.description !== undefined) data.description = payload.description;
  if (payload.scope !== undefined) data.scope = payload.scope;
  if (payload.value !== undefined) data.value = payload.value;
  if (payload.valueType !== undefined) data.valueType = payload.valueType;
  if (payload.maxValue !== undefined) data.maxValue = payload.maxValue;
  if (payload.minOrderAmount !== undefined) data.minOrderAmount = payload.minOrderAmount;
  if (payload.allowGuest !== undefined) data.allowGuest = payload.allowGuest;
  if (payload.maxUsage !== undefined) data.maxUsage = payload.maxUsage;
  if (payload.maxUsagePerUser !== undefined) {
    data.maxUsagePerUser = payload.maxUsagePerUser;
  }
  if (payload.startAt !== undefined) data.startAt = parseDate(payload.startAt);
  if (payload.endAt !== undefined) data.endAt = parseDate(payload.endAt);
  if (payload.status !== undefined) data.status = payload.status;
  if (payload.code !== undefined) data.code = normalizeCode(payload.code);

  return data;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const discount = await prisma.discount.findUnique({
    where: { id },
    include: {
      products: true,
      usages: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          user: { select: { id: true, email: true } },
          order: { select: { id: true, code: true } },
          cart: { select: { id: true } },
        },
      },
    },
  });

  if (!discount) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ discount });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as DiscountPayload | null;
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  try {
    const data = buildUpdate(body);
    const productIds = Array.isArray(body.productIds)
      ? body.productIds.filter(Boolean)
      : undefined;

    const discount = await prisma.$transaction(async (tx) => {
      const updated = await tx.discount.update({
        where: { id },
        data,
      });

      const shouldResetProducts =
        updated.scope !== DiscountScope.PRODUCT || Array.isArray(productIds);

      if (shouldResetProducts) {
        await tx.discountProduct.deleteMany({ where: { discountId: id } });
      }

      if (updated.scope === DiscountScope.PRODUCT && productIds && productIds.length) {
        await tx.discountProduct.createMany({
          data: productIds.map((pid) => ({ discountId: id, productId: pid })),
        });
      }

      return updated;
    });

    const withRelations = await prisma.discount.findUnique({
      where: { id: discount.id },
      include: { products: true },
    });

    return NextResponse.json({ discount: withRelations });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update discount";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
