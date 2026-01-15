// CartProvider (Context)
//    │
//    ├─ items, subtotal, clear, ready
//    │
//    ▼
// CheckoutPage (Client Component)
//    │
//    ├─ displayItems (items (trước thanh toán) HOẶC paidItems (sau thanh toán))
//    ├─ displaySubtotal (tính lại từ displayItems)
//    │
//    ├─ click "Thanh toán Paypal"
//    │      │
//    │      ├─ gọi API /api/orders (POST)
//    │      │      └─ lưu Order + OrderItem trong DB
//    │      │
//    │      └─ trả về order.items
//    │
//    ├─ setPaidItems(orderItems)
//    ├─ clear() cart
//    │
//    ▼
// UI hiển thị trạng thái "Đã thanh toán"

// Trang Checkout là client component.
// Nó lấy dữ liệu giỏ hàng từ CartProvider.
// Khi chưa thanh toán, UI hiển thị dữ liệu từ cart.
// Khi bấm thanh toán, nó gọi API tạo đơn hàng, lưu lại snapshot sản phẩm đã mua vào state paidItems, sau đó clear cart.

"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/CartProvider";
import { useToast } from "@/components/ToastProvider";
import { currency } from "@/lib/helpers";

type CheckoutItem = {
  id: string;
  slug: string;
  title: string;
  image: string | null;
  quantity: number;
  price: number;
};

