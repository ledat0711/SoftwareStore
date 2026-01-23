import {
  DEFAULT_CATEGORY,
  DEFAULT_PLATFORM,
} from "@/constants/product";
import type { Product } from "@/types/product";

export type ProductDraft = {
  slug: string;
  title: string;
  description: string;
  image: string;
  price: string;
  rating: string;
  tag: string;
  badge: string;
  category: string;
  platform: string;
  hidden: boolean;
};

export function buildDraft(product: Product): ProductDraft {
  return {
    slug: product.slug ?? "",
    title: product.title ?? "",
    description: product.description ?? "",
    image: product.image ?? "",
    price: Number.isFinite(product.price) ? String(product.price) : "0",
    rating:
      product.rating === null || product.rating === undefined
        ? ""
        : String(product.rating),
    tag: product.tag ?? "",
    badge: product.badge ?? "",
    category: product.category ?? DEFAULT_CATEGORY,
    platform: product.platform ?? DEFAULT_PLATFORM,
    hidden: Boolean(product.hidden),
  };
}
