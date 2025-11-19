"use client";
import Link from "next/link";

type Product = {
  id: string;
  name: string;
  description: string;
  image: string;
  price: number;
  rating: number;
  category: string;
  badge?: string;
};

const products: Product[] = [
  {
    id: "win11-pro",
    name: "Windows 11 Pro Key",
    description: "Key bản quyền kích hoạt online.",
    image:
      "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?q=80&w=1200&auto=format&fit=crop",
    price: 96,
    rating: 4.8,
    category: "HĐH",
    badge: "Hot",
  },
  {
    id: "office-2021",
    name: "Microsoft Office 2021",
    description: "Word, Excel, PowerPoint vĩnh viễn.",
    image:
      "https://shop.winandoffice.com/australia/wp-content/uploads/2023/12/O21S.jpg",
    price: 196,
    rating: 4.7,
    category: "Văn phòng",
    badge: "Best Seller",
  },
  {
    id: "avast-premium",
    name: "Avast Premium Security",
    description: "Bảo vệ realtime chống malware.",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRRSvqy3R-fRwU0kHwuVvJsWz99bpfZAXhcVQ&s",
    price: 166,
    rating: 4.5,
    category: "Bảo mật",
    badge: "New",
  },
  {
    id: "vs-code-ext-pack",
    name: "VS Code Extensions Pack",
    description: "Tăng tốc phát triển với bộ extension.",
    image: "https://code.visualstudio.com/assets/branding/code-stable.png",
    price: 49,
    rating: 4.6,
    category: "Dev Tools",
  },
  {
    id: "figma-pro",
    name: "Figma Professional",
    description: "Thiết kế UI/UX cộng tác realtime.",
    image:
      "https://scontent.fdad3-1.fna.fbcdn.net/v/t39.30808-1/473617582_1029732299185368_7793304005103073658_n.jpg?stp=c0.128.1024.1024a_dst-jpg_s200x200_tt6&_nc_cat=110&ccb=1-7&_nc_sid=2d3e12&_nc_ohc=gw16BDSfV_cQ7kNvwG4shiG&_nc_oc=AdnuBp1L_8asVtjzVTeO5Sj6qV9LmVbUcfQT0NB_dHIJdaa1wBygce_CcIbKKReV3cc&_nc_zt=24&_nc_ht=scontent.fdad3-1.fna&_nc_gid=Ue9jn2pit2cCqe13MkuETQ&oh=00_AfhM9nxki6w-Is1F81Toz_kJ_wNWdgLep3E9IZFP_Ld1GA&oe=69231622",
    price: 120,
    rating: 4.9,
    category: "Thiết kế",
  },
  {
    id: "adobe-ps",
    name: "Adobe Photoshop",
    description: "Chỉnh sửa ảnh chuyên nghiệp.",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/2/20/Photoshop_CC_icon.png",
    price: 239,
    rating: 4.8,
    category: "Thiết kế",
  },
  {
    id: "jetbrains-idea",
    name: "IntelliJ IDEA Ultimate",
    description: "IDE mạnh mẽ cho Java & hơn thế.",
    image:
      "https://resources.jetbrains.com/storage/products/company/brand/logos/IntelliJ_IDEA_icon.png",
    price: 299,
    rating: 4.7,
    category: "Dev Tools",
  },
  {
    id: "postman-pro",
    name: "Postman Pro",
    description: "Kiểm thử API cộng tác.",
    image: "https://voyager.postman.com/logo/postman-logo-icon-orange.svg",
    price: 89,
    rating: 4.6,
    category: "Dev Tools",
  },
  {
    id: "notion-plus",
    name: "Notion Plus",
    description: "Workspaces linh hoạt ghi chú & quản lý.",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/e/e9/Notion-logo.svg",
    price: 75,
    rating: 4.8,
    category: "Năng suất",
  },
  {
    id: "slack-premium",
    name: "Slack Premium",
    description: "Giao tiếp nhóm bảo mật & tìm kiếm tốt.",
    image: "https://upload.wikimedia.org/wikipedia/commons/7/76/Slack_Icon.png",
    price: 130,
    rating: 4.4,
    category: "Năng suất",
  },
];

export default function ProductsPage() {
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
              <Link href={`/products/${p.id}`} style={{ position: "relative" }}>
                <img
                  src={p.image}
                  alt={p.name}
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
                  <span
                    style={{ fontSize: 11, color: "#f59e0b", fontWeight: 600 }}
                  >
                    ★ {p.rating}
                  </span>
                </div>
                <h3 style={{ fontSize: 16, margin: 0 }}>
                  <Link
                    href={`/products/${p.id}`}
                    style={{
                      color: "#111827",
                      textDecoration: "none",
                      fontWeight: 700,
                    }}
                  >
                    {p.name}
                  </Link>
                </h3>
                <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.4 }}>
                  {p.description}
                </p>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <strong style={{ fontSize: 15 }}>${p.price}</strong>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      style={{
                        background: "#111827",
                        color: "#fff",
                        border: "none",
                        padding: "6px 10px",
                        borderRadius: 8,
                        fontSize: 12,
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                      onClick={() => console.log("add-to-cart", p.id)}
                    >
                      Thêm
                    </button>
                    <Link
                      href={`/products/${p.id}`}
                      style={{
                        border: "1px solid #e5e7eb",
                        padding: "6px 10px",
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
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
