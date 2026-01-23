import { currency, slugify } from "@/lib/helpers";

export type ProductPreviewDraft = {
  title: string;
  slug: string;
  category: string;
  platform: string;
  badge: string;
  hidden: boolean;
  description: string;
  image: string;
  price: string;
  rating: string;
  tag: string;
};

function toNumber(value: string, fallback = 0) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export default function ProductLivePreview({
  draft,
}: {
  draft: ProductPreviewDraft;
}) {
  const computedSlug = draft.slug.trim() || slugify(draft.title);
  const priceValue = toNumber(draft.price, 0);
  const ratingValue = toNumber(draft.rating, 0);

  return (
    <div className="sticky top-4 space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Preview
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

        <div className="mt-4 grid gap-3">
          <div className="flex items-center gap-3">
            <div className="h-16 w-16 overflow-hidden rounded-xl bg-slate-100">
              {draft.image ? (
                <img
                  src={draft.image}
                  alt={draft.title || "Preview"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                  No image
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold text-slate-900">
                {draft.title || "Tên sản phẩm"}
              </p>
              <p className="text-sm text-slate-500">
                {draft.category || "Category"} • {draft.platform || "Platform"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
            <span className="font-semibold">{currency(priceValue)}</span>
            {ratingValue > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                ★ {ratingValue.toFixed(1)}
              </span>
            )}
            {draft.badge && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                {draft.badge}
              </span>
            )}
            {draft.tag && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                {draft.tag}
              </span>
            )}
          </div>

          <p className="text-sm text-slate-600">
            {draft.description || "Thêm mô tả để hiển thị ở đây."}
          </p>

          <p className="text-xs text-slate-400">slug: {computedSlug}</p>
        </div>
      </div>
    </div>
  );
}
