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

  if (loading)
    return (
      <p className="p-10 text-center text-sm text-gray-600">
        Đang tải sản phẩm...
      </p>
    );

  return (
    <main className="mx-auto grid max-w-5xl gap-8 px-6 py-8">
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

      <section className="grid gap-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <div
              key={p.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white"
            >
              <Link
                href={`/products/${p.slug}`}
                className="relative block bg-gray-50"
              >
                <img
                  src={p.image ?? ""}
                  alt={p.title}
                  className="h-40 w-full object-contain"
                />
                {p.badge && (
                  <span
                    className="absolute left-2 top-2 rounded-full bg-gray-900 px-2 py-1 text-[11px] font-semibold text-white"
                  >
                    {p.badge}
                  </span>
                )}
              </Link>
              <div className="grid gap-2 p-3.5">
                <div className="flex flex-wrap gap-2">
                  {p.category && (
                    <span
                      className="rounded-md bg-gray-100 px-2 py-1 text-[11px]"
                    >
                      {p.category}
                    </span>
                  )}
                  {p.rating && (
                    <span className="text-[11px] font-semibold text-amber-500">
                      ★ {p.rating}
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold leading-tight">
                  <Link
                    href={`/products/${p.slug}`}
                    className="text-gray-900 transition hover:text-gray-700"
                  >
                    {p.title}
                  </Link>
                </h3>
                {p.description && (
                  <p className="text-xs leading-relaxed text-gray-500">
                    {p.description}
                  </p>
                )}
                <div className="flex items-center justify-between">
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
