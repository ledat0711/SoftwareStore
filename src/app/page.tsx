"use client";

import Slider from "@/components/Slider";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Product } from "@/types/product";
import { ROLES, ROLE_LABELS, Role } from "@/constants/role";

type AppUser = {
  role?: Role;
};

export default function HomePage() {
  const { data: session } = useSession();
  const role = (session?.user as AppUser)?.role;
  const roleString =
    role && ROLE_LABELS[role as Role] ? ROLE_LABELS[role] : "Not signed in";

  const slides = [
    {
      id: "s1",
      title: "Welcome to Software Store",
      titleClass: "text-white",
      bg: "linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('https://images-eds-ssl.xboxlive.com/image?url=7flt5...') center/cover no-repeat",
    },
    { id: "s2", title: "Performance Optimization", subtitle: "Tối ưu hiệu suất", bg: "linear-gradient(135deg,#fde68a,#fecaca)" },
    { id: "s3", title: "Secure & Reliable", subtitle: "Bảo mật và ổn định", bg: "linear-gradient(135deg,#e9d5ff,#bae6fd)" },
  ];

  // ⭐ NEW: load recommended from DB
  const [recommended, setRecommended] = useState<Product[]>([]);

  useEffect(() => {
    fetch("/api/products?take=4")
      .then((r) => r.json())
      .then(setRecommended);
  }, []);

  return (
    <main style={{ maxWidth: 960, margin: "32px auto", padding: "0 16px", display: "grid", gap: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, display: "flex", alignItems: "center", gap: 12 }}>
        Trang chủ
        <span
          style={{
            fontSize: 14,
            fontWeight: 600,
            padding: "2px 10px",
            borderRadius: 999,
            background: "#111827",
            color: "#fff",
          }}
        >
          Role: {roleString}
        </span>
      </h1>

      <Slider items={slides} />

      {/* Recommended section */}
      <section style={{ marginTop: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", marginBottom: 12 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700 }}>Gợi ý cho bạn</h2>
            <p style={{ color: "#6b7280", fontSize: 14 }}>Một vài sản phẩm phổ biến hôm nay</p>
          </div>
          <Link href="/products" style={{ fontSize: 14, color: "#2563eb", fontWeight: 600 }}>
            Xem tất cả →
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
          {recommended.map((p) => (
            <div
              key={p.id}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 14,
                overflow: "hidden",
                background: "#fff",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Link href={`/products/${p.slug}`} style={{ position: "relative", display: "block" }}>
                <img
                  src={p.image || ""}
                  alt={p.title}
                  style={{ width: "100%", height: 140, objectFit: "contain", background: "#f9fafb" }}
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
                      fontWeight: 600,
                    }}
                  >
                    {p.badge}
                  </span>
                )}
              </Link>

              <div style={{ display: "flex", gap: 10, padding: "8px 12px 4px" }}>
                <span style={{ fontSize: 11, background: "#f3f4f6", padding: "2px 8px", borderRadius: 6 }}>
                  {p.category}
                </span>
                <span style={{ color: "#f59e0b", fontSize: 12, fontWeight: 700 }}>★ {p.rating ?? "4.8"}</span>
              </div>

              <div style={{ padding: "0 12px 12px", display: "grid", gap: 10 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>
                  <Link href={`/products/${p.slug}`} style={{ color: "#111827", textDecoration: "none" }}>
                    {p.title}
                  </Link>
                </h3>
                <p style={{ fontSize: 12.5, color: "#6b7280" }}>{p.description}</p>

                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#111827", fontWeight: 800, fontSize: 14 }}>${p.price}</span>
                  <button
                    onClick={() => console.log("add-to-cart", p.id)}
                    style={{
                      background: "#111827",
                      color: "#fff",
                      border: "none",
                      padding: "6px 14px",
                      borderRadius: 8,
                      fontWeight: 600,
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    Thêm
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
