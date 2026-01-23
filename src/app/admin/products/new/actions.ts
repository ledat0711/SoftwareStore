"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { slugify } from "@/lib/helpers";
import { productCreateSchema, type ProductCreateInput } from "./schema";

export type CreateProductResult =
  | { ok: true; productId: string; slug: string }
  | { ok: false; error: string };

function normalizePayload(input: ProductCreateInput) {
  return {
    ...input,
    slug: input.slug.trim(),
    title: input.title.trim(),
    category: input.category.trim(),
    platform: input.platform.trim(),
    badge: input.badge?.trim() || null,
    description: input.description?.trim() || null,
    image: input.image?.trim() || null,
    tag: input.tag?.trim() || null,
    rating:
      input.rating === null || input.rating === undefined ? null : input.rating,
  };
}

export async function createProductAction(
  raw: ProductCreateInput,
): Promise<CreateProductResult> {
  try {
    const parsed = productCreateSchema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, error: "Invalid payload" };
    }

    const payload = normalizePayload(parsed.data);

    const slug = payload.slug || slugify(payload.title);
    if (!slug) return { ok: false, error: "Invalid slug" };

    const existing = await prisma.product.findFirst({
      where: { slug, isDeleted: false },
      select: { id: true },
    });
    if (existing) {
      return { ok: false, error: "Slug đã tồn tại. Vui lòng chọn slug khác." };
    }

    const created = await prisma.product.create({
      data: {
        ...payload,
        slug,
      },
      select: { id: true, slug: true },
    });

    revalidatePath("/admin/products");
    revalidatePath("/products");
    revalidatePath("/");

    return { ok: true, productId: created.id, slug: created.slug };
  } catch (err) {
    console.error("createProductAction error:", err);
    return { ok: false, error: "Không thể tạo sản phẩm. Vui lòng thử lại." };
  }
}
