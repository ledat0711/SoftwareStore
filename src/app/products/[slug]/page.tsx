import type { Metadata } from "next";
import Link from "next/link";
import AddToCartButton from "./AddToCartButton";
import { currency } from "@/lib/helpers";
import { pricingService, ProductWithPricing } from "@/lib/services/pricingService";

// Server function đặc biệt của Next.js
// Hiển thị ở Thẻ Meta trong thẻ Header của trang
// /products/windows-11-pro
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug }: { slug: string } = await params;
  const product = await pricingService.getProductWithPricing(slug);

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

function shorten(text: string | null | undefined, max: number = 90) {
  if (!text) return "Mô tả đang cập nhật";
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

export default async function ProductDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug }: { slug: string } = await params;
  const mainProduct: ProductWithPricing | null =
    await pricingService.getProductWithPricing(slug);

  if (!mainProduct) {
    return (
      <main className="mx-auto mt-10 max-w-5xl p-6">
        <h1>Không tìm thấy sản phẩm</h1>
        <Link href="/products">Quay lại danh sách</Link>
      </main>
    );
  }

  const relatedProduct: ProductWithPricing[] = (
    await pricingService.getVisibleProductsWithPricing(
      mainProduct.category ? [mainProduct.category] : [],
      []
    )
  )
    .filter((p) => p.id !== mainProduct.id)
    .slice(0, 4);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white ">
      <div className="mx-auto grid max-w-[1280px] gap-10 px-6 py-10">
        {/* Breadcrumb */}
        <nav className="text-sm text-slate-500">
          <Link href="/" className="text-blue-600 hover:underline">
            Trang chủ
          </Link>{" "}
          /{" "}
          <Link href="/products" className="text-blue-600 hover:underline">
            Sản phẩm
          </Link>{" "}
          / <span className="text-slate-900">{mainProduct.title}</span>
        </nav>

        {/* Hero */}
        <section className="w-full mx-auto max-w-[1400px] px-6 grid grid-cols-1 gap-6 rounded-2xl bg-white p-6 shadow-lg ring-1 ring-gray-100 lg:grid-cols-[minmax(340px,1fr)_minmax(340px,1fr)]">
          <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-slate-50 to-slate-100 p-4">
            <img
              src={mainProduct.image ?? ""}
              alt={mainProduct.title}
              className="block h-80 w-full rounded-xl bg-white object-contain shadow-sm"
            />
          </div>

          <div className="grid gap-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-2">
                <h1 className="text-3xl font-extrabold text-slate-900">
                  {mainProduct.title}
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-slate-500">
              <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">
                <span className="text-lg">★</span> {mainProduct.rating ?? 4.8} /
                5
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex flex-col">
                <span className="text-3xl font-black text-slate-900">
                  {currency(mainProduct.pricing.finalPrice)}
                </span>
                {mainProduct.pricing.discountAmount > 0 && (
                  <span className="text-base text-slate-500 line-through">
                    {currency(mainProduct.pricing.originalPrice)}
                  </span>
                )}
              </div>
              {mainProduct.pricing.appliedDiscount && (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                  {mainProduct.pricing.appliedDiscount.label}
                </span>
              )}
            </div>

            <p className="leading-relaxed text-gray-700">
              {mainProduct.description ?? "Mo ta dang cap nhat"}
            </p>

            {mainProduct.pricing.appliedDiscount?.expiresAt && (
              <p className="text-sm text-amber-600">
                Giảm giá đến ngày:{" "}
                {mainProduct.pricing.appliedDiscount.expiresAt.toLocaleDateString(
                  "vi-VN"
                )}
              </p>
            )}

            <dl className="grid grid-cols-1 gap-3 rounded-xl border border-gray-100 bg-slate-50 p-4 text-sm text-slate-700 sm:grid-cols-2 max-w-[300px]">
              <div className="flex items-start gap-2">
                <dt className="font-semibold text-slate-900">Category</dt>
                <dd>{mainProduct.category ?? "Khac"}</dd>
              </div>
            </dl>

            <div className="flex flex-wrap gap-3">
              <AddToCartButton
                item={{
                  id: mainProduct.id,
                  slug: mainProduct.slug,
                  title: mainProduct.title,
                  price: mainProduct.price,
                  image: mainProduct.image ?? null,
                }}
              />
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
        <section className="w-full mx-auto max-w-[1400px] grid gap-4 px-6">
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
            {relatedProduct.map((r) => (
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
                    <span>Price: {currency(r.pricing.finalPrice)}</span>
                    {r.pricing.discountAmount > 0 && (
                      <span className="text-slate-400 line-through">
                        {currency(r.pricing.originalPrice)}
                      </span>
                    )}
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
