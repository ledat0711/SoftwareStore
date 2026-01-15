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
  // status có kiểu dữ liệu: String Literal Union Type
  const [status, setStatus] = useState<"idle" | "adding" | "added" | "error">(
    "idle"
  );

  const timeoutRef = useRef<number | null>(null);

  // existing: Dùng để đổi text nút:
  // “Thêm vào giỏ”
  // “Thêm tiếp”
  const existing: CartItemInput | undefined = items.find((entry) => entry.id === item.id);
  const isAdding = status === "adding";

  // label KHÔNG ảnh hưởng thuật toán, nó chỉ hiển thị trạng thái mà thôi.
  const label =
    status === "adding"
      ? "Đang thêm..."
      : status === "added"
      ? "Đã thêm"
      : status === "error"
      ? "Thử lại"
      : existing
      ? "Thêm tiếp"
      : "Thêm vào giỏ";

  function clearTimer() {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }

  // là hàm (hook) dùng để reset trạng thái nút về "idle" sau 2 giây
  useEffect(() => {
    if (status !== "added") return;
    clearTimer();
    timeoutRef.current = window.setTimeout(() => {
      setStatus("idle");
    }, RESET_DELAY_MS);

    // return clearTimer; :cleanup function
    // Giả sử trường hợp người dùng:
    //    Bấm “Thêm vào giỏ”
    //    Chưa kịp 2 giây đã rời trang
    //    trong trường hợp này timmer vẫn chạy ngầm,
    //    khi chạy xong sẽ gọi setStatus trên component đã unmount dẫn đến lỗi React warning
    // return clearTimer chặn vấn đề này
    return clearTimer;
  }, [status]);

  useEffect(() => () => clearTimer(), []);

  async function handleAddToCartClick() {
    if (isAdding) return;
    clearTimer();
    setStatus("adding");
    try {
      // ************ addItem(): QUAN TRỌNG ************
      // AddToCartButton
      //    ↓
      // useCart().addItem()
      //    ↓
      // lib/cart.ts
      //    ↓
      // LocalStorage / Server API
      //    ↓
      // Cập nhật CartContext
      await addItem(item, quantity);
      setStatus("added");
      toast.success(`Added to cart: ${item.title}`);
    } catch {
      setStatus("error");
      toast.error("Unable to add item. Please try again.");
    }
  }

  // khi đang adding (isAdding = true): disable nút và hiển thị spinner
  return (
    <button
      type="button"
      onClick={handleAddToCartClick}
      disabled={isAdding}
      className={`max-w-[150px] inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:cursor-not-allowed disabled:opacity-70 ${className}`}
    >
      {isAdding && (
        <span
          aria-hidden="true"
          className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
        />
      )}
      <span aria-live="polite">{label}</span>
    </button>
  );
}
