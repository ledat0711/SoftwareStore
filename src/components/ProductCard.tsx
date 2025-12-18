"use client";

import Link from "next/link";
import { Product } from "@/types/product";
import { currency } from "@/lib/helpers";

type Props = {
  product: Product;
};

export default function ProductCard({ product }: Props) {
  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white flex flex-col shadow-sm">
      <Link
        href={`/products/${product.slug}`}
        className="relative block bg-gray-50"
      >
        <img
          src={product.image || ""}
          alt={product.title}
          className="w-full h-36 object-contain"
        />
        {product.badge && (
          <span className="absolute top-2 left-2 bg-gray-900 text-white text-xs px-2 py-1 rounded-full font-semibold">
            {product.badge}
          </span>
        )}
      </Link>

      <div className="flex gap-2 px-3 pt-2 pb-1 text-xs">
        {product.category && (
          <span className="bg-gray-100 px-2 py-1 rounded-md">
            {product.category}
          </span>
        )}
        <span className="text-amber-500 font-bold">
          ★ {product.rating ?? "4.8"}
        </span>
      </div>

      <div className="px-3 pb-3 grid gap-3">
        <h3 className="text-sm font-bold leading-tight">
          <Link
            href={`/products/${product.slug}`}
            className="text-gray-900 hover:text-gray-700 transition-colors"
          >
            {product.title}
          </Link>
        </h3>
        <p className="text-xs text-gray-500 leading-relaxed">
          {product.description}
        </p>

        <div className="flex items-center justify-between">
          <span className="text-base font-extrabold text-gray-900">
            {currency(product.price)}
          </span>
          <Link
            href={`/products/${product.slug}`}
            className="bg-gray-900 text-white border border-transparent px-3 py-2 rounded-lg text-xs font-semibold hover:bg-gray-800 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
          >
            Xem
          </Link>
        </div>
      </div>
    </div>
  );
}
