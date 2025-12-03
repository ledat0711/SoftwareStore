"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Product } from "@/types/product";
import { CATEGORY_BASE, PLATFORM_BASE } from "@/constants/product";
import { toggle } from "@/lib/helpers";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<{
    category: string[];
    platform: string[];
  }>({ category: [], platform: [] });

  useEffect(() => {
    fetch("/api/products?visible=1")
      .then((res) => res.json())
      .then((data: Product[]) => {
        setProducts(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const categoryOptions = useMemo(() => {
    const fromDb = products.map((p) => p.category);
    return Array.from(new Set([...CATEGORY_BASE, ...fromDb])).filter(Boolean);
  }, [products]);

  const platformOptions = useMemo(() => {
    const fromDb = products.map((p) => p.platform);
    return Array.from(new Set([...PLATFORM_BASE, ...fromDb])).filter(Boolean);
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const categoryOk =
        filters.category.length > 0
          ? filters.category.includes(p.category ?? "")
          : true;
      const platformOk =
        filters.platform.length > 0
          ? filters.platform.includes(p.platform ?? "")
          : true;
      return categoryOk && platformOk;
    });
  }, [filters, products]);

  if (loading)
    return (
      <p className="p-10 text-center text-sm text-gray-600">
        Đang tải sản phẩm...
      </p>
    );

  return (
    <main className="mx-auto grid max-w-7xl gap-5 px-6 py-8">
      <header className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold">Tất cả sản phẩm</h1>
          <p className="mt-1 text-sm text-gray-500">
            Kho phần mềm đa dạng cho nhu cầu của bạn
          </p>
        </div>
        <Link
          href="/"
          className="rounded-lg border border-blue-600 px-3 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
        >
          ← Về trang chủ
        </Link>
      </header>

      <section className="grid gap-6 lg:grid-cols-[150px_1fr]">
        <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <h3 className="text-sm font-semibold text-gray-900">
                Categories
              </h3>
              <div className="grid gap-1.5">
                {categoryOptions.map((c) => (
                  <label
                    key={c}
                    className="flex items-center gap-2 text-sm text-gray-800"
                  >
                    <input
                      type="checkbox"
                      checked={filters.category.includes(c ?? "")}
                      onChange={() =>
                        setFilters((prev) => ({
                          ...prev,
                          category: toggle(prev.category, c ?? ""),
                        }))
                      }
                    />
                    <span>{c}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid gap-2 border-t border-gray-200 pt-3">
              <h3 className="text-sm font-semibold text-gray-900">
                Available on
              </h3>
              <div className="grid gap-1.5">
                {platformOptions.map((p) => (
                  <label
                    key={p}
                    className="flex items-center gap-2 text-sm text-gray-800"
                  >
                    <input
                      type="checkbox"
                      checked={filters.platform.includes(p ?? "")}
                      onChange={() =>
                        setFilters((prev) => ({
                          ...prev,
                          platform: toggle(prev.platform, p ?? ""),
                        }))
                      }
                    />
                    <span>{p}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <div className=" grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="h-full flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white"
            >
              <Link
                href={`/products/${p.slug}`}
                className="relative aspect-[4/3] bg-gray-50"
              >
                <img
                  src={p.image ?? ""}
                  alt={p.title}
                  className="absolute inset-0 h-full w-full object-contain p-3"
                />

                {p.badge && (
                  <span className="absolute left-2 top-2 rounded-full bg-gray-900 px-2 py-1 text-[11px] font-semibold text-white">
                    {p.badge}
                  </span>
                )}
              </Link>

              <div className="flex flex-col gap-2 p-3.5 flex-1">
                <div className="flex flex-wrap gap-2">
                  {p.category && (
                    <span className="rounded-md bg-gray-100 px-2 py-1 text-[11px]">
                      {p.category}
                    </span>
                  )}
                  {p.rating && (
                    <span className="text-[11px] font-semibold text-amber-500">
                      ★ {p.rating}
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold leading-tight line-clamp-2">
                  {p.title}
                </h3>

                {p.description && (
                  <p className="text-xs leading-relaxed text-gray-500 line-clamp-3">
                    {p.description}
                  </p>
                )}

                <div className="mt-auto flex items-center justify-between pt-2">
                  <strong className="text-sm font-extrabold text-gray-900">
                    ${p.price}
                  </strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
