"use client";

import { useMemo, useState } from "react";
import { slugify } from "@/lib/helpers";
import type { Product } from "@/types/product";
import ProductEditForm from "./ProductEditForm";
import ProductPreview from "./ProductPreview";
import { buildDraft, type ProductDraft } from "./types";

type ProductEditWorkspaceProps = {
  product: Product;
};

type UpdatePayload = {
  slug: string;
  title: string;
  description: string | null;
  image: string | null;
  price: number;
  rating: number | null;
  tag: string | null;
  badge: string | null;
  category: string | null;
  platform: string | null;
  hidden: boolean;
};

type UpdateResponse = {
  product?: Product;
  error?: string;
};

function normalizeText(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function buildPayload(draft: ProductDraft): UpdatePayload {
  const title = draft.title.trim();
  if (!title) {
    throw new Error("Tên sản phẩm không được để trống.");
  }

  const priceValue = Number.parseFloat(draft.price);
  if (!Number.isFinite(priceValue) || priceValue < 0) {
    throw new Error("Giá sản phẩm không hợp lệ.");
  }

  const ratingRaw = draft.rating.trim();
  const ratingValue = ratingRaw ? Number.parseFloat(ratingRaw) : null;
  if (
    ratingValue !== null &&
    (!Number.isFinite(ratingValue) || ratingValue < 0 || ratingValue > 5)
  ) {
    throw new Error("Rating phải nằm trong khoảng 0 đến 5.");
  }

  return {
    slug: draft.slug.trim() || slugify(title),
    title,
    description: normalizeText(draft.description),
    image: normalizeText(draft.image),
    price: priceValue,
    rating: ratingValue,
    tag: normalizeText(draft.tag),
    badge: normalizeText(draft.badge),
    category: normalizeText(draft.category),
    platform: normalizeText(draft.platform),
    hidden: draft.hidden,
  };
}

function isDraftEqual(a: ProductDraft, b: ProductDraft) {
  const keys = Object.keys(a) as (keyof ProductDraft)[];
  return keys.every((key) => a[key] === b[key]);
}

export default function ProductEditWorkspace({
  product,
}: ProductEditWorkspaceProps) {
  const [baselineDraft, setBaselineDraft] = useState<ProductDraft>(() =>
    buildDraft(product),
  );
  const [draft, setDraft] = useState<ProductDraft>(() => buildDraft(product));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const previewDraft = useMemo(
    () => ({
      ...draft,
      slug: draft.slug.trim() || slugify(draft.title),
    }),
    [draft],
  );

  const isDirty = !isDraftEqual(draft, baselineDraft);
  const status = error
    ? { tone: "error" as const, text: error }
    : notice
      ? { tone: "success" as const, text: notice }
      : null;

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const payload = buildPayload(draft);
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json().catch(() => ({}))) as UpdateResponse;
      if (!response.ok || !data.product) {
        throw new Error(data.error || "Không thể lưu sản phẩm.");
      }

      const nextDraft = buildDraft(data.product);
      setBaselineDraft(nextDraft);
      setDraft(nextDraft);
      setNotice("Đã lưu thay đổi.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra.");
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setDraft(baselineDraft);
    setError("");
    setNotice("");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]">
      <ProductEditForm
        draft={draft}
        isDirty={isDirty}
        saving={saving}
        status={status}
        onChange={(next) => {
          setDraft((prev) => ({ ...prev, ...next }));
          setError("");
          setNotice("");
        }}
        onSave={handleSave}
        onReset={handleReset}
      />
      <div className="lg:sticky lg:top-6 lg:h-fit">
        <ProductPreview draft={previewDraft} />
      </div>
    </div>
  );
}
