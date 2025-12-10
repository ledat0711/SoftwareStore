"use client";

type AddToCartButtonProps = {
  id: string;
  className?: string;
};

export default function AddToCartButton({
  id,
  className = "",
}: AddToCartButtonProps) {
  return (
    <button
      onClick={() => console.log("add-to-cart", id)}
      className={`max-w-[150px] inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 ${className}`}
    >
      Thêm vào giỏ
    </button>
  );
}
