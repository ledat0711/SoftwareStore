import { getProductBySlug, getRelatedProducts } from "@/lib/prisma";
import type { Metadata } from "next";
import Link from "next/link";
import AddToCartButton from "./AddToCartButton";

type ProductParams = { id: string };

// Load metadata SEO from DB
export async function generateMetadata({
  params,
}: {
  params: Promise<ProductParams>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductBySlug(id);

  if (!product) {
    return { title: "Khong tim thay san pham" };
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

function shorten(text: string | null | undefined, max = 90) {
  if (!text) return "Mo ta dang cap nhat";
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

export default async function ProductDetail({
  params,
}: {
  params: Promise<ProductParams>;
}) {
  const { id } = await params;
  const p = await getProductBySlug(id);

  if (!p) {
    return (
      <main className="mx-auto mt-10 max-w-5xl p-6">
        <h1>Khong tim thay san pham</h1>
        <Link href="/products">Quay lai danh sach</Link>
      </main>
    );
  }

  const related = await getRelatedProducts(p.id, p.category);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white ">
      <div className="mx-auto grid max-w-[1400px] gap-10 px-6 py-10">
        {/* Breadcrumb */}
        <nav className="text-sm text-slate-500">
          <Link href="/" className="text-blue-600 hover:underline">
            Trang chủ
          </Link>{" "}
          /{" "}
          <Link href="/products" className="text-blue-600 hover:underline">
            Sản phẩm
          </Link>{" "}
          / <span className="text-slate-900">{p.title}</span>
        </nav>

        {/* Hero */}
        <section className="grid grid-cols-1 gap-6 rounded-2xl bg-white p-6 shadow-lg ring-1 ring-gray-100 lg:grid-cols-[minmax(340px,1fr)_minmax(340px,1fr)]">
          <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-slate-50 to-slate-100 p-4">
            <img
              src={p.image ?? ""}
              alt={p.title}
              className="block h-80 w-full rounded-xl bg-white object-contain shadow-sm"
            />
          </div>

          <div className="grid gap-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-2">
                <h1 className="text-3xl font-extrabold text-slate-900">
                  {p.title}
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-slate-500">
              <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">
                <span className="text-lg">★</span> {p.rating ?? 4.8} / 5
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <span className="text-3xl font-black text-slate-900">
                {currency(p.price)}
              </span>
            </div>

            <p className="leading-relaxed text-gray-700">
              {p.description ?? "Mo ta dang cap nhat"}
            </p>

            <dl className="grid grid-cols-1 gap-3 rounded-xl border border-gray-100 bg-slate-50 p-4 text-sm text-slate-700 sm:grid-cols-2 max-w-[300px]">
              <div className="flex items-start gap-2">
                <dt className="font-semibold text-slate-900">Category</dt>
                <dd>{p.category ?? "Khac"}</dd>
              </div>
              <div className="flex items-start gap-2"></div>
              <div className="flex items-start gap-2">
                <dt className="font-semibold text-slate-900">Bảo hành</dt>
                <dd>12 tháng</dd>
              </div>
            </dl>

            <div className="flex flex-wrap gap-3">
              <AddToCartButton id={p.id} />
              <Link
                href="/products"
                className="rounded-lg border border-gray-200 px-4 py-2.5 text-slate-700 hover:bg-gray-50"
              >
                Quay lại danh sách
              </Link>
            </div>
          </div>
        </section>

        {/* Sản phẩm liên quan */}
        <section className="grid gap-4 max-w-[1400px] mx-12">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">
              Sản phẩm liên quan
            </h2>
            <Link
              href="/products"
              className="text-sm font-semibold text-blue-600 hover:underline"
            >
              Xem tất cả
            </Link>
          </div>

          <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-5">
            {related.map((r) => (
              <div
                key={r.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <Link href={`/products/${r.slug}`}>
                  <img
                    src={r.image ?? ""}
                    className="h-40 w-full bg-gray-50 object-contain transition duration-200 hover:scale-[1.02]"
                    alt={r.title}
                  />
                </Link>

                <div className="flex h-full flex-col gap-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-extrabold leading-snug text-slate-900">
                      {r.title}
                    </h3>
                    <div className="flex flex-col items-end gap-1">
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
                        {r.category ?? "Khac"}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-slate-600">
                    {shorten(r.description)}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span>Rating: {r.rating ?? "4.8"}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span>Price: {currency(r.price)}</span>
                  </div>
                  <div className="mt-auto grid grid-cols-2 items-stretch gap-2">
                    <Link
                      href={`/products/${r.slug}`}
                      className="flex items-center justify-center rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
                    >
                      Xem chi tiết
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
