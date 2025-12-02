"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Product } from "@/types/product";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/products?visible=1")
      .then((res) => res.json())
      .then((data: Product[]) => {
        setProducts(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ padding: 40 }}>Đang tải sản phẩm...</p>;

  return (
    <main
      style={{
        maxWidth: 1100,
        margin: "32px auto",
        padding: "0 24px",
        display: "grid",
        gap: 32,
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, margin: 0 }}>
            Tất cả sản phẩm
          </h1>
          <p style={{ color: "#6b7280", fontSize: 14, marginTop: 6 }}>
            Kho phần mềm đa dạng cho nhu cầu của bạn
          </p>
        </div>
        <Link
          href="/"
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "#2563eb",
            textDecoration: "none",
            padding: "8px 14px",
            border: "1px solid #2563eb",
            borderRadius: 8,
          }}
        >
          ← Về trang chủ
        </Link>
      </header>

      <section style={{ display: "grid", gap: 20 }}>
        <div
          style={{
            display: "grid",
            gap: 20,
            gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))",
          }}
        >
          {products.map((p) => (
            <div
              key={p.id}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 14,
                background: "#fff",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Link href={`/products/${p.slug}`} style={{ position: "relative" }}>
                <img
                  src={p.image ?? ""}
                  alt={p.title}
                  style={{
                    width: "100%",
                    height: 150,
                    objectFit: "contain",
                    background: "#f9fafb",
                  }}
                />
                {p.badge && (
                  <span
                    style={{
                      position: "absolute",
                      top: 8,
                      left: 8,
                      background: "#111827",
                      color: "#fff",
                      fontSize: 11,
                      padding: "2px 8px",
                      borderRadius: 999,
                    }}
                  >
                    {p.badge}
                  </span>
                )}
              </Link>
              <div style={{ padding: 14, display: "grid", gap: 8 }}>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {p.category && (
                    <span
                      style={{
                        fontSize: 11,
                        background: "#f3f4f6",
                        padding: "2px 8px",
                        borderRadius: 6,
                      }}
                    >
                      {p.category}
                    </span>
                  )}
                  {p.rating && (
                    <span
                      style={{ fontSize: 11, color: "#f59e0b", fontWeight: 600 }}
                    >
                      ★ {p.rating}
                    </span>
                  )}
                </div>
                <h3 style={{ fontSize: 16, margin: 0 }}>
                  <Link
                    href={`/products/${p.slug}`}
                    style={{
                      color: "#111827",
                      textDecoration: "none",
                      fontWeight: 700,
                    }}
                  >
                    {p.title}
                  </Link>
                </h3>
                {p.description && (
                  <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.4 }}>
                    {p.description}
                  </p>
                )}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <strong style={{ fontSize: 15 }}>${p.price}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
