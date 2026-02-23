import Link from "next/link";
import { currency } from "@/lib/helpers";
import { pricingService, ProductWithPricing } from "@/lib/services/pricingService";
import { GlobalDiscountBanner } from "@/components/GlobalDiscountBanner";
import ProductFilters from "./ProductFilters";

// url có thể là
// /products
// /products?category=Office
// /products?platform=Windows
// /products?category=Office&platform=Windows

type SearchParams = {
  category?: string;
  platform?: string;
};

// Đảm bảo kết quả LUÔN là string[]
const toArray = (v: string | string[] | undefined) => Array.isArray(v) ? v : v ? [v] : [];

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  // Revalidate periodically to reflect admin changes to discounts
  // (adjust in production, see revalidate export below)
  const params: SearchParams = await searchParams;
  const categoryFilter: string[] = toArray(params.category);
  const platformFilter: string[] = toArray(params.platform);

  const products: ProductWithPricing[] =
    await pricingService.getVisibleProductsWithPricing(
      categoryFilter,
      platformFilter
    );
  const globalDiscount = await pricingService.getActiveGlobalDiscount();

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white">
      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-10">
        <header className="rounded-2xl bg-white/80 p-6 shadow-sm ring-1 ring-gray-100 backdrop-blur">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold text-slate-900">
                Tất cả sản phẩm
              </h1>
              <p className="text-sm text-slate-600">
                Kho phần mềm đa dạng cho nhu cầu công việc, học tập và sáng tạo.
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/"
                className="rounded-xl border border-blue-200 bg-white px-3.5 py-2 text-sm font-semibold text-blue-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
              >
                Về trang chủ
              </Link>
            </div>
          </div>
        </header>

        {globalDiscount ? (
          <GlobalDiscountBanner
            name={globalDiscount.name}
            value={globalDiscount.value}
            valueType={globalDiscount.valueType}
            endsAt={globalDiscount.endsAt}
          />
        ) : null}

        <section className="grid gap-4 lg:grid-cols-[220px_1fr]">
          <aside className="h-fit rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <ProductFilters
              categoryFilter={categoryFilter}
              platformFilter={platformFilter}
            />
          </aside>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
            {products.map((p) => (
              <article
                key={p.id}
                className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-1 hover:shadow-lg"
              >
                <Link
                  href={`/products/${p.slug}`}
                  className="relative aspect-[4/3] bg-gradient-to-br from-slate-50 to-slate-100"
                >
                  <img
                    src={p.image ?? ""}
                    alt={p.title}
                    className="absolute inset-0 h-full w-full object-contain p-3 transition duration-200 group-hover:scale-[1.03]"
                  />

                  {globalDiscount ? (
                    <span className="absolute left-2 bottom-2 rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-800 shadow-sm">
                      GLOBAL SALE
                    </span>
                  ) : null}
                  {p.pricing.appliedDiscount && (
                    <span className="absolute left-2 top-2 rounded-full bg-emerald-600 px-2 py-1 text-[11px] font-semibold text-white shadow-sm">
                      {p.pricing.appliedDiscount.label}
                    </span>
                  )}
                  {p.badge && (
                    <span className="absolute right-2 top-2 rounded-full bg-gray-900 px-2 py-1 text-[11px] font-semibold text-white shadow-sm">
                      {p.badge}
                    </span>
                  )}
                </Link>

                <div className="flex flex-1 flex-col gap-3 p-3.5">
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    {p.category && (
                      <span className="rounded-md bg-blue-50 px-2 py-1 font-semibold text-blue-700">
                        {p.category}
                      </span>
                    )}
                    {p.platform && (
                      <span className="rounded-md bg-slate-100 px-2 py-1 font-semibold text-slate-700">
                        {p.platform}
                      </span>
                    )}
                    {p.rating && (
                      <span className="font-semibold text-amber-500">
                        ★ {p.rating}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold leading-tight text-slate-900 line-clamp-2">
                    {p.title}
                  </h3>

                  {p.description && (
                    <p className="text-xs leading-relaxed text-slate-600 line-clamp-3">
                      {p.description}
                    </p>
                  )}

                  <div className="mt-auto flex items-center justify-between pt-2">
                    <div className="flex flex-col">
                      <span className="text-sm font-extrabold text-slate-900">
                        {currency(p.pricing.finalPrice)}
                      </span>
                      {p.pricing.discountAmount > 0 && (
                        <span className="text-xs text-slate-500 line-through">
                          {currency(p.pricing.originalPrice)}
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/products/${p.slug}`}
                      className="rounded-lg border border-transparent bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    >
                      Xem chi tiết
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

// Incremental revalidation to reflect discount toggles without full redeploy
export const revalidate = 120;
