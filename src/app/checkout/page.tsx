// Luồng tổng quát
// CartProvider
//    │
//    ├─ items, clear(), ready
//    │
//    ▼
// CheckoutPage
//    │
//    ├─ checkoutItems   (id + quantity)  → gửi cho PayPal
//    ├─ displayItems    (dữ liệu để render UI)
//    ├─ displaySubtotal (tính tiền)
//    │
//    ├─ Load PayPal SDK (useEffect #1)
//    │
//    ├─ Render PayPal Buttons (useEffect #2)
//    │      │
//    │      ├─ createOrder  → POST /api/paypal/create-order
//    │      ├─ onApprove    → POST /api/paypal/capture
//    │      │                   ↓
//    │      │             result.order.items
//    │      │                   ↓
//    │      │            mapOrderItems()
//    │      │                   ↓
//    │      │             setPaidItems()
//    │      │             clear() cart
//    │      │
//    │      └─ onError / onCancel
//    │
//    ▼
// UI
//    ├─ Trước thanh toán: hiển thị items từ cart
//    └─ Sau thanh toán: hiển thị paidItems

// *** Key idea ***
// cart items ≠ order items
// Sau khi trả tiền, UI không phụ thuộc cart nữa.

"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
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

export default function CheckoutPage() {
  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "";
  const paypalCurrency = process.env.NEXT_PUBLIC_PAYPAL_CURRENCY ?? "USD";
  const { status, data: session } = useSession();
  const { items, clear, ready } = useCart();
  const toast = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paypalScriptReady, setPaypalScriptReady] = useState(false);
  const [paypalScriptError, setPaypalScriptError] = useState<string | null>(
    null
  );
  const paypalButtonsRef = useRef<HTMLDivElement | null>(null);
  const [paidItems, setPaidItems] = useState<CheckoutItem[]>([]);
  const [guestEmail, setGuestEmail] = useState(session?.user?.email ?? "");

  // checkoutItems: Chỉ dùng để gửi server / PayPal
  // → Không chứa title, image, price
  // → Server sẽ tự lấy giá thật từ DB (an toàn)
  const checkoutItems = useMemo(
    () =>
      items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
      })),
    [items]
  );

  // displayItems chỉ phục vụ UI
  // Trước thanh toán → lấy từ cart
  // Sau thanh toán → lấy từ paidItems (snapshot)
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

  const displaySubtotal = displayItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const hasPaid = paidItems.length > 0;
  const isGuest = status !== "authenticated";
  const orderEmail = (session?.user?.email ?? guestEmail ?? "").trim();
  const isValidEmail = orderEmail.length > 3 && orderEmail.includes("@");

  useEffect(() => {
    if (session?.user?.email) {
      setGuestEmail((prev) => (prev || session.user?.email) ?? "");
    }
  }, [session?.user?.email]);

  // mapOrderItems(): Convert response từ server → CheckoutItem chuẩn cho UI
  const mapOrderItems = (
    orderItems: OrderItemResponse[] | undefined
  ): CheckoutItem[] =>
    (orderItems ?? [])
      .map((item) => ({
        id: item.product?.id ?? "",
        slug: item.product?.slug ?? "",
        title: item.product?.title ?? "San pham",
        image: item.product?.image ?? null,
        quantity: item.quantity ?? 1,
        price: item.price ?? 0,
      }))
      .filter((item) => item.id);

  // Ensure PayPal SDK is present (works both on first load and client navigation)
  useEffect(() => {
    if (!paypalClientId) return;
    if (typeof window === "undefined") return;
    if (window.paypal) {
      setPaypalScriptReady(true);
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-paypal-sdk="true"]'
    );
    if (existing) {
      existing.addEventListener("load", () => setPaypalScriptReady(true), {
        once: true,
      });
      existing.addEventListener(
        "error",
        () => setPaypalScriptError("Khong the tai PayPal SDK."),
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${paypalClientId}&currency=${paypalCurrency}&intent=capture&components=buttons`;
    script.async = true;
    script.dataset.paypalSdk = "true";
    script.onload = () => setPaypalScriptReady(true);
    script.onerror = () => setPaypalScriptError("Khong the tai PayPal SDK.");
    document.head.appendChild(script);
  }, [paypalClientId, paypalCurrency]);

  useEffect(() => {
    if (!paypalClientId) return;
    if (paypalScriptError) return;
    if (!paypalScriptReady) return;
    if (!paypalButtonsRef.current) return;
    if (hasPaid) return;
    if (!checkoutItems.length) return;
    if (isGuest && !isValidEmail) return;

    // Chúng ta không cần tự tạo nút PayPal bằng tay.
    // Chúng ta chỉ cần thiết lập các giá trị cho thuộc tính style và cung cấp hàm xử lý sự kiện (createOrder, onApprove, onError, onCancel).
    // PayPal SDK sẽ lo phần UI và gọi hàm xử lý sự kiện tương ứng.
    // window.paypal.Buttons({...}) = chúng ta ĐĂNG KÝ cho PayPal biết:
    //     Khi người dùng bấm nút (và PayPal cần tạo đơn PayPal) → gọi createOrder
    //     Khi người dùng thanh toán xong và PayPal approve → gọi onApprove
    const buttons = window.paypal?.Buttons({
      style: { layout: "vertical", color: "gold", shape: "rect", label: "pay" },
      createOrder: async () => {
        setIsProcessing(true);
        const response = await fetch("/api/paypal/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: checkoutItems, email: orderEmail }),
        });

        const data = await response.json();
        if (!response.ok || !data?.id) {
          setIsProcessing(false);
          toast.error("Khong the khoi tao thanh toan PayPal.");
          throw new Error("Unable to create PayPal order");
        }

        return data.id as string;
      },
      onApprove: async (data) => {
        const response = await fetch("/api/paypal/capture", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: data.orderID,
            items: checkoutItems,
            email: orderEmail,
          }),
        });

        const result = await response.json();
        if (!response.ok) {
          setIsProcessing(false);
          toast.error("Khong the luu don hang. Vui long thu lai.");
          throw new Error(result?.error ?? "Capture failed");
        }

        const orderItems = mapOrderItems(result?.order?.items);
        if (!orderItems.length) {
          setIsProcessing(false);
          toast.error("Don hang khong hop le.");
          return;
        }

        setPaidItems(orderItems);
        clear();
        toast.success("Thanh toan PayPal sandbox thanh cong!");
        setIsProcessing(false);
      },
      onError: () => {
        setIsProcessing(false);
        toast.error("Paypal sandbox lỗi. Vui lòng thử lại.");
      },
      onCancel: () => {
        setIsProcessing(false);
      },
    });

    if (!buttons) return;

    // Khi render PayPal Buttons vào div rỗng paypalButtonsRef.current thì
    // PayPal SDK sẽ tự động tạo nút PayPal và gắn vào div đó cho chúng ta.
    // Chúng ta không cần tự tạo nút PayPal bằng tay.
    // Chúng ta chỉ cần cung cấp hàm xử lý sự kiện (createOrder, onApprove, onError, onCancel).
    // PayPal SDK sẽ lo phần UI và gọi hàm xử lý sự kiện tương ứng.
    // render: giải thích ngắn gọn: PayPal SDK nạp nút PayPal vào div paypalButtonsRef.current.
    // giải thích đầy đủ:
    // paypalButtonsRef.current
    //     là DOM element thật (<div>) mà React đã render ra
    // buttons
    //     là instance UI do window.paypal.Buttons({...}) tạo ra
    // render(element)
    //     PayPal SDK tự sinh HTML + iframe + JS nội bộ
    //     rồi inject trực tiếp vào element đó
    //     Bạn KHÔNG tự vẽ nút PayPal
    //     Bạn chỉ “chỉ vị trí” cho PayPal vẽ
    buttons.render(paypalButtonsRef.current).catch(() => {
      setIsProcessing(false);
      toast.error("Không thể tải nút PayPal sandbox.");
    });

    return () => {
      setIsProcessing(false);
      void buttons.close();
    };
  }, [
    checkoutItems,
    clear,
    hasPaid,
    paypalClientId,
    paypalScriptReady,
    paypalScriptError,
    isGuest,
    isValidEmail,
    orderEmail,
    toast,
  ]);

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
              ? "Đã thanh toán bằng PayPal (sandbox)"
              : `${displayItems.length} sản phẩm trong giỏ hàng`}
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
          Thanh toán PayPal (sandbox) thành công! Cảm ơn bạn đã mua hàng.
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="grid gap-4">
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
            <div className="mt-5 grid gap-3">
              {isGuest ? (
                <div className="grid gap-2">
                  <label className="text-sm font-semibold text-slate-900">
                    Nhập email để nhận hóa đơn (*)
                  </label>
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(event) => setGuestEmail(event.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    placeholder="you@example.com"
                  />
                  {!isValidEmail ? (
                    <p className="text-xs text-red-600">
                      Vui lòng nhập email hợp lệ để thanh toán.
                    </p>
                  ) : null}
                </div>
              ) : null}

              {paypalClientId ? (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <div ref={paypalButtonsRef} />
                  {isGuest && !isValidEmail ? (
                    <p className="mt-2 text-xs text-gray-600">
                      Nhập email để hiện nút PayPal.
                    </p>
                  ) : null}
                  {isProcessing ? (
                    <p className="mt-2 text-xs text-gray-500">
                      Đang xử lý thanh toán PayPal sandbox...
                    </p>
                  ) : null}
                  {paypalScriptError ? (
                    <p className="mt-2 text-xs text-red-600">
                      {paypalScriptError}
                    </p>
                  ) : null}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-gray-200 p-3 text-sm text-gray-600">
                  Chưa cấu hình PayPal sandbox. Thêm
                  NEXT_PUBLIC_PAYPAL_CLIENT_ID, PAYPAL_CLIENT_ID,
                  PAYPAL_CLIENT_SECRET trong file .env.
                </div>
              )}

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
