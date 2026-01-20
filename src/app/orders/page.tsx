import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { currency } from "@/lib/helpers";
import { getUserOrdersPage } from "@/lib/orders";
import { Session } from "next-auth";

type OrdersPageProps = {
  searchParams: Promise<{
    page?: string;
  }>;
};

const PAGE_SIZE = 10;

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const params = await searchParams;
  const session: Session | null = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const requestedPage = Number(params?.page ?? 1);
  const page =
    Number.isFinite(requestedPage) && requestedPage > 0
      ? Math.floor(requestedPage)
      : 1;

  const { orders, total, totalPages, currentPage } = await getUserOrdersPage(
    userId,
    page,
    PAGE_SIZE
  );

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Đơn hàng của tôi</h1>
      {orders.length === 0 ? (
        <p className="text-gray-600">Bạn chưa có đơn hàng nào.</p>
      ) : (
        <>
          <div className="grid gap-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-gray-500">
                      Mã đơn: {order.code ?? order.id}
                    </p>
                    <p className="text-xs text-gray-400">
                      Thời gian: {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-slate-900">
                      {currency(order.total)}
                    </p>
                    <p className="text-xs text-emerald-700 font-semibold">
                      Trạng thái: {order.status}
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid gap-2 text-sm text-slate-700">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-100 px-3 py-2"
                    >
                      <div className="flex items-center gap-3">
                        {item.product?.image ? (
                          <img
                            src={item.product.image}
                            alt={item.product.title}
                            className="h-10 w-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-gray-100" />
                        )}
                        <div>
                          <p className="font-semibold text-slate-900">
                            {item.product?.title ?? "Sản phẩm"}
                          </p>
                          <p className="text-xs text-gray-500">
                            Số lượng: {item.quantity}
                          </p>
                        </div>
                      </div>
                      <div className="text-right font-semibold text-slate-900">
                        {currency(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-gray-600">
              Trang {currentPage} / {totalPages} - {total} đơn hàng
            </p>
            <div className="flex items-center gap-2">
              <Link
                href={`/orders?page=${Math.max(currentPage - 1, 1)}`}
                className={`rounded-lg border px-3 py-1 text-sm font-medium ${
                  currentPage === 1
                    ? "cursor-not-allowed border-gray-200 text-gray-400"
                    : "border-slate-200 text-slate-700 hover:border-slate-300 hover:text-slate-900"
                }`}
                aria-disabled={currentPage === 1}
              >
                Trang trước
              </Link>
              <span className="text-sm font-semibold text-slate-900">
                {currentPage}
              </span>
              <Link
                href={`/orders?page=${Math.min(currentPage + 1, totalPages)}`}
                className={`rounded-lg border px-3 py-1 text-sm font-medium ${
                  currentPage === totalPages
                    ? "cursor-not-allowed border-gray-200 text-gray-400"
                    : "border-slate-200 text-slate-700 hover:border-slate-300 hover:text-slate-900"
                }`}
                aria-disabled={currentPage === totalPages}
              >
                Trang sau
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
