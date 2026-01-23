import { currency, slugify } from "@/lib/helpers";
import type { ProductDraft } from "./types";

type ProductPreviewProps = {
  draft: ProductDraft;
};

function toNumber(value: string, fallback = 0) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export default function ProductPreview({ draft }: ProductPreviewProps) {
  const computedSlug = draft.slug.trim() || slugify(draft.title);
  const priceValue = toNumber(draft.price, 0);
  const ratingValue = toNumber(draft.rating, 0);

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
            Live Preview
          </h2>
          {draft.hidden ? (
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
              Hidden
            </span>
          ) : (
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              Visible
            </span>
          )}
        </div>

        <div className="mt-4 grid gap-4">
          <div className="relative h-48 w-full overflow-hidden rounded-2xl bg-slate-100">
            {draft.image ? (
              <img
                src={draft.image}
                alt={draft.title || "Product image"}
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
                No image
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-semibold text-slate-900">
                {draft.title || "Tên sản phẩm"}
              </h3>
              {draft.badge && (
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                  {draft.badge}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <span>{currency(priceValue)}</span>
              {draft.category && <span>• {draft.category}</span>}
              {draft.platform && <span>• {draft.platform}</span>}
            </div>
            {ratingValue > 0 && (
              <div className="text-sm font-semibold text-amber-500">
                ★ {ratingValue.toFixed(1)}
              </div>
            )}
            {draft.tag && (
              <div className="text-xs font-semibold text-slate-500">
                Tag: {draft.tag}
              </div>
            )}
            <div className="text-xs text-slate-400">slug: {computedSlug}</div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
          Mô tả
        </h3>
        <p className="mt-2 text-sm text-slate-700">
          {draft.description || "Chưa có mô tả sản phẩm."}
        </p>
      </div>
    </div>
  );
}
