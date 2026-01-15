import { auth } from "@/auth";
import { getRecentOrders } from "@/lib/orders";
import { currency } from "@/lib/helpers";
import { Session } from "next-auth";
import { redirect } from "next/navigation";

export default async function AdminOrdersPage() {
  const session: Session | null = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const orders = await getRecentOrders();

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Quản lý đơn hàng</h1>
      {orders.length === 0 ? (
        <p className="text-gray-600">Chưa có đơn hàng nào.</p>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => {
            const customerEmail =
              order.user?.email ??
              order.guestEmail ??
              "Khách chưa đăng nhập/đăng ký";

            return (
              <div
                key={order.id}
                className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-gray-500">Mã đơn: {order.id}</p>
                    <p className="text-xs text-gray-400">
                      Thời gian: {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      Email khách hàng: {customerEmail}
                    </p>
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
            );
          })}
        </div>
      )}
    </div>
  );
}
