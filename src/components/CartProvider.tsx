// quản lý state + gọi server/localStorage
// Vì sao phải tách CartProvider.tsx riêng?
// để có 1 “bộ não trung tâm” quản lý giỏ hàng cho toàn app.
// Vì CartProvider dùng React Context
// Nên phải là Client Component
// Nhưng trang /products/[slug]/page.tsx là Server Component
// Nên không thể đặt CartProvider ở đó được
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSession } from "next-auth/react";
import {
  addCartItem,
  CART_STORAGE_KEY,
  CartItem,
  CartItemInput,
  readCartItems,
  removeCartItem,
  updateCartItemQuantity,
  writeCartItems,
} from "@/lib/cart";
import {
  addCartItemOnServer,
  clearCartOnServer,
  fetchCartItems,
  removeCartItemOnServer,
  updateCartItemOnServer,
} from "@/lib/cart-api";

type CartContextValue = {
  items: CartItem[];
  cartId?: string | null;
  couponCode?: string | null;
  addItem: (item: CartItemInput, quantity?: number) => Promise<void>;
  applyCoupon: (code: string) => Promise<{ ok: boolean; message: string }>;
  removeCoupon: () => Promise<void>;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clear: () => void;
  totalItems: number;
  subtotal: number;
  ready: boolean;
};

const CartContext: React.Context<CartContextValue | null> =
  createContext<CartContextValue | null>(null);

