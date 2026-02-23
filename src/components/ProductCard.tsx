"use client";

import Link from "next/link";
import { ProductPricing } from "@/lib/services/pricingService";
import { currency } from "@/lib/helpers";

type ProductCardInput = {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  image?: string | null;
  price: number;
  rating?: number | null;
  category?: string | null;
  platform?: string | null;
  badge?: string | null;
  tag?: string | null;
  hidden?: boolean;
  isDeleted?: boolean;
  pricing?: ProductPricing;
};

type Props = {
  product: ProductCardInput;
  globalSale?: boolean;
};

export default function ProductCard({ product, globalSale = false }: Props) {
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
        {globalSale && (
          <span className="absolute top-2 right-2 bg-amber-100 text-amber-800 text-[11px] px-2 py-1 rounded-full font-semibold shadow-sm">
            GLOBAL SALE
          </span>
        )}
        {product.pricing?.appliedDiscount && (
          <span className="absolute top-2 left-2 bg-emerald-600 text-white text-xs px-2 py-1 rounded-full font-semibold">
            {product.pricing.appliedDiscount.label}
          </span>
        )}
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
          <div className="flex flex-col">
            <span className="text-base font-extrabold text-gray-900">
              {currency(product.pricing?.finalPrice ?? product.price)}
            </span>
            {product.pricing?.discountAmount ? (
              <span className="text-xs text-gray-500 line-through">
                {currency(product.pricing.originalPrice)}
              </span>
            ) : null}
          </div>
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
