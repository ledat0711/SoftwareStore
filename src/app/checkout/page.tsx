"use client";

import Script from "next/script";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
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
  const { items, clear, ready } = useCart();
  const toast = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paypalScriptReady, setPaypalScriptReady] = useState(false);
  const paypalButtonsRef = useRef<HTMLDivElement | null>(null);
  const [paidItems, setPaidItems] = useState<CheckoutItem[]>([]);

  const checkoutItems = useMemo(
    () =>
      items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
      })),
    [items]
  );

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

  useEffect(() => {
    if (!paypalClientId) return;
    if (!paypalScriptReady) return;
    if (!paypalButtonsRef.current) return;
    if (hasPaid) return;
    if (!checkoutItems.length) return;

    const buttons = window.paypal?.Buttons({
      style: { layout: "vertical", color: "gold", shape: "rect" },
      createOrder: async () => {
        setIsProcessing(true);
        const response = await fetch("/api/paypal/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: checkoutItems }),
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
        toast.error("PayPal sandbox loi. Vui long thu lai.");
      },
      onCancel: () => {
        setIsProcessing(false);
      },
    });

    if (!buttons) return;

    buttons
      .render(paypalButtonsRef.current)
      .catch(() => {
        setIsProcessing(false);
        toast.error("Khong the tai nut PayPal sandbox.");
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
    toast,
  ]);

  if (!ready && !hasPaid) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-3xl font-bold text-slate-900">Thanh toan</h1>
        <p className="mt-6 text-sm text-gray-600">Dang tai gio hang...</p>
      </main>
    );
  }

  if (displayItems.length === 0 && !hasPaid) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-3xl font-bold text-slate-900">Thanh toan</h1>
        <div className="mt-6 rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center shadow-sm">
          <p className="text-sm text-gray-600">
            Chua co san pham de thanh toan.
          </p>
          <Link
            href="/products"
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            Tiep tuc mua sam
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      {paypalClientId ? (
        <Script
          src={`https://www.paypal.com/sdk/js?client-id=${paypalClientId}&currency=${paypalCurrency}&intent=capture&components=buttons`}
          strategy="afterInteractive"
          onLoad={() => setPaypalScriptReady(true)}
          onError={() => toast.error("Khong the tai PayPal SDK.")}
        />
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Thanh toan</h1>
          <p className="text-sm text-gray-500">
            {hasPaid
              ? "Da thanh toan bang PayPal (sandbox)"
              : `${displayItems.length} san pham trong gio`}
          </p>
        </div>
        <Link
          href="/cart"
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          Quay lai gio hang
        </Link>
      </div>

      {hasPaid && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
          Thanh toan PayPal (sandbox) thanh cong! Cam on ban da mua hang.
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
          <h2 className="text-lg font-semibold text-slate-900">Tom tat don</h2>
          <div className="mt-4 grid gap-3 text-sm text-slate-700">
            <div className="flex items-center justify-between">
              <span>Tam tinh</span>
              <span className="font-semibold text-slate-900">
                {currency(displaySubtotal)}
              </span>
            </div>
          </div>

          {!hasPaid && (
            <div className="mt-5 grid gap-3">
              {paypalClientId ? (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <div ref={paypalButtonsRef} />
                  {isProcessing ? (
                    <p className="mt-2 text-xs text-gray-500">
                      Dang xu ly thanh toan PayPal sandbox...
                    </p>
                  ) : null}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-gray-200 p-3 text-sm text-gray-600">
                  Chua cau hinh PayPal sandbox. Them NEXT_PUBLIC_PAYPAL_CLIENT_ID, PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET trong file .env.
                </div>
              )}

              <Link
                href="/products"
                className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Tiep tuc mua sam
              </Link>
            </div>
          )}

          {hasPaid && (
            <div className="mt-5 grid gap-2">
              <Link
                href="/products"
                className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Mua them san pham
              </Link>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
