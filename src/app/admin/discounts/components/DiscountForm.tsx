"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DiscountScope,
  DiscountStatus,
  DiscountValueType,
} from "@prisma/client";
import { Discount } from "@/types/discount";
import { Product } from "@/types/product";

const statusOptions: DiscountStatus[] = [
  DiscountStatus.ACTIVE,
  DiscountStatus.PAUSED,
  DiscountStatus.DRAFT,
  DiscountStatus.EXPIRED,
];

const scopeOptions: DiscountScope[] = [
  DiscountScope.GLOBAL,
  DiscountScope.PRODUCT,
  DiscountScope.COUPON,
];

const valueTypeOptions: DiscountValueType[] = [
  DiscountValueType.PERCENT,
  DiscountValueType.FIXED,
];

type Props = {
  initial?: Discount | null;
  products: Product[];
  submitUrl: string;
  method?: "POST" | "PATCH";
  redirectUrl?: string;
};

export function DiscountForm({
  initial,
  products,
  submitUrl,
  method = "POST",
  redirectUrl,
}: Props) {
  const router = useRouter();
  const [form, setForm] = useState<Partial<Discount>>({
    scope: initial?.scope ?? DiscountScope.GLOBAL,
    status: initial?.status ?? DiscountStatus.ACTIVE,
    valueType: initial?.valueType ?? DiscountValueType.PERCENT,
    value: initial?.value ?? 10,
    maxValue: initial?.maxValue ?? null,
    minOrderAmount: initial?.minOrderAmount ?? 0,
    allowGuest: initial?.allowGuest ?? true,
    maxUsage: initial?.maxUsage ?? null,
    maxUsagePerUser: initial?.maxUsagePerUser ?? null,
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    code: initial?.code ?? "",
    startAt: initial?.startAt ?? "",
    endAt: initial?.endAt ?? "",
  });
  const [productIds, setProductIds] = useState<string[]>(
    initial?.products?.map((p) => p.productId) ?? [],
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isCoupon = form.scope === DiscountScope.COUPON;
  const isProduct = form.scope === DiscountScope.PRODUCT;

  const selectableProducts = useMemo(
    () => products.filter((p) => !p.isDeleted),
    [products],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        ...form,
        code: isCoupon ? form.code : null,
        productIds: isProduct ? productIds : [],
      };
      const res = await fetch(submitUrl, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => ({}))) as {
        discount?: Discount;
        error?: string;
      };
      if (!res.ok || !json.discount) {
        throw new Error(json.error || "Lưu thất bại");
      }
      setSuccess("Đã lưu discount");
      if (redirectUrl) {
        router.push(redirectUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lưu thất bại");
    } finally {
      setSubmitting(false);
    }
  }

  function toggleProduct(id: string) {
    setProductIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid gap-2">
          <label className="text-sm font-semibold text-gray-800">Tên</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-semibold text-gray-800">Mô tả</label>
          <textarea
            value={form.description ?? ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            rows={2}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <label className="text-sm">
            <div className="font-semibold text-gray-800">Scope</div>
            <select
              value={form.scope}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  scope: e.target.value as DiscountScope,
                }))
              }
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              {scopeOptions.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>

          <label className="text-sm">
            <div className="font-semibold text-gray-800">Value type</div>
            <select
              value={form.valueType}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  valueType: e.target.value as DiscountValueType,
                }))
              }
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              {valueTypeOptions.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>

          <label className="text-sm">
            <div className="font-semibold text-gray-800">Value</div>
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.value}
              onChange={(e) =>
                setForm((f) => ({ ...f, value: Number(e.target.value) }))
              }
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              required
            />
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <label className="text-sm">
            <div className="font-semibold text-gray-800">Max value (cap)</div>
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.maxValue ?? ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  maxValue: e.target.value ? Number(e.target.value) : null,
                }))
              }
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </label>

          <label className="text-sm">
            <div className="font-semibold text-gray-800">Min order amount</div>
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.minOrderAmount ?? 0}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  minOrderAmount: Number(e.target.value),
                }))
              }
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </label>

          <label className="text-sm">
            <div className="font-semibold text-gray-800">Status</div>
            <select
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  status: e.target.value as DiscountStatus,
                }))
              }
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              {statusOptions.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <label className="text-sm">
            <div className="font-semibold text-gray-800">Max usage (total)</div>
            <input
              type="number"
              min={0}
              value={form.maxUsage ?? ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  maxUsage: e.target.value ? Number(e.target.value) : null,
                }))
              }
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            <div className="font-semibold text-gray-800">Max usage per user</div>
            <input
              type="number"
              min={0}
              value={form.maxUsagePerUser ?? ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  maxUsagePerUser: e.target.value ? Number(e.target.value) : null,
                }))
              }
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.allowGuest ?? true}
              onChange={(e) =>
                setForm((f) => ({ ...f, allowGuest: e.target.checked }))
              }
            />
            <span className="font-semibold text-gray-800">Allow guest</span>
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            <div className="font-semibold text-gray-800">Start date</div>
            <input
              type="datetime-local"
              value={form.startAt ? form.startAt.substring(0, 16) : ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  startAt: e.target.value || null,
                }))
              }
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            <div className="font-semibold text-gray-800">End date</div>
            <input
              type="datetime-local"
              value={form.endAt ? form.endAt.substring(0, 16) : ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, endAt: e.target.value || null }))
              }
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            <div className="font-semibold text-gray-800">
              Coupon code (max 5 chars)
            </div>
            <input
              disabled={!isCoupon}
              value={form.code ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))
              }
              maxLength={5}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-100"
            />
          </label>
        </div>
      </div>

      {isProduct && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-2 text-sm font-semibold text-gray-800">
            Sản phẩm áp dụng (chỉ scope PRODUCT)
          </div>
          <div className="grid max-h-64 grid-cols-1 gap-2 overflow-y-auto md:grid-cols-2">
            {selectableProducts.map((p) => (
              <label
                key={p.id}
                className="flex items-center gap-2 rounded-lg border border-gray-100 px-2 py-1.5 text-sm"
              >
                <input
                  type="checkbox"
                  checked={productIds.includes(p.id)}
                  onChange={() => toggleProduct(p.id)}
                />
                <span className="truncate">{p.title}</span>
              </label>
            ))}
            {!selectableProducts.length && (
              <p className="text-sm text-gray-600">No products available</p>
            )}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">{success}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-fit rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-60"
      >
        {submitting ? "Saving..." : "Save discount"}
      </button>
    </form>
  );
}
