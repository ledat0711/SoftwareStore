import type { Metadata } from "next";
import Link from "next/link";
import AddToCartButton from "./AddToCartButton";

type Product = {
  id: string;
  name: string;
  content: string;
  image: string;
  price: number;
  rating: number; // 0..5
  category: string;
  badge?: string;
  features: string[];
};

const all: Record<string, Product> = {
  "win11-pro": {
    id: "win11-pro",
    name: "Windows 11 Pro Key",
    content: "Key OEM/Retail kích hoạt online, cập nhật dài hạn.",
    image:
      "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?q=80&w=1200&auto=format&fit=crop",
    price: 96,
    rating: 4.8,
    category: "HĐH",
    badge: "Hot",
    features: [
      "Kích hoạt chính chủ trên thiết bị",
      "Hỗ trợ cập nhật bảo mật dài hạn",
      "Dùng cho doanh nghiệp và cá nhân",
      "Cài đặt lại nhiều lần trên 1 máy",
    ],
  },
  "office-2021": {
    id: "office-2021",
    name: "Microsoft Office 2021",
    content:
      "Bộ ứng dụng văn phòng vĩnh viễn cho công việc: Word, Excel, PowerPoint.",
    image:
      "https://shop.winandoffice.com/australia/wp-content/uploads/2023/12/O21S.jpg",
    price: 196,
    rating: 4.7,
    category: "Văn phòng",
    badge: "Best Seller",
    features: ["Giấy phép vĩnh viễn", "Không cần thuê bao", "Cài offline"],
  },
  "avast-premium": {
    id: "avast-premium",
    name: "Avast Premium Security",
    content: "Bảo vệ realtime, chống malware và ransomware.",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRRSvqy3R-fRwU0kHwuVvJsWz99bpfZAXhcVQ&s",
    price: 166,
    rating: 4.5,
    category: "Bảo mật",
    badge: "New",
    features: ["Realtime protection", "Tường lửa thông minh", "Web Shield"],
  },
  "vs-code-ext-pack": {
    id: "vs-code-ext-pack",
    name: "VS Code Extensions Pack",
    content: "Bộ extension tối ưu trải nghiệm lập trình.",
    image: "https://code.visualstudio.com/assets/branding/code-stable.png",
    price: 49,
    rating: 4.6,
    category: "Dev Tools",
    features: ["Lint/Format", "Git tools", "Snippet & Theme"],
  },
  "figma-pro": {
    id: "figma-pro",
    name: "Figma Professional",
    content: "Thiết kế UI/UX cộng tác realtime, prototype nhanh.",
    image:
      "https://scontent.fdad3-1.fna.fbcdn.net/v/t39.30808-1/473617582_1029732299185368_7793304005103073658_n.jpg?stp=c0.128.1024.1024a_dst-jpg_s200x200_tt6&_nc_cat=110&ccb=1-7&_nc_sid=2d3e12&_nc_ohc=gw16BDSfV_cQ7kNvwG4shiG&_nc_oc=AdnuBp1L_8asVtjzVTeO5Sj6qV9LmVbUcfQT0NB_dHIJdaa1wBygce_CcIbKKReV3cc&_nc_zt=24&_nc_ht=scontent.fdad3-1.fna&_nc_gid=Ue9jn2pit2cCqe13MkuETQ&oh=00_AfhM9nxki6w-Is1F81Toz_kJ_wNWdgLep3E9IZFP_Ld1GA&oe=69231622",
    price: 120,
    rating: 4.9,
    category: "Thiết kế",
    features: ["Realtime collaboration", "Component/Variant", "Auto layout"],
  },
  "adobe-ps": {
    id: "adobe-ps",
    name: "Adobe Photoshop",
    content: "Chỉnh sửa ảnh chuyên nghiệp, compositing mạnh mẽ.",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/2/20/Photoshop_CC_icon.png",
    price: 239,
    rating: 4.8,
    category: "Thiết kế",
    features: ["AI selection", "RAW processing", "Layer/Mask"],
  },
  "jetbrains-idea": {
    id: "jetbrains-idea",
    name: "IntelliJ IDEA Ultimate",
    content: "IDE mạnh mẽ cho JVM và nhiều framework.",
    image:
      "https://resources.jetbrains.com/storage/products/company/brand/logos/IntelliJ_IDEA_icon.png",
    price: 299,
    rating: 4.7,
    category: "Dev Tools",
    features: ["Smart code insight", "Debugger/Profiler", "Framework support"],
  },
  "postman-pro": {
    id: "postman-pro",
    name: "Postman Pro",
    content: "Kiểm thử và cộng tác API hiện đại.",
    image: "https://voyager.postman.com/logo/postman-logo-icon-orange.svg",
    price: 89,
    rating: 4.6,
    category: "Dev Tools",
    features: ["Collections", "Env & Variables", "Automated tests"],
  },
  "notion-plus": {
    id: "notion-plus",
    name: "Notion Plus",
    content: "Không gian làm việc hợp nhất: notes, tasks, database.",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/e/e9/Notion-logo.svg",
    price: 75,
    rating: 4.8,
    category: "Năng suất",
    features: ["Database view", "Templates", "Real-time sync"],
  },
  "slack-premium": {
    id: "slack-premium",
    name: "Slack Premium",
    content: "Giao tiếp nhóm bảo mật với tìm kiếm nâng cao.",
    image: "https://upload.wikimedia.org/wikipedia/commons/7/76/Slack_Icon.png",
    price: 130,
    rating: 4.4,
    category: "Năng suất",
    features: ["Channels", "App integrations", "Shared workspaces"],
  },
};

