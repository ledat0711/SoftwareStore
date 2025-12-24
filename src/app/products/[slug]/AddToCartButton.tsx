"use client";

import { useEffect, useRef, useState } from "react";
import { CartItemInput } from "@/lib/cart";
import { useCart } from "@/components/CartProvider";
import { useToast } from "@/components/ToastProvider";

type Props = {
  item: CartItemInput;
  className?: string;
  quantity?: number;
};

const RESET_DELAY_MS = 2000;

export default function AddToCartButton({
  item,
  className = "",
  quantity = 1,
}: Props) {
  const { addItem, items } = useCart();
  const toast = useToast();
  const [status, setStatus] = useState<"idle" | "adding" | "added" | "error">(
    "idle"
  );
  const timeoutRef = useRef<number | null>(null);

  const existing = items.find((entry) => entry.id === item.id);
  const isBusy = status === "adding";

  const label =
    status === "adding"
      ? "Dang them..."
      : status === "added"
      ? "Da them"
      : status === "error"
      ? "Thu lai"
      : existing
      ? "Them tiep"
      : "Them vao gio";

  function clearTimer() {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }

  useEffect(() => {
    if (status !== "added") return;
    clearTimer();
    timeoutRef.current = window.setTimeout(() => {
      setStatus("idle");
    }, RESET_DELAY_MS);
    return clearTimer;
  }, [status]);

  useEffect(() => () => clearTimer(), []);

  async function handleClick() {
    if (isBusy) return;
    clearTimer();
    setStatus("adding");
    try {
      await addItem(item, quantity);
      setStatus("added");
      toast.success(`Added to cart: ${item.title}`);
    } catch {
      setStatus("error");
      toast.error("Unable to add item. Please try again.");
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isBusy}
      className={`max-w-[150px] inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:cursor-not-allowed disabled:opacity-70 ${className}`}
    >
      {isBusy && (
        <span
          aria-hidden="true"
          className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
        />
      )}
      <span aria-live="polite">{label}</span>
    </button>
  );
}
