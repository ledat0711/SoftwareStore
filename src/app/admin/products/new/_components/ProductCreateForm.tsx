"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CATEGORY_BASE, DEFAULT_CATEGORY, DEFAULT_PLATFORM, PLATFORM_BASE } from "@/constants/product";
import { slugify } from "@/lib/helpers";
import { useToast } from "@/components/ToastProvider";
import { createProductAction, type CreateProductResult } from "../actions";
import type { ProductCreateInput } from "../schema";
import ProductLivePreview, { type ProductPreviewDraft } from "./ProductLivePreview";

type ProductCreateFormProps = {
  defaultCategory?: string;
  defaultPlatform?: string;
  categories: string[];
  platforms: string[];
};

type FieldErrors = Partial<Record<keyof ProductPreviewDraft, string>>;

const inputClass =
  "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20";

const toggleClass =
  "relative inline-flex h-6 w-11 items-center rounded-full transition";

const initialDraft: ProductPreviewDraft = {
  title: "",
  slug: "",
  category: DEFAULT_CATEGORY,
  platform: DEFAULT_PLATFORM,
  badge: "",
  hidden: false,
  description: "",
  image: "",
  price: "0",
  rating: "",
  tag: "",
};

function normalizeNumber(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildPayload(draft: ProductPreviewDraft, hiddenOverride?: boolean): ProductCreateInput {
  const title = draft.title.trim();
  const slug = (draft.slug.trim() || slugify(title)).trim();
  const price = normalizeNumber(draft.price);
  const ratingRaw = draft.rating.trim();
  const rating =
    ratingRaw === "" ? null : Number.isFinite(Number.parseFloat(ratingRaw)) ? Number.parseFloat(ratingRaw) : null;

  return {
    title,
    slug,
    category: draft.category.trim() || DEFAULT_CATEGORY,
    platform: draft.platform.trim() || DEFAULT_PLATFORM,
    badge: draft.badge.trim() || null,
    hidden: hiddenOverride ?? draft.hidden,
    description: draft.description.trim() || null,
    image: draft.image.trim() || null,
    price,
    rating,
    tag: draft.tag.trim() || null,
  };
}

export default function ProductCreateForm({
  defaultCategory = DEFAULT_CATEGORY,
  defaultPlatform = DEFAULT_PLATFORM,
  categories,
  platforms,
}: ProductCreateFormProps) {
  const [draft, setDraft] = useState<ProductPreviewDraft>({
    ...initialDraft,
    category: defaultCategory,
    platform: defaultPlatform,
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const router = useRouter();

  const previewDraft = useMemo(
    () => ({
      ...draft,
      slug: draft.slug.trim() || slugify(draft.title),
    }),
    [draft],
  );

  function validateDraft(): boolean {
    const nextErrors: FieldErrors = {};
    if (!draft.title.trim()) nextErrors.title = "Title is required";
    if (!(draft.slug.trim() || draft.title.trim())) nextErrors.slug = "Slug is required";
    if (!draft.category.trim()) nextErrors.category = "Category is required";
    if (!draft.platform.trim()) nextErrors.platform = "Platform is required";
    if (!Number.isFinite(normalizeNumber(draft.price))) nextErrors.price = "Price must be a number";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit(hiddenOverride?: boolean) {
    if (!validateDraft()) {
      toast.error("Vui lòng kiểm tra lại các trường bắt buộc.");
      return;
    }

    const payload = buildPayload(draft, hiddenOverride);

    startTransition(async () => {
      toast.info("Đang lưu sản phẩm...");
      const result: CreateProductResult = await createProductAction(payload);
      if (!result.ok) {
        toast.error(result.error || "Không thể tạo sản phẩm.");
        return;
      }
      toast.success("Đã tạo sản phẩm mới.");
      router.push("/admin/products");
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]">
      <div className="grid gap-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Admin / Products / New</p>
              <h1 className="text-2xl font-semibold text-slate-900">Thêm sản phẩm</h1>
              <p className="text-sm text-slate-500">
                Workspace toàn màn hình để nhập thông tin sản phẩm mới.
              </p>
            </div>
          </header>

          {/* Basic Info */}
          <div className="mt-6 space-y-5">
            <div className="grid gap-2">
              <label className="text-sm font-semibold text-slate-700">Title *</label>
              <input
                className={inputClass}
                value={draft.title}
                onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Nhập tên sản phẩm"
              />
              {errors.title && <p className="text-xs text-rose-600">{errors.title}</p>}
            </div>

            <div className="grid gap-2">
              <label className="flex items-center justify-between text-sm font-semibold text-slate-700">
                <span>Slug *</span>
                <button
                  type="button"
                  onClick={() =>
                    setDraft((prev) => ({ ...prev, slug: slugify(prev.title || prev.slug || "") }))
                  }
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  Tự động từ Title
                </button>
              </label>
              <input
                className={inputClass}
                value={draft.slug}
                onChange={(e) => setDraft((prev) => ({ ...prev, slug: e.target.value }))}
                placeholder="tên-sản-phẩm"
              />
              {errors.slug && <p className="text-xs text-rose-600">{errors.slug}</p>}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-slate-700">Category *</label>
                <select
                  className={inputClass}
                  value={draft.category}
                  onChange={(e) => setDraft((prev) => ({ ...prev, category: e.target.value }))}
                >
                  {[defaultCategory, ...CATEGORY_BASE, ...categories]
                    .filter(Boolean)
                    .reduce<string[]>((acc, cur) => (acc.includes(cur) ? acc : [...acc, cur]), [])
                    .map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                </select>
                {errors.category && <p className="text-xs text-rose-600">{errors.category}</p>}
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-semibold text-slate-700">Platform *</label>
                <select
                  className={inputClass}
                  value={draft.platform}
                  onChange={(e) => setDraft((prev) => ({ ...prev, platform: e.target.value }))}
                >
                  {[defaultPlatform, ...PLATFORM_BASE, ...platforms]
                    .filter(Boolean)
                    .reduce<string[]>((acc, cur) => (acc.includes(cur) ? acc : [...acc, cur]), [])
                    .map((pf) => (
                      <option key={pf} value={pf}>
                        {pf}
                      </option>
                    ))}
                </select>
                {errors.platform && <p className="text-xs text-rose-600">{errors.platform}</p>}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-slate-700">Badge</label>
                <input
                  className={inputClass}
                  value={draft.badge}
                  onChange={(e) => setDraft((prev) => ({ ...prev, badge: e.target.value }))}
                  placeholder="Hot, New, Featured..."
                />
              </div>
              <div className="grid gap-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  Hidden
                  <span
                    className={`${toggleClass} ${draft.hidden ? "bg-slate-900" : "bg-slate-200"}`}
                    onClick={() => setDraft((prev) => ({ ...prev, hidden: !prev.hidden }))}
                    role="switch"
                    aria-checked={draft.hidden}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                        draft.hidden ? "translate-x-5" : "translate-x-1"
                      }`}
                    />
                  </span>
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Content</h2>
          <div className="mt-4 space-y-4">
            <div className="grid gap-2">
              <label className="text-sm font-semibold text-slate-700">Description</label>
              <textarea
                className={`${inputClass} min-h-[140px]`}
                value={draft.description}
                onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Mô tả chi tiết sản phẩm"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-semibold text-slate-700">Image URL</label>
              <input
                className={inputClass}
                value={draft.image}
                onChange={(e) => setDraft((prev) => ({ ...prev, image: e.target.value }))}
                placeholder="https://..."
              />
            </div>
          </div>
        </section>

        {/* Commerce */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Commerce</h2>
          <div className="mt-4 space-y-4">
            <div className="grid gap-2">
              <label className="text-sm font-semibold text-slate-700">Price (USD)</label>
              <input
                className={inputClass}
                type="number"
                min="0"
                step="0.01"
                value={draft.price}
                onChange={(e) => setDraft((prev) => ({ ...prev, price: e.target.value }))}
                placeholder="129.00"
              />
              {errors.price && <p className="text-xs text-rose-600">{errors.price}</p>}
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-semibold text-slate-700">Rating (0 - 5)</label>
              <input
                className={inputClass}
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={draft.rating}
                onChange={(e) => setDraft((prev) => ({ ...prev, rating: e.target.value }))}
                placeholder="4.8"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-semibold text-slate-700">Tag</label>
              <input
                className={inputClass}
                value={draft.tag}
                onChange={(e) => setDraft((prev) => ({ ...prev, tag: e.target.value }))}
                placeholder="Dev Tools, Productivity..."
              />
            </div>
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-end gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <button
            type="button"
            onClick={() => router.push("/admin/products")}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={pending}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Saving..." : "Save Draft"}
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={pending}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <ProductLivePreview draft={previewDraft} />
    </div>
  );
}