export default function CheckoutPage() {
  const { items, subtotal, clear, ready } = useCart();
  const toast = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  // paidItems: sau khi thanh toán thành công thì sẽ lưu các sản phẩm đã mua vào paidItems để hiển thị lại cho người dùng xem
  // Nếu không có paidItems → clear cart là mất dữ liệu hiển thị sau khi thanh toán
  const [paidItems, setPaidItems] = useState<CheckoutItem[]>([]);

  // displayItems: hiển thị item trước hoặc sau khi thanh toán
  const displayItems =
    paidItems.length > 0
      ? paidItems
      : items.map((item) => ({
          id: item.id,
          slug: item.slug,
          title: item.title,
          image: item.image,
          quantity: item.quantity,
          price: item.price,
        }));

  // Vì sao tính lại displaySubtotal?
  // Tư duy decouple (tách phụ thuộc)
  // Cart subtotal ≠ Order subtotal (sau này có thuế, giảm giá)
  // UI không phụ thuộc cart nữa
  // Luôn tính từ displayItems
  const displaySubtotal = displayItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const hasPaid = paidItems.length > 0;

  // Mục tiêu tổng thể của hàm handlePaypalSimulation:
  // Hàm handlePaypalSimulation với chức năng giả lập thanh toán với 4 mục tiêu chính:
  // 1. Chặn click trùng khi đang xử lý
  // 2. Gửi cart items lên server để:
  //      tạo Order
  //      tạo OrderItem
  // 3. Nhận lại bản sao chép sản phẩm đã mua
  // 4. Cập nhật UI sang trạng thái “Đã thanh toán” → paidItems không phụ thuộc cart nữa
  // async → cho phép dùng await bên trong hàm này để viết code bất đồng bộ dễ đọc hơn phương pháp then/catch
  const handlePaypalSimulation = async () => {
    if (isProcessing) return;
    if (items.length === 0) {
      // hiện bảng thông báo nhỏ Giỏ hàng trống, hãy thêm sản phẩm trước
      toast.info("Giỏ hàng trống, hãy thêm sản phẩm trước.");
      return;
    }

    setIsProcessing(true);
    try {
      // Giả lập gọi PayPal: đợi một chút rồi cho là thành công
      await new Promise((resolve) => setTimeout(resolve, 900));

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            id: item.id,
            quantity: item.quantity,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Order API failed");
      }

      type OrderItemResponse = {
        product?: {
          id?: string;
          slug?: string;
          title?: string;
          image?: string | null;
        };
        quantity?: number;
        price?: number;
      };

      const data = await response.json();
      const orderItems: CheckoutItem[] =
        (data?.order?.items as OrderItemResponse[] | undefined)?.map(
          (item) => ({
            id: item.product?.id ?? "",
            slug: item.product?.slug ?? "",
            title: item.product?.title ?? "Sản phẩm",
            image: item.product?.image ?? null,
            quantity: item.quantity ?? 1,
            price: item.price ?? 0,
          })
        ) ?? [];

      if (!orderItems.length) {
        throw new Error("No order items returned");
      }

      setPaidItems(orderItems);
      clear();
      toast.success("Thanh toán (giả lập) thành công!");
    } catch (error) {
      toast.error("Không thể lưu đơn hàng. Vui lòng thử lại.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!ready && !hasPaid) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-3xl font-bold text-slate-900">Thanh toán</h1>
        <p className="mt-6 text-sm text-gray-600">Đang tải giỏ hàng...</p>
      </main>
    );
  }

  if (displayItems.length === 0 && !hasPaid) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-3xl font-bold text-slate-900">Thanh toán</h1>
        <div className="mt-6 rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center shadow-sm">
          <p className="text-sm text-gray-600">
            Chưa có sản phẩm để thanh toán.
          </p>
          <Link
            href="/products"
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            Tiếp tục mua sắm
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Thanh toán</h1>
          <p className="text-sm text-gray-500">
            {hasPaid
              ? "Đã thanh toán bằng PayPal (giả lập)"
              : `${displayItems.length} sản phẩm trong giỏ`}
          </p>
        </div>
        <Link
          href="/cart"
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          Quay lại giỏ hàng
        </Link>
      </div>

      {hasPaid && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
          Thanh toán (giả lập) thành công! Cảm ơn bạn đã mua hàng.
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
        {/* <section className="grid gap-4"></section>
        Chỉ là container UI, để bọc danh sách OrderItem đã mua
        grid gap-4 = xếp các item theo dạng lưới, mỗi item cách nhau 4 
        */}
        <section className="grid gap-4">
          {/* JSX: map + HTML 
          Với mỗi item trong mảng displayItems, hãy tạo ra một khối UI*/}
          {displayItems.map((item) => (
            <article
              key={item.id}
              className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:grid-cols-[96px_1fr_auto]"
            >
              <div className="h-24 w-24 rounded-xl border border-gray-100 bg-gray-50">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-full w-full rounded-xl object-contain p-2"
                  />
                ) : null}
              </div>

              <div className="flex flex-col gap-2">
                <div className="text-base font-semibold text-slate-900">
                  {item.title}
                </div>
                <div className="text-sm text-gray-500">
                  {currency(item.price)} × {item.quantity}
                </div>
              </div>

              <div className="flex items-start justify-between text-right text-sm font-semibold text-slate-900">
                <span>{currency(item.price * item.quantity)}</span>
              </div>
            </article>
          ))}
        </section>

        {/* Tóm tắt đơn */}
        <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Tóm tắt đơn</h2>
          <div className="mt-4 grid gap-3 text-sm text-slate-700">
            <div className="flex items-center justify-between">
              <span>Tạm tính</span>
              <span className="font-semibold text-slate-900">
                {currency(displaySubtotal)}
              </span>
            </div>
          </div>

          {!hasPaid && (
            <div className="mt-5 grid gap-2">
              <button
                type="button"
                onClick={handlePaypalSimulation}
                disabled={isProcessing}
                className="inline-flex items-center justify-center rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isProcessing
                  ? "Đang thanh toán Paypal..."
                  : "Thanh toán bằng Paypal (giả lập)"}
              </button>
              <Link
                href="/products"
                className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Tiếp tục mua sắm
              </Link>
            </div>
          )}

          {hasPaid && (
            <div className="mt-5 grid gap-2">
              <Link
                href="/products"
                className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Mua thêm sản phẩm
              </Link>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
