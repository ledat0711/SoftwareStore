"use client";

import Slider from "@/components/Slider";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function HomePage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const roleString =
    role === "ADMIN" ? "Admin" : role === "USER" ? "User" : "Not signed in";

  const slides = [
    {
      id: "s1",
      title: "Welcome to Software Store",
      titleClass: "text-white",
      bg: "linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('https://images-eds-ssl.xboxlive.com/image?url=7flt5HU26ZSS3Tgted_TMty0wzqMQYpm03yD7eAPRtQBYO5dMlD18uZxNDuKXvpqAKGFYXbR3E2AUl4SjJkn2wMOGpMzW_eL9bead7iYs2rnbclM65KqMluL9PQUxrK9Ly91WqD2mOR04qP8KhlAr9sCYHV0ITD7w0VDwUVc0OS0dlZQzX_mQjmIhqTnlbcK5QYa0bZ0JBvUwPmYg3m28w--&h=576') center/cover no-repeat",
    },
    {
      id: "s2",
      title: "Performance Optimization",
      subtitle: "Tối ưu hiệu suất",
      bg: "linear-gradient(135deg,#fde68a,#fecaca)",
    },
    {
      id: "s3",
      title: "Secure & Reliable",
      subtitle: "Bảo mật và ổn định",
      bg: "linear-gradient(135deg,#e9d5ff,#bae6fd)",
    },
  ];

  // Gợi ý sản phẩm (sửa theo thiết kế mới)
  const recommendedProducts = [
    {
      id: "win11-pro",
      name: "Windows 11 Pro Key",
      description: "Key OEM/Retail kích hoạt online, cập nhật dài hạn.",
      image: "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?q=80&w=1200&auto=format&fit=crop",
      price: 96,
      rating: 4.8,
      badge: "Hot",
      category: "HĐH",
    },
    {
      id: "office-2021",
      name: "Microsoft Office 2021",
      description: "Word, Excel, PowerPoint vĩnh viễn.",
      image: "https://shop.winandoffice.com/australia/wp-content/uploads/2023/12/O21S.jpg",
      price: 196,
      rating: 4.7,
      badge: "Best Seller",
      category: "Văn phòng",
    },
    {
      id: "avast-premium",
      name: "Avast Premium Security",
      description: "Bảo vệ realtime chống malware & ransomware.",
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRRSvqy3R-fRwU0kHwuVvJsWz99bpfZAXhcVQ&s",
      price: 166,
      rating: 4.5,
      badge: "New",
      category: "Bảo mật",
    },
    {
      id: "vs-code-ext-pack",
      name: "VS Code Extensions Pack",
      description: "Tăng tốc phát triển với bộ extension.",
      image: "https://code.visualstudio.com/assets/branding/code-stable.png",
      price: 49, // giá mới theo hình
      rating: 4.6,
      category: "Dev Tools",
    },
  ];

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
          {recommendedProducts.map((p) => (
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
              <Link
                href={`/products/${p.id}`}
                aria-label={`Xem chi tiết ${p.name}`}
                style={{ position: "relative", display: "block", cursor: "pointer" }}
              >
                <img
                  src={p.image}
                  alt={p.name}
                  style={{ width: "100%", height: 140, objectFit: "contain", background: "#f9fafb", display: "block" }}
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

              {/* Bar chứa category + rating */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 12px 4px",
                  background: "#fff",
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    background: "#f3f4f6",
                    padding: "2px 8px",
                    borderRadius: 6,
                    fontWeight: 500,
                    color: "#374151",
                  }}
                >
                  {p.category}
                </span>
                <span style={{ color: "#f59e0b", fontSize: 12, fontWeight: 700 }}>★ {p.rating}</span>
              </div>

              <div style={{ padding: "0 12px 12px", display: "grid", gap: 10 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, lineHeight: 1.3 }}>
                  <Link href={`/products/${p.id}`} style={{ color: "#111827", textDecoration: "none" }}>
                    {p.name}
                  </Link>
                </h3>
                <p style={{ fontSize: 12.5, color: "#6b7280", lineHeight: 1.5, margin: 0 }}>{p.description}</p>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ color: "#111827", fontWeight: 800, fontSize: 14 }}>${p.price}</span>
                  <div style={{ display: "flex", gap: 8 }}>
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
                    <Link
                      href={`/products/${p.id}`}
                      style={{
                        border: "1px solid #e5e7eb",
                        padding: "6px 14px",
                        borderRadius: 8,
                        fontWeight: 600,
                        fontSize: 12,
                        color: "#111827",
                        textDecoration: "none",
                      }}
                    >
                      Chi tiết
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
