"use client";

export default function AddToCartButton({ id }: { id: string }) {
  return (
    <button
      style={{
        background: "#111827",
        color: "#fff",
        border: "none",
        padding: "10px 18px",
        borderRadius: 8,
        fontWeight: 600,
        cursor: "pointer",
        width: 160,
      }}
      onClick={() => console.log("add-to-cart", id)}
    >
      Thêm vào giỏ
    </button>
  );
}
