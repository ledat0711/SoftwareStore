import prisma from "@/lib/prisma";
import type { Metadata } from "next";
import Link from "next/link";
import AddToCartButton from "./AddToCartButton";

// ⭐ Load metadata SEO từ DB
export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const { id } = params;
  const product = await prisma.product.findUnique({
    where: { slug: id },
  });

  if (!product) {
    return { title: "Không tìm thấy sản phẩm" };
  }

  return {
    title: `${product.title} | Software Store`,
    description: product.description ?? "",
    openGraph: {
      title: product.title,
      description: product.description ?? "",
      images: [{ url: product.image ?? "" }],
    },
  };
}

function currency(n: number) {
  return `$${n}`;
}

export default async function ProductDetail({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  // ⭐ Lấy sản phẩm từ database
  const p = await prisma.product.findUnique({
    where: { slug: id },
  });

  if (!p) {
    return (
      <main style={{ maxWidth: 960, margin: "40px auto", padding: 24 }}>
        <h1>Không tìm thấy sản phẩm</h1>
        <Link href="/products">← Quay lại danh sách</Link>
      </main>
    );
  }

  // ⭐ Sản phẩm liên quan (lấy theo category hoặc lấy ngẫu nhiên)
  const related = await prisma.product.findMany({
    where: {
      category: p.category ?? undefined,
      NOT: { id: p.id },
    },
    take: 4,
  });

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
        <Link href="/products" style={{ color: "#2563eb" }}>
          Sản phẩm
        </Link>{" "}
        / <span style={{ color: "#111827" }}>{p.title}</span>
      </nav>

      {/* Hero */}
      <section
        style={{
          display: "grid",
          gap: 24,
          gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
        }}
      >
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 14 }}>
          <img
            src={p.image ?? ""}
            alt={p.title}
            style={{
              width: "100%",
              height: 320,
              objectFit: "contain",
              background: "#f9fafb",
              display: "block",
            }}
          />
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>
            {p.title}
          </h1>

          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              color: "#6b7280",
            }}
          >
            ★ {p.rating ?? 4.8}
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <span style={{ fontSize: 24, fontWeight: 900 }}>
              {currency(p.price)}
            </span>
          </div>

          <p style={{ color: "#374151", lineHeight: 1.6 }}>
            {p.description ?? ""}
          </p>

          <div style={{ display: "flex", gap: 12 }}>
            <AddToCartButton id={p.id} />
            <Link
              href="/products"
              style={{
                border: "1px solid #e5e7eb",
                padding: "10px 14px",
                borderRadius: 10,
              }}
            >
              ← Danh sách
            </Link>
          </div>
        </div>
      </section>

      {/* Sản phẩm liên quan */}
      <section style={{ display: "grid", gap: 12 }}>
        <h2 style={{ fontSize: 20, margin: 0 }}>Sản phẩm liên quan</h2>

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
                background: "#fff",
              }}
            >
              <Link href={`/products/${r.slug}`}>
                <img
                  src={r.image ?? ""}
                  style={{
                    width: "100%",
                    height: 120,
                    objectFit: "contain",
                    background: "#f9fafb",
                  }}
                />
              </Link>

              <div style={{ padding: 12 }}>
                <h3 style={{ fontSize: 15, margin: 0, fontWeight: 800 }}>
                  {r.title}
                </h3>
                <strong>{currency(r.price)}</strong>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
