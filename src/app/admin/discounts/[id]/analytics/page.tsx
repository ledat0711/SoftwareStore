import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DiscountUsageStatus } from "@prisma/client";

type Params = {
  params: Promise<{ id: string }>;
};

export default async function DiscountAnalyticsPage({ params }: Params) {
  const { id } = await params;
  const discount = await prisma.discount.findUnique({
    where: { id },
    include: {
      usages: {
        orderBy: { createdAt: "desc" },
        take: 100,
        include: {
          user: { select: { id: true, email: true } },
          order: { select: { id: true, code: true } },
          cart: { select: { id: true } },
        },
      },
    },
  });

  if (!discount) return notFound();

  const totalUsage = discount.usages.filter(
    (u) => u.status === DiscountUsageStatus.COMPLETED,
  ).length;
  const pending = discount.usages.filter(
    (u) => u.status === DiscountUsageStatus.PENDING,
  ).length;

  const usageByDay = discount.usages.reduce<Record<string, number>>(
    (acc, u) => {
      const day = u.createdAt.toISOString().slice(0, 10);
      if (u.status === DiscountUsageStatus.COMPLETED) {
        acc[day] = (acc[day] || 0) + 1;
      }
      return acc;
    },
    {},
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Analytics · {discount.name}
          </h1>
          <p className="text-sm text-gray-600">
            Code: {discount.code ?? "n/a"} · Scope: {discount.scope}
          </p>
        </div>
        <Link
          href={`/admin/discounts/${discount.id}`}
          className="text-sm font-semibold text-blue-600 underline underline-offset-2"
        >
          ← Back
        </Link>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase text-gray-500">Total usage</p>
          <p className="text-2xl font-bold text-gray-900">{totalUsage}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase text-gray-500">Pending holds</p>
          <p className="text-2xl font-bold text-gray-900">{pending}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase text-gray-500">Cap</p>
          <p className="text-2xl font-bold text-gray-900">
            {discount.maxUsage ?? "∞"}
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <p className="mb-2 text-sm font-semibold text-gray-800">Usage by day</p>
        <div className="grid gap-2 text-sm text-gray-800">
          {Object.entries(usageByDay)
            .sort(([a], [b]) => (a < b ? 1 : -1))
            .map(([day, count]) => (
              <div
                key={day}
                className="flex justify-between border-b border-gray-50 pb-1"
              >
                <span>{day}</span>
                <span className="font-semibold">{count}</span>
              </div>
            ))}
          {!Object.keys(usageByDay).length && (
            <p className="text-sm text-gray-600">Chưa có usage.</p>
          )}
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full text-sm text-gray-900">
          <thead className="bg-gray-50 text-left font-semibold">
            <tr>
              <th className="px-3 py-2">User</th>
              <th className="px-3 py-2">Order/Cart</th>
              <th className="px-3 py-2">Amount</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {discount.usages.map((u) => (
              <tr key={u.id}>
                <td className="px-3 py-2">
                  {u.user?.email ?? "guest"}
                  <div className="text-xs text-gray-500">
                    {u.userId ?? "n/a"}
                  </div>
                </td>
                <td className="px-3 py-2">
                  {u.order?.code ? `Order ${u.order.code}` : "—"}
                  <div className="text-xs text-gray-500">
                    Cart: {u.cartId ?? "n/a"}
                  </div>
                </td>
                <td className="px-3 py-2">${u.amount.toFixed(2)}</td>
                <td className="px-3 py-2">{u.status}</td>
                <td className="px-3 py-2 text-xs text-gray-600">
                  {u.createdAt.toISOString()}
                </td>
              </tr>
            ))}
            {!discount.usages.length && (
              <tr>
                <td className="px-3 py-4 text-sm text-gray-600" colSpan={5}>
                  Chưa có lịch sử sử dụng.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