// SEO metadata theo sản phẩm
export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
   const { id } = await params;  
  const p = all[id];
  if (!p) return { title: "Không tìm thấy sản phẩm" };
  return {
    title: `${p.name} | Software Store`,
    description: p.content,
    openGraph: {
      title: p.name,
      description: p.content,
      images: [{ url: p.image }],
    },
  };
}

function currency(n: number) {
  return `$${n}`;
}

function Stars({ value }: { value: number }) {
  const full = Math.floor(value);
  const hasHalf = value - full >= 0.5;
  const arr = Array.from({ length: 5 }, (_, i) =>
    i < full ? "★" : i === full && hasHalf ? "☆" : "✩"
  );
  return (
    <span title={`${value}/5`} style={{ color: "#f59e0b", fontWeight: 700 }}>
      {arr.join(" ")}
    </span>
  );
}

export default async function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = all[id];
  if (!p) {
    return (
      <main style={{ maxWidth: 960, margin: "40px auto", padding: 24 }}>
        <h1>Không tìm thấy sản phẩm</h1>
        <Link href="/products">← Quay lại danh sách</Link>
      </main>
    );
  }

  const related = Object.values(all)
    .filter((x) => x.id !== p.id)
    .slice(0, 4);

  return (
    <main
      style={{
        maxWidth: 1100,
        margin: "32px auto",
        padding: "0 24px",
        display: "grid",
        gap: 28,
      }}
    >
      {/* Breadcrumb */}
      <nav style={{ fontSize: 14, color: "#6b7280" }}>
        <Link href="/" style={{ color: "#2563eb", textDecoration: "none" }}>
          Trang chủ
        </Link>{" "}
        /{" "}
        <Link
          href="/products"
          style={{ color: "#2563eb", textDecoration: "none" }}
        >
          Sản phẩm
        </Link>{" "}
        / <span style={{ color: "#111827" }}>{p.name}</span>
      </nav>

      {/* Hero */}
      <section
        style={{
          display: "grid",
          gap: 24,
          gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
          alignItems: "start",
        }}
      >
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 14,
            overflow: "hidden",
            background: "#fff",
          }}
        >
          <img
            src={p.image}
            alt={p.name}
            style={{
              width: "100%",
              height: 320,
              objectFit: "contain",
              background: "#f9fafb",
              display: "block",
            }}
            loading="lazy"
          />
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span
              style={{
                fontSize: 12,
                background: "#f3f4f6",
                padding: "3px 10px",
                borderRadius: 999,
              }}
            >
              {p.category}
            </span>
            {p.badge && (
              <span
                style={{
                  fontSize: 12,
                  background: "#111827",
                  color: "#fff",
                  padding: "3px 10px",
                  borderRadius: 999,
                }}
              >
                {p.badge}
              </span>
            )}
          </div>

          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>{p.name}</h1>

          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              color: "#6b7280",
            }}
          >
            <Stars value={p.rating} />
            <span style={{ fontWeight: 700 }}>{p.rating}</span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 12,
              marginTop: 4,
            }}
          >
            <span style={{ fontSize: 24, fontWeight: 900, color: "#111827" }}>
              {currency(p.price)}
            </span>
            <span style={{ color: "#6b7280", fontSize: 13 }}>
              (Giá tham khảo)
            </span>
          </div>

          <p style={{ color: "#374151", lineHeight: 1.6 }}>{p.content}</p>

          <div style={{ display: "flex", gap: 12 }}>
            <AddToCartButton id={p.id} />
            <Link
              href="/products"
              style={{
                border: "1px solid #e5e7eb",
                padding: "10px 14px",
                borderRadius: 10,
                textDecoration: "none",
                color: "#111827",
                fontWeight: 700,
              }}
            >
              ← Xem danh sách
            </Link>
          </div>

          {/* Thông tin bản quyền */}
          <div
            style={{
              marginTop: 8,
              padding: 14,
              border: "1px dashed #e5e7eb",
              borderRadius: 12,
              background: "#fcfcfd",
              color: "#374151",
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            - Giao key điện tử qua email trong vòng 5-15 phút giờ làm việc.
            <br />
            - Hỗ trợ cài đặt/kích hoạt từ xa.
            <br />- Hoá đơn VAT (nếu cần) và chính sách hoàn tiền theo điều
            khoản cửa hàng.
          </div>
        </div>
      </section>

      {/* Tính năng nổi bật */}
      <section style={{ display: "grid", gap: 12 }}>
        <h2 style={{ fontSize: 20, margin: 0 }}>Tính năng nổi bật</h2>
        <ul style={{ margin: 0, paddingLeft: 18, color: "#374151" }}>
          {p.features.map((f) => (
            <li key={f} style={{ margin: "6px 0" }}>
              {f}
            </li>
          ))}
        </ul>
      </section>

      {/*  */}
      <section style={{ display: "grid", gap: 12 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ fontSize: 20, margin: 0 }}>Sản phẩm liên quan</h2>
          <Link
            href="/products"
            style={{ color: "#2563eb", fontWeight: 700, fontSize: 14 }}
          >
            Xem tất cả →
          </Link>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
            gap: 16,
          }}
        >
          {related.map((r) => (
            <div
              key={r.id}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                overflow: "hidden",
                background: "#fff",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Link href={`/products/${r.id}`} style={{ position: "relative" }}>
                <img
                  src={r.image}
                  alt={r.name}
                  style={{
                    width: "100%",
                    height: 120,
                    objectFit: "contain",
                    background: "#f9fafb",
                    display: "block",
                  }}
                />
                {r.badge && (
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
                    {r.badge}
                  </span>
                )}
              </Link>

              <div style={{ padding: 12, display: "grid", gap: 6 }}>
                <h3 style={{ fontSize: 15, margin: 0, fontWeight: 800 }}>
                  <Link
                    href={`/products/${r.id}`}
                    style={{ color: "#111827", textDecoration: "none" }}
                  >
                    {r.name}
                  </Link>
                </h3>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: 13,
                  }}
                >
                  <strong>{currency(r.price)}</strong>
                  <span style={{ color: "#f59e0b", fontWeight: 700 }}>
                    ★ {r.rating}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
