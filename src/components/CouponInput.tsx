"use client";

import { useState } from "react";
import { useCart } from "@/components/CartProvider";

type Props = {
  className?: string;
};

export default function CouponInput({ className = "" }: Props) {
  const { couponCode, applyCoupon, removeCoupon, ready } = useCart();
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );

  const handleApply = async () => {
    if (!ready) return;
    setStatus("loading");
    const result = await applyCoupon(code.trim());
    setStatus(result.ok ? "success" : "error");
    setMessage(result.message);
  };

  const handleRemove = async () => {
    setStatus("loading");
    await removeCoupon();
    setMessage("Đã hủy coupon");
    setStatus("success");
    setCode("");
  };

  return (
    <div className={`grid gap-2 ${className}`}>
      <div className="flex gap-2">
        <input
          type="text"
          value={couponCode ?? code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Nhập mã giảm giá"
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
          disabled={!!couponCode || status === "loading"}
        />
        {couponCode ? (
          <button
            type="button"
            onClick={handleRemove}
            className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
            disabled={status === "loading"}
          >
            Remove
          </button>
        ) : (
          <button
            type="button"
            onClick={handleApply}
            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            disabled={status === "loading"}
          >
            Apply
          </button>
        )}
      </div>
      {message && (
        <p
          className={`text-xs ${
            status === "success" ? "text-emerald-700" : "text-red-600"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
