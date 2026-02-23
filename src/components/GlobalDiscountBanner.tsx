"use client";

import { DiscountValueType } from "@prisma/client";

type Props = {
  name: string;
  value: number;
  valueType: DiscountValueType;
  endsAt: string | Date | null;
};

function formatValue(value: number, type: DiscountValueType) {
  return type === "PERCENT" ? `${value}% OFF` : `-$${value.toFixed(2)}`;
}

export function GlobalDiscountBanner({ name, value, valueType, endsAt }: Props) {
  return (
    <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 shadow-sm">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <span>
          🔥 {name}: {formatValue(value, valueType)} trên toàn cửa hàng
        </span>
        {endsAt ? (
          <span className="text-xs font-medium text-amber-800">
            Kết thúc: {new Date(endsAt).toLocaleString("vi-VN")}
          </span>
        ) : (
          <span className="text-xs font-medium text-amber-800">
            Áp dụng trong thời gian giới hạn
          </span>
        )}
      </div>
    </div>
  );
}

export default GlobalDiscountBanner;
