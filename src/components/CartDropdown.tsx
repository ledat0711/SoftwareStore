"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/components/CartProvider";
import { currency } from "@/lib/helpers";
import { PricingBreakdown } from "@/lib/discounts";

export default function CartDropdown() {
  const { items, totalItems, subtotal, updateQuantity, removeItem } = useCart();
  const [pricing, setPricing] = useState<PricingBreakdown | null>(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let active = true;
    async function loadPricing() {
      if (!items.length) {
        setPricing(null);
        return;
      }
      setPricingLoading(true);
      try {
        const response = await fetch("/api/pricing/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: items.map((i) => ({ id: i.id, quantity: i.quantity })),
          }),
        });
        const data = await response.json();
        if (response.ok && data?.pricing && active) {
          setPricing(data.pricing as PricingBreakdown);
        } else if (active) {
          setPricing(null);
        }
      } catch {
        if (active) setPricing(null);
      } finally {
        if (active) setPricingLoading(false);
      }
    }
    void loadPricing();
    return () => {
      active = false;
    };
  }, [items]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!open) return;
      const target = event.target as Node;
      if (containerRef.current && !containerRef.current.contains(target)) {
        setOpen(false);
      }
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 6h15l-1.5 9h-12z" />
            <circle cx="9" cy="20" r="1.5" />
            <circle cx="18" cy="20" r="1.5" />
            <path d="M6 6L4 3" />
          </svg>
        </span>
        <span>Cart</span>
        {mounted && totalItems > 0 && (
          <span className="absolute -right-2 -top-2 inline-flex min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[11px] font-bold text-white">
            {totalItems}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 z-50 mt-2 w-[320px] rounded-2xl border border-gray-200 bg-white shadow-xl"
          role="dialog"
          aria-label="Mini cart"
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <span className="text-sm font-semibold text-gray-900">
              Your cart
            </span>
            <span className="text-xs text-gray-500">{totalItems} items</span>
          </div>

          <div className="max-h-64 overflow-y-auto px-4 py-3">
            {items.length === 0 ? (
              <p className="text-sm text-gray-500">Your cart is empty.</p>
            ) : (
              <div className="grid gap-3">
                {items.map((item) => (
                  <div key={item.id} className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-lg border border-gray-100 bg-gray-50">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.title}
                          className="h-full w-full rounded-lg object-contain p-1"
                        />
                      ) : null}
                    </div>
                    <div className="flex-1">
                      <Link
                        href={`/products/${item.slug}`}
                        className="text-sm font-semibold text-gray-900 hover:text-gray-700"
                        onClick={() => setOpen(false)}
                      >
                        {item.title}
                      </Link>
                      <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                        <span>{currency(item.price)}</span>
                        <span>Qty {item.quantity}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="inline-flex items-center rounded-lg border border-gray-200">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                            className="px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                            aria-label={`Decrease ${item.title}`}
                          >
                            -
                          </button>
                          <span className="px-2 text-xs font-semibold text-gray-800">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                            className="px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                            aria-label={`Increase ${item.title}`}
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="text-xs font-semibold text-red-500 hover:text-red-600"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <div className="text-xs font-semibold text-gray-900">
                      {currency(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 px-4 py-3">
            <div className="flex items-center justify-between text-sm font-semibold text-gray-900">
              <span>Subtotal</span>
              <span>{currency(pricing?.subtotal ?? subtotal)}</span>
            </div>
            {pricing?.discounts?.length ? (
              <div className="mt-1 grid gap-1 text-xs text-emerald-700">
                {pricing.discounts.map((d) => (
                  <div key={d.id} className="flex justify-between">
                    <span>{d.name}</span>
                    <span>-{currency(d.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-semibold text-slate-900">
                  <span>Total</span>
                  <span>{currency(pricing.total)}</span>
                </div>
              </div>
            ) : null}
            {pricingLoading ? (
              <p className="mt-1 text-[11px] text-slate-500">Đang tính giảm giá…</p>
            ) : null}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link
                href="/cart"
                className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                onClick={() => setOpen(false)}
              >
                View cart
              </Link>
              <Link
                href="/products"
                className="inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-center text-sm font-semibold leading-tight text-white transition hover:bg-slate-800"
                onClick={() => setOpen(false)}
              >
                Continue shopping
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
