"use client";

import { useMemo } from "react";
import {
  CATEGORY_BASE,
  DEFAULT_CATEGORY,
  DEFAULT_PLATFORM,
  PLATFORM_BASE,
} from "@/constants/product";
import type { ProductDraft } from "./types";

type ProductEditFormProps = {
  draft: ProductDraft;
  isDirty: boolean;
  saving: boolean;
  status?: { tone: "error" | "success"; text: string } | null;
  onChange: (next: Partial<ProductDraft>) => void;
  onSave: () => void;
  onReset: () => void;
};

const inputClass =
  "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20";

export default function ProductEditForm({
  draft,
  isDirty,
  saving,
  status,
  onChange,
  onSave,
  onReset,
}: ProductEditFormProps) {
  const categoryOptions = useMemo(() => {
    const items = [draft.category, DEFAULT_CATEGORY, ...CATEGORY_BASE].filter(
      (item): item is string => Boolean(item),
    );
    return Array.from(new Set(items));
  }, [draft.category]);

  const platformOptions = useMemo(() => {
    const items = [draft.platform, DEFAULT_PLATFORM, ...PLATFORM_BASE].filter(
      (item): item is string => Boolean(item),
    );
    return Array.from(new Set(items));
  }, [draft.platform]);

  return (
    <form
      className="grid gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        onSave();
      }}
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Chi tiết</h2>
            <p className="text-sm text-slate-500">
              Cập nhật thông tin chính của sản phẩm.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            {isDirty ? (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 font-semibold text-amber-700">
                Unsaved changes
              </span>
            ) : (
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 font-semibold text-emerald-700">
                Up to date
              </span>
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-semibold text-slate-700">
              Tên sản phẩm
            </label>
            <input
              className={inputClass}
              value={draft.title}
              onChange={(event) => onChange({ title: event.target.value })}
              placeholder="Nhập tên sản phẩm"
              required
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-semibold text-slate-700">Slug</label>
            <input
              className={inputClass}
              value={draft.slug}
              onChange={(event) => onChange({ slug: event.target.value })}
              placeholder="Tự động tạo nếu để trống"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-semibold text-slate-700">
                Giá (USD)
              </label>
              <input
                className={inputClass}
                type="number"
                min="0"
                step="0.01"
                value={draft.price}
                onChange={(event) => onChange({ price: event.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-semibold text-slate-700">
                Rating
              </label>
              <input
                className={inputClass}
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={draft.rating}
                onChange={(event) => onChange({ rating: event.target.value })}
                placeholder="0 - 5"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-semibold text-slate-700">
              Image URL
            </label>
            <input
              className={inputClass}
              value={draft.image}
              onChange={(event) => onChange({ image: event.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-semibold text-slate-700">
              Mô tả
            </label>
            <textarea
              className={`${inputClass} min-h-[120px]`}
              value={draft.description}
              onChange={(event) => onChange({ description: event.target.value })}
              placeholder="Mô tả ngắn về sản phẩm"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-semibold text-slate-700">Tag</label>
              <input
                className={inputClass}
                value={draft.tag}
                onChange={(event) => onChange({ tag: event.target.value })}
                placeholder="Dev Tools, Productivity..."
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-semibold text-slate-700">
                Badge
              </label>
              <input
                className={inputClass}
                value={draft.badge}
                onChange={(event) => onChange({ badge: event.target.value })}
                placeholder="Hot, New, Featured..."
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-semibold text-slate-700">
                Category
              </label>
              <select
                className={inputClass}
                value={draft.category}
                onChange={(event) => onChange({ category: event.target.value })}
              >
                {categoryOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-semibold text-slate-700">
                Platform
              </label>
              <select
                className={inputClass}
                value={draft.platform}
                onChange={(event) => onChange({ platform: event.target.value })}
              >
                {platformOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={draft.hidden}
              onChange={(event) => onChange({ hidden: event.target.checked })}
            />
            Ẩn sản phẩm khỏi trang bán hàng
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-slate-500">
            {status ? (
              <span
                className={
                  status.tone === "error"
                    ? "text-rose-600"
                    : "text-emerald-600"
                }
              >
                {status.text}
              </span>
            ) : (
              "Kiểm tra preview trước khi lưu."
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onReset}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={saving || !isDirty}
            >
              Hoàn tác
            </button>
            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={saving || !isDirty}
            >
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