// children là nội dung được đặt BÊN TRONG component khi component đó được dùng.
// children = toàn bộ JSX nằm giữa cặp thẻ mở–đóng của component
export function CartProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();

  const [items, setItems] = useState<CartItem[]>(() => readCartItems());
  const [cartId, setCartId] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  //useEffect #1 – load cart theo trạng thái đăng nhập
  // Đã đăng nhập → lấy cart từ server
  // Chưa đăng nhập → lấy cart từ localStorage
  // Kiểm soát loading (ready)
  // Tránh lỗi setState khi component đã unmount

  // useEffect(() => {
  //   ...
  // }, [status]); useEffect chạy mỗi khi status thay đổi
  useEffect(() => {
    // Biến active – chống bug setState sau unmount (unmount: component bị tháo ra / biến mất khỏi màn hình: khi chuyển trang)
    // active là cờ an toàn (safety flag)
    // true → component còn sống
    // false → component đã unmount
    // Dùng để tránh lỗi rất phổ biến: Can't perform a React state update on an unmounted component
    let active = true;

    //
    async function loadCart(): Promise<void> {
      // Trường hợp 1: Người dùng đã login
      if (status === "authenticated") {
        // setReady(false)	báo UI: đang load cart
        // setItems([])	clear cart cũ để tránh hiển thị sai
        // Tránh trường hợp:
        // user logout → login account khác
        // cart cũ vẫn hiện tạm thời
        setReady(false);
        setItems([]);
        try {
          // các item trong giỏ hàng: truy xuất từ server
          const next = await fetchCartItems();
          if (!active) return;
          setItems(next.items);
          setCartId(next.cartId ?? null);
          setCouponCode(next.couponCode ?? null);
        } catch {
          if (!active) return;
          setItems([]);
          setCartId(null);
          setCouponCode(null);
        } finally {
          if (active) setReady(true);
        }
        return;
      }

      // Trường hợp 2: CHƯA đăng nhập
      if (status === "unauthenticated") {
        setItems(readCartItems());
        setCartId(null);
        setCouponCode(null);
        setReady(true);
        return;
      }

      // if (status === "loading") // Đang kiểm tra session
      setReady(false);
    }

    void loadCart();
    return () => {
      active = false;
    };
  }, [status]);

  // useEffect #2 – đồng bộ nhiều tab (localStorage)
  // Ý nghĩa:

  // Mở 2 tab trình duyệt
  // Tab A thêm sản phẩm
  // Tab B tự động cập nhật
  // event.key === null → khi localStorage.clear()
  // Chỉ áp dụng cho guest
  // User đăng nhập thì giỏ hàng do server quản lý

  // áp dụng cho trường hợp chưa đăng nhập
  useEffect(() => {
    if (status === "authenticated") return;

    function handleStorage(event: StorageEvent) {
      if (event.key === CART_STORAGE_KEY || event.key === null) {
        setItems(readCartItems());
      }
    }

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [status]);

  // addItem trong CartProvider (điểm quyết định luồng)
  // Chìa khóa là status từ useSession()
  const addItem = useCallback(
    async (input: CartItemInput, quantity = 1) => {
      // Khi đã đăng nhập
      // cart do server quản lý
      if (status === "authenticated") {
        // addCartItemOnServer(input.id, quantity): gọi API thêm sản phẩm vào giỏ hàng trên server
        const next = await addCartItemOnServer(input.id, quantity);
        setItems(next.items);
        setCartId(next.cartId ?? null);
        setCouponCode(next.couponCode ?? null);
        return;
      }

      // Khi chưa đăng nhập
      // cart do localStorage quản lý
      setItems((prev) => {
        // "ready ? prev : readCartItems()"
        // Nếu user bấm rất sớm khi cart chưa load xong
        // prev có thể là [] tạm thời
        // Nên đọc lại localStorage để tránh mất dữ liệu
        const base = ready ? prev : readCartItems();
        const next = addCartItem(base, input, quantity);
        writeCartItems(next);
        return next;
      });
    },
    [ready, status]
  );

  const applyCoupon = useCallback(
    async (code: string) => {
      if (status !== "authenticated") {
        return { ok: false, message: "Vui lòng đăng nhập để áp dụng coupon" };
      }
      if (!cartId) {
        return { ok: false, message: "Cart chưa sẵn sàng" };
      }
      try {
        const response = await fetch("/api/coupons/apply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, cartId }),
        });
        const data = await response.json();
        if (!response.ok) {
          return { ok: false, message: data?.error || "Không áp dụng được coupon" };
        }
        setCouponCode(data?.coupon?.code ?? null);
        return { ok: true, message: "Áp dụng coupon thành công" };
      } catch {
        return { ok: false, message: "Không áp dụng được coupon" };
      }
    },
    [cartId, status],
  );

  const removeCoupon = useCallback(async () => {
    if (status !== "authenticated" || !cartId) return;
    try {
      await fetch("/api/coupons/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartId }),
      });
      setCouponCode(null);
    } catch {
      // ignore
    }
  }, [cartId, status]);

  // updateQuantity & removeItem – cùng một nguyên lý
  // nếu đã đăng nhập => thao tác trên server
  // nếu chưa đăng nhập => thao tác trên localStorage
  // tại sao KHÔNG dùng async/await?
  // nếu dùng async thì phải bọc cả hàm hàm với từ khóa async
  // trong khi hàm này có thể gọi ở server hoặc client
  // nên không thể chắc chắn hàm này luôn chạy trong môi trường async
  const updateQuantity = useCallback(
    (id: string, quantity: number) => {
      if (status === "authenticated") {
        void updateCartItemOnServer(id, quantity)
          .then((next) => {
            setItems(next.items);
            setCartId(next.cartId ?? null);
            setCouponCode(next.couponCode ?? null);
          })
          .catch(() => {}); // catch: cố tình bắt lấy lỗi, Không làm crash UI
        return;
      }

      setItems((prev) => {
        const base = ready ? prev : readCartItems();
        const next = updateCartItemQuantity(base, id, quantity);
        writeCartItems(next);
        return next;
      });
    },
    [ready, status]
  );

  const removeItem = useCallback(
    (id: string) => {
      if (status === "authenticated") {
        void removeCartItemOnServer(id)
          .then((next) => {
            setItems(next.items);
            setCartId(next.cartId ?? null);
            setCouponCode(next.couponCode ?? null);
          })
          .catch(() => {});
        return;
      }

      setItems((prev) => {
        const base = ready ? prev : readCartItems();
        const next = removeCartItem(base, id);
        writeCartItems(next);
        return next;
      });
    },
    [ready, status]
  );

  const clear = useCallback(() => {
    // nếu đã login => thao tác trên server
    if (status === "authenticated") {
      void clearCartOnServer()
        .then((next) => {
          setItems(next.items);
          setCartId(next.cartId ?? null);
          setCouponCode(next.couponCode ?? null);
        })
        .catch(() => {});
      return;
    }

    // nếu chưa login => thao tác trên localStorage
    writeCartItems([]);
    setItems([]);
  }, [status]);

  // Đoạn này dùng để tính tổng số lượng sản phẩm trong giỏ hàng, và tối ưu render bằng useMemo.
  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  // Cộng toàn bộ tiền của các sản phẩm trong giỏ
  // Chỉ tính lại khi items thay đổi
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  // nếu không dùng useMemo: tốn render
  // Chỉ tạo object value mới KHI các dependency thay đổi
  // Đây là hàm trả về object
  // React sẽ:
  //     Gọi hàm này chỉ khi cần
  //     Cache kết quả
  const value = useMemo(
    () => ({
      items,
      cartId,
      couponCode,
      addItem,
      applyCoupon,
      removeCoupon,
      updateQuantity,
      removeItem,
      clear,
      totalItems,
      subtotal,
      ready,
    }),
    [
      items,
      cartId,
      couponCode,
      addItem,
      updateQuantity,
      removeItem,
      clear,
      applyCoupon,
      removeCoupon,
      totalItems,
      subtotal,
      ready,
    ]
  );

  // value={value} là nơi nạp toàn bộ dữ liệu vào CartContext
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// function useCart: custom hook dùng để check null/undefined, dùng lại logic truy cập giỏ hàng
// Một function được gọi là custom hook khi:
// Gọi hook khác
// Trả về logic dùng chung
// Không phải component UI, không trả về JSX
export function useCart() {
  //   useState / useEffect / useCallback
  //         ↓
  //       value (object)
  //         ↓
  // <CartContext.Provider value={value}>
  //         ↓
  //    useContext(CartContext)
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
