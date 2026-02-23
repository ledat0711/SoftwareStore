import {
  DiscountScope,
  DiscountStatus,
  DiscountValueType,
  DiscountUsageStatus,
} from "@prisma/client";

export type Discount = {
  id: string;
  code: string | null;
  name: string;
  description?: string | null;
  scope: DiscountScope;
  value: number;
  valueType: DiscountValueType;
  maxValue?: number | null;
  minOrderAmount?: number | null;
  allowGuest: boolean;
  maxUsage?: number | null;
  maxUsagePerUser?: number | null;
  usageCount: number;
  status: DiscountStatus;
  startAt?: string | null;
  endAt?: string | null;
  products?: { productId: string }[];
  createdAt?: string;
  updatedAt?: string;
};

export type DiscountUsage = {
  id: string;
  discountId: string;
  userId?: string | null;
  cartId?: string | null;
  orderId?: string | null;
  amount: number;
  status: DiscountUsageStatus;
  createdAt: string;
  updatedAt: string;
  discount?: { name: string; code: string | null };
  user?: { id: string; email: string | null };
  order?: { id: string; code: string | null };
  cart?: { id: string };
};
