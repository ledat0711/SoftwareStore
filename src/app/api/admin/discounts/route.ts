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

function buildData(payload: DiscountPayload): Prisma.DiscountUncheckedCreateInput {
  const {
    name,
    description,
    scope,
    value,
    valueType,
    maxValue,
    minOrderAmount,
    allowGuest,
    maxUsage,
    maxUsagePerUser,
    startAt,
    endAt,
    status,
    code,
  } = payload;

  if (!name) throw new Error("Tên discount là bắt buộc");
  if (value === undefined || value === null) {
    throw new Error("Giá trị giảm giá là bắt buộc");
  }
  if (!scope) throw new Error("Scope là bắt buộc");
  if (!valueType) throw new Error("Value type là bắt buộc");

  const normalizedCode = normalizeCode(code);

  return {
    name,
    description: description ?? null,
    scope,
    value,
    valueType,
    maxValue: maxValue ?? null,
    minOrderAmount: minOrderAmount ?? 0,
    allowGuest: allowGuest ?? true,
    maxUsage: maxUsage ?? null,
    maxUsagePerUser: maxUsagePerUser ?? null,
    startAt: parseDate(startAt),
    endAt: parseDate(endAt),
    status: status ?? DiscountStatus.ACTIVE,
    code: normalizedCode,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope") as DiscountScope | null;
  const status = searchParams.get("status") as DiscountStatus | null;

  const where: Prisma.DiscountWhereInput = {};
  if (scope) where.scope = scope;
  if (status) where.status = status;

  const discounts = await prisma.discount.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { products: true },
  });

  return NextResponse.json({ discounts });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as DiscountPayload | null;
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  try {
    const data = buildData(body);
    const productIds = Array.isArray(body.productIds)
      ? body.productIds.filter(Boolean)
      : [];

    const discount = await prisma.discount.create({
      data: {
        ...data,
        products:
          data.scope === DiscountScope.PRODUCT && productIds.length
            ? { createMany: { data: productIds.map((pid) => ({ productId: pid })) } }
            : undefined,
      },
      include: { products: true },
    });

    return NextResponse.json({ discount });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create discount";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
