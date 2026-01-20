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

// ****** Key idea ******
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
    null,
  );
  const paypalButtonsRef = useRef<HTMLDivElement | null>(null);
  const [paidItems, setPaidItems] = useState<CheckoutItem[]>([]);
  const [guestEmail, setGuestEmail] = useState(session?.user?.email ?? "");

  // checkoutItems: Chỉ dùng để gửi server / PayPal
  // → Không chứa title, image, price
  // → Server sẽ tự lấy giá thật từ DB (an toàn)
  const checkoutItems: { id: string; quantity: number }[] = useMemo(
    () =>
      items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
      })),
    [items],
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
    0,
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
    orderItems: OrderItemResponse[] | undefined,
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

  // Tạo PayPal SDK (window.paypal) vào trong trình duyệt
  // Đảm bảo PayPal SDK (window.paypal) luôn tồn tại trên trình duyệt trước khi render nút PayPal
  // useEffect này giải quyết 3 vấn đề rất quan trọng trong Next.js App Router:
  //     ❌ Không chạy trên server (SSR)
  //     ❌ Không load trùng PayPal SDK
  //     ✅ Hoạt động đúng trong các trường hợp:
  //          + Load trang lần đầu
  //          + Client navigation (Link, router.push)
  useEffect(() => {
    // Chặn các trường hợp không hợp lệ
    // 👉 Nếu chưa cấu hình PayPal, thì:
    //    Không load script
    //    Không render nút
    //    Không làm gì cả
    if (!paypalClientId) return;
    if (typeof window === "undefined") return;

    if (window.paypal) {
      setPaypalScriptReady(true);
      return;
    }

    {
      /*
      // Trong trang web hiện tại, tìm xem đã có thẻ <script> nào dùng để load PayPal SDK chưa.
      / Tức là nó sẽ match với thẻ này:
      <script
        src="https://www.paypal.com/sdk/js?... "
        data-paypal-sdk="true">
      </script> */
    }

    // <HTMLScriptElement> cung cấp các thuộc tính và phương thức đặc biệt để thao tác với phần tử <script>
    // Có thể truy xuất các thuộc tính như:
    // .src
    // .onload
    // .onerror
    const existing: HTMLScriptElement | null =
      document.querySelector<HTMLScriptElement>(
        'script[data-paypal-sdk="true"]',
      );

    if (existing) {
      // thẻ <script> phát ra event "load" khi Script đã tải xong và thực thi xong
      // Khi script PayPal load xong → đánh dấu state paypalScriptReady = true để React biết là có thể render PayPal Buttons
      existing.addEventListener("load", () => setPaypalScriptReady(true), {
        once: true,
      });

      // "error": event bắn ra khi script tải thất bại
      // once: true
      // Listener chỉ chạy 1 lần duy nhất, xong là tự hủy để:
      existing.addEventListener(
        "error",
        () => setPaypalScriptError("Khong the tai PayPal SDK."),
        {
          once: true,
        },
      );

      return;
    }

    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${paypalClientId}&currency=${paypalCurrency}&intent=capture&components=buttons`;
    script.async = true;

    // data-paypal-sdk="true": dòng này sẽ tạo ra trong HTML: data-paypal-sdk="true"
    // dòng ở phía trên: querySelector('script[data-paypal-sdk="true"]') Đi tìm script đó
    script.dataset.paypalSdk = "true";

    // .onload và .onerror là thao tác đăng ký callback cho 2 event: load (Tải thành công) & error (Tải thất bại)
    // Script mới → bạn kiểm soát hoàn toàn → dùng .onload cho gọn
    // Script cũ → có thể đã có handler → dùng addEventListener cho an toàn
    script.onload = () => setPaypalScriptReady(true);
    script.onerror = () => setPaypalScriptError("Không thể tải PayPal SDK.");
    document.head.appendChild(script);
  }, [paypalClientId, paypalCurrency]);

  useEffect(() => {
    // một dẫy các câu lệnh kết thúc với return: đây là hàng rào điều kiện trước khi cho phép code tạo và render nút PayPal bằng window.paypal.Buttons(...).
    // bất kỳ điều kiện nào không hợp lệ → return ngay → KHÔNG tạo nút, KHÔNG gọi PayPal SDK, Không cho thanh toán

    if (!paypalClientId) return; // Nếu chưa cấu hình PayPal Client ID thì return
    if (paypalScriptError) return; // Nếu SDK PayPal load bị lỗi thì return
    if (!paypalScriptReady) return; // Chỉ tiếp tục khi: Script PayPal đã load xong và window.paypal đã tồn tại
    if (!paypalButtonsRef.current) return; // Chỉ render khi: <div ref={paypalButtonsRef} /> đã tồn tại trong DOM
    if (hasPaid) return; // Nếu đã thanh toán rồi → không hiện lại nút PayPal
    if (!checkoutItems.length) return; // Nếu không có sản phẩm → không cho thanh toán
    if (isGuest && !isValidEmail) return; // Nếu là guest (chưa đăng nhập) mà: Chưa nhập email hợp lệ  không cho thanh toán

    // Chúng ta không cần tự tạo nút PayPal bằng tay.
    // Chúng ta chỉ cần thiết lập các giá trị cho thuộc tính style và cung cấp hàm xử lý sự kiện (createOrder, onApprove, onError, onCancel).
    // PayPal SDK sẽ lo phần UI và gọi hàm xử lý sự kiện tương ứng.
    // window.paypal.Buttons({...}) = chúng ta ĐĂNG KÝ cho PayPal biết:
    //     Khi người dùng bấm nút (và PayPal cần tạo đơn PayPal) → gọi createOrder
    //     Khi người dùng thanh toán xong và PayPal approve → gọi onApprove

    // UI (khi nhấn nút PayPal Button)
    //    │
    //    ▼
    // PayPal SDK gọi createOrder()
    //    │
    //    ▼
    // Server /api/paypal/create-order
    //    │
    //    ▼
    // PayPal mở popup thanh toán
    //    │
    // User đăng nhập PayPal + complete purchase
    //    │
    //    ▼
    // PayPal SDK gọi onApprove()
    //    │
    //    ▼
    // Server /api/paypal/capture
    //    │
    //    ▼
    // UI cập nhật: setPaidItems(), clear(), toast.success()

    // nếu nhấn vào nút Paypal => mở cửa sổ, sau đó không nhấn Complete Purchase và tắt cửa sổ. Thì chuyện gì xảy ra?
    // Về mặt nghiệp vụ: Trong thanh toán online, trường hợp này gọi là:
    // Abandoned Payment / Abandoned Checkout (Thanh toán bị bỏ dở)
    const buttons = window.paypal?.Buttons({
      style: { layout: "vertical", color: "gold", shape: "rect", label: "pay" },
      // Khi bấm nút PayPal: PayPal SDK sẽ gọi hàm createOrder().
      // Tóm gọn: gọi phương thức post https://api-m.sandbox.paypal.com/v2/checkout/orders
      createOrder: async () => {
        // setIsProcessing(true): UI chuyển sang trạng thái đang xử lý
        // Khóa nút, hiện loading, không cho bấm nhiều lần.
        setIsProcessing(true);

        // Gửi request lên server
        // checkoutItems: Danh sách { id, quantity } từ giỏ hàng
        // email: Email guest nếu chưa đăng nhập
        const response: Response = await fetch("/api/paypal/create-order", {
          method: "POST",
          //headers như bên dưới để thông báo cho server biết rằng chúng ta gửi dữ liệu JSON
          headers: { "Content-Type": "application/json" },
          // stringify: chuyển object JS thành chuỗi text JSON. VD: { name: "Dat", age: 30 } => '{"name":"Dat","age":30}'
          // HTTP sẽ gửi chuỗi này tới server.
          // trong trường hợp này là:
          // Chúng ta gửi snapshot giỏ hàng + email người mua cho server để:
          // Tạo Order
          // Gọi PayPal API
          // Lưu DB
          // Trả lại orderId
          body: JSON.stringify({ items: checkoutItems, email: orderEmail }),
        });

        // Nhận lại orderId (data.id) từ server
        // PayPal SDK sẽ dùng id này để:
        //    Mở popup PayPal
        //    Gắn order PayPal vào giao dịch của user
        const data = await response.json();
        if (!response.ok || !data?.id) {
          setIsProcessing(false);
          toast.error("Khong the khoi tao thanh toan PayPal.");
          throw new Error("Unable to create PayPal order");
        }

        // không phải trả về cho component React của bạn
        // Mà nó trả về cho PayPal SDK nội bộ

        //4. PayPal SDK dùng data.id để làm gì?
        // PayPal SDK cần PayPal Order ID để:
        //    Gắn giao dịch vào tài khoản PayPal
        //    Mở popup đúng đơn hàng
        //    Biết phải thu bao nhiêu tiền
        //    Sau khi user bấm “Complete Purchase” → SDK gửi orderID cho onApprove
        // Bắt buộc phải return theo chuẩn PayPal:
        // createOrder: () => {
        //   return "PAYPAL_ORDER_ID";
        // }
        return data.id as string;

        // return data.id
        //      │
        //      ▼
        // PayPal SDK giữ orderId trong bộ nhớ nội bộ
        //      │
        //      ▼
        // User đăng nhập PayPal
        //      │
        //      ▼
        // User bấm "Complete Purchase"
        //      │
        //      ▼
        // PayPal server xác nhận thanh toán
        //      │
        //      ▼
        // PayPal SDK gọi lại onApprove()
      },
      // data trong onApprove đến từ đâu?
      // Khi user bấm "Complete Purchase" trong popup PayPal
      // PayPal server xác nhận thanh toán thành công
      // PayPal SDK gọi onApprove(data)
      // với data = { orderID: "PAYPAL_ORDER_ID", ... }
      // orderID này chính là id mà chúng ta return trong createOrder
      // PayPal SDK giữ nó trong bộ nhớ nội bộ suốt quá trình thanh toán.
      // Vì vậy chúng ta không cần tự lưu nó ở đâu cả.
      // orderID này dùng để gọi API capture trên server.
      // Quy trình:
      //CLIENT (Browser)
      // │
      // │ nhấn nút PayPal
      // ▼
      // createOrder()
      // │
      // │ fetch tới api/paypal/create-order
      // ▼
      // SERVER
      // │
      // │ tiếp tục fetch PayPal API
      // ▼
      // PAYPAL SERVER
      // │
      // │ return id = "5O190127TN364715T"
      // ▼
      // SERVER
      // │
      // │ return { id }
      // ▼
      // CLIENT
      // │
      // │ return id
      // ▼
      // PAYPAL SDK
      // │ (giữ orderId)
      // │
      // │ popup thanh toán
      // ▼
      // User bấm "Complete Purchase"
      //     │
      //     ▼
      // PayPal server xác nhận thanh toán
      //     │
      //     ▼
      // PayPal SDK gọi onApprove({ orderID })
      //     │
      //     ▼
      // onApprove gọi /api/paypal/capture với orderID
      //     │
      //     ▼
      // Server gọi PayPal API capture
      //     │
      //     ▼
      // PayPal trả về chi tiết đơn hàng đã thanh toán
      //     │
      //     ▼
      // Server lưu đơn hàng vào DB, trả về chi tiết order cho UI
      //     │
      //     ▼
      // UI cập nhật trạng thái thanh toán thành công
      //     clear() cart
      //     hiển thị thông báo thành công
      //    │
      //    ▼
      // UI hiển thị đơn hàng đã thanh toán
      //    (lấy từ paidItems)
      //     └─ không phụ thuộc cart nữa
      //         (vì cart đã clear)
      //         (paidItems là snapshot lúc thanh toán)
      //        (giúp tránh lỗi nếu user thay đổi cart sau thanh toán)
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
        toast.success("Thanh toán PayPal (sandbox) thành công!");
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

    // hàm bên trong return là hàm cleanup của useEffect
    // Hàm trong return sẽ chạy khi:
    // Component unmount (bị xóa khỏi DOM)
    // Hoặc trước khi effect chạy lại lần tiếp theo (khi dependency thay đổi)
    // Nếu hàm cleanup này trống:
    //    Nút PayPal nhân bản
    //    Popup PayPal mở sai đơn hàng
    //    Event onApprove gọi nhiều lần
    //    RAM tăng dần
    //    UI loading bị kẹt
    return () => {
      setIsProcessing(false);
      // void buttons.close();: // Nếu không có void:
      // TypeScript sẽ cảnh báo:
      // cleanup function must not return a Promise (cleanup function không được phép return Promise)
      // Cleanup chỉ được return void
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
                    // khi nhấn vào input thì dữ liệu được gán vào event.target.value
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

              {/* Khi nào nút paypal hiện, khi nào không?
              // không hiện khi:
              //      chưa cấu hình PayPal
              //      load PayPal SDK lỗi
              //      PayPal SDK chưa load xong
              //      đã thanh toán rồi
              //      không có sản phẩm trong giỏ hàng
              //      là guest mà chưa nhập email hợp lệ
              // hiện khi: các điều kiện trên đều hợp lệ
              */}
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
