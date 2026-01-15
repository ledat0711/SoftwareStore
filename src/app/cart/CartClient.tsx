"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartProvider";
import { currency } from "@/lib/helpers";

export default function CartClient() {
  const {
    items,
    updateQuantity,
    removeItem,
    clear,
    subtotal,
    totalItems,
    ready,
  } = useCart();
  // useRouter() trả về đối tượng điều hướng
  const router = useRouter();

  const goToCheckout = () => {
    // items: Mảng sản phẩm trong giỏ hàng
    // Nếu giỏ hàng trống → không cho đi checkout
    if (items.length === 0) return;

    // push = đẩy một URL mới vào history stack
    // Cụ thể: Chuyển trang mà KHÔNG reload lại website
    // Cơ chế khi gọi: router.push("/checkout");
    // 1.Thêm /checkout vào browser history
    // 2.Tải Component của /checkout
    // 3.Giữ nguyên:
    //     Context
    //     State client
    //     Session
    // 4. Không reload HTML gốc
    router.push("/checkout");
  };

  if (!ready) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-3xl font-bold text-slate-900">Your cart</h1>
        <p className="mt-6 text-sm text-gray-600">Loading cart...</p>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-3xl font-bold text-slate-900">Your cart</h1>
        <div className="mt-6 rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center shadow-sm">
          <p className="text-sm text-gray-600">Your cart is empty.</p>
          <Link
            href="/products"
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            Continue shopping
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Your cart</h1>
          <p className="text-sm text-gray-500">{totalItems} items in cart</p>
        </div>
        <button
          type="button"
          onClick={clear}
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          Clear cart
        </button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="grid gap-4">
          {items.map((item) => (
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
                <Link
                  href={`/products/${item.slug}`}
                  className="text-base font-semibold text-slate-900 hover:text-slate-700"
                >
                  {item.title}
                </Link>
                <div className="text-sm text-gray-500">
                  {currency(item.price)}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center rounded-lg border border-gray-200">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                      aria-label={`Decrease ${item.title}`}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={item.quantity}
                      onChange={(event) =>
                        updateQuantity(
                          item.id,
                          Number(event.target.value || item.quantity)
                        )
                      }
                      className="w-14 border-x border-gray-200 px-2 py-1.5 text-center text-sm font-semibold text-gray-800 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                      aria-label={`Increase ${item.title}`}
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="text-sm font-semibold text-red-500 hover:text-red-600"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="flex items-start justify-between text-right text-sm font-semibold text-slate-900">
                <span>{currency(item.price * item.quantity)}</span>
              </div>
            </article>
          ))}
        </section>

        <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Order summary
          </h2>
          <div className="mt-4 grid gap-3 text-sm text-slate-700">
            <div className="flex items-center justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-900">
                {currency(subtotal)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Taxes</span>
              <span>Calculated at checkout</span>
            </div>
          </div>
          <div className="mt-5 grid gap-2">
            <button
              type="button"
              onClick={goToCheckout}
              disabled={items.length === 0}
              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Thanh toán
            </button>
            <Link
              href="/products"
              className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Continue shopping
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}
