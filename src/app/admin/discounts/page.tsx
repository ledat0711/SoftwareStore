"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  DiscountScope,
  DiscountStatus,
  DiscountValueType,
} from "@prisma/client";
import { Discount } from "@/types/discount";

const API = "/api/admin/discounts";

type ListResponse = { discounts?: Discount[]; error?: string };

async function fetchDiscounts(filters: {
  scope?: DiscountScope | "";
  status?: DiscountStatus | "";
}) {
  const params = new URLSearchParams();
  if (filters.scope) params.set("scope", filters.scope);
  if (filters.status) params.set("status", filters.status);
  const res = await fetch(`${API}?${params.toString()}`, { cache: "no-store" });
  const data = (await res.json()) as ListResponse;
  if (!res.ok) throw new Error(data.error || "Fetch failed");
  return data.discounts ?? [];
}

async function patchDiscount(id: string, data: Partial<Discount>) {
  const res = await fetch(`${API}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = (await res.json()) as { discount?: Discount; error?: string };
  if (!res.ok) throw new Error(json.error || "Update failed");
  return json.discount!;
}

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

export default function AdminDiscountsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [filters, setFilters] = useState<{
    scope: DiscountScope | "";
    status: DiscountStatus | "";
  }>({ scope: "", status: "" });

  useEffect(() => {
    setLoading(true);
    fetchDiscounts(filters)
      .then(setDiscounts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [filters.scope, filters.status]);

  const filtered = useMemo(() => discounts, [discounts]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Discounts</h1>
          <p className="text-sm text-gray-600">
            Quản lý Global / Product / Coupon (1 coupon per cart).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/discounts/new"
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
          >
            + New discount
          </Link>
        </div>
      </header>

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <label className="text-sm">
          <div className="text-gray-700">Scope</div>
          <select
            className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-2 text-sm"
            value={filters.scope}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                scope: (e.target.value as DiscountScope) || "",
              }))
            }
          >
            <option value="">All</option>
            {scopeOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <div className="text-gray-700">Status</div>
          <select
            className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-2 text-sm"
            value={filters.status}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                status: (e.target.value as DiscountStatus) || "",
              }))
            }
          >
            <option value="">All</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading && <p className="text-sm text-gray-600">Loading...</p>}
      {error && (
        <p className="text-sm text-red-600">
          {error}. Reload hoặc kiểm tra quyền.
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full text-sm text-gray-900">
          <thead className="bg-gray-50 text-left font-semibold">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Scope</th>
              <th className="px-3 py-2">Value</th>
              <th className="px-3 py-2">Window</th>
              <th className="px-3 py-2">Usage</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((d) => (
              <tr key={d.id}>
                <td className="px-3 py-2">
                  <div className="font-semibold">{d.name}</div>
                  {d.code && (
                    <div className="text-xs text-gray-500">Code: {d.code}</div>
                  )}
                </td>
                <td className="px-3 py-2">{d.scope}</td>
                <td className="px-3 py-2">
                  {d.valueType === DiscountValueType.PERCENT
                    ? `${d.value}%`
                    : `$${d.value.toFixed(2)}`}
                  {d.maxValue ? ` (cap $${d.maxValue})` : ""}
                </td>
                <td className="px-3 py-2 text-xs text-gray-600">
                  {d.startAt ? new Date(d.startAt).toLocaleDateString() : "Any"}
                  {" → "}
                  {d.endAt ? new Date(d.endAt).toLocaleDateString() : "Any"}
                </td>
                <td className="px-3 py-2 text-xs text-gray-700">
                  {d.usageCount}
                  {d.maxUsage ? ` / ${d.maxUsage}` : ""}{" "}
                  {d.maxUsagePerUser ? `(per user ${d.maxUsagePerUser})` : ""}
                </td>
                <td className="px-3 py-2">
                  <select
                    className="rounded-md border border-gray-200 px-2 py-1 text-xs"
                    value={d.status}
                    onChange={async (e) => {
                      const next = e.target.value as DiscountStatus;
                      setDiscounts((prev) =>
                        prev.map((x) =>
                          x.id === d.id ? { ...x, status: next } : x,
                        ),
                      );
                      try {
                        const updated = await patchDiscount(d.id, {
                          status: next,
                        });
                        setDiscounts((prev) =>
                          prev.map((x) => (x.id === d.id ? updated : x)),
                        );
                      } catch (err) {
                        console.error(err);
                        setDiscounts((prev) =>
                          prev.map((x) =>
                            x.id === d.id ? { ...x, status: d.status } : x,
                          ),
                        );
                      }
                    }}
                  >
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2 text-right text-xs">
                  <Link
                    href={`/admin/discounts/${d.id}`}
                    className="text-blue-600 underline underline-offset-2"
                  >
                    Edit
                  </Link>
                  <span className="mx-1 text-gray-300">·</span>
                  <Link
                    href={`/admin/discounts/${d.id}/analytics`}
                    className="text-gray-700 underline underline-offset-2"
                  >
                    Analytics
                  </Link>
                </td>
              </tr>
            ))}
            {!filtered.length && !loading && (
              <tr>
                <td className="px-3 py-4 text-sm text-gray-600" colSpan={7}>
                  Chưa có discount nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
