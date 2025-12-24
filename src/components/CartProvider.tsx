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
  addItem: (item: CartItemInput, quantity?: number) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clear: () => void;
  totalItems: number;
  subtotal: number;
  ready: boolean;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const [items, setItems] = useState<CartItem[]>(() => readCartItems());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadCart() {
      if (status === "authenticated") {
        setReady(false);
        setItems([]);
        try {
          const next = await fetchCartItems();
          if (!active) return;
          setItems(next);
        } catch {
          if (!active) return;
          setItems([]);
        } finally {
          if (active) setReady(true);
        }
        return;
      }

      if (status === "unauthenticated") {
        setItems(readCartItems());
        setReady(true);
        return;
      }

      setReady(false);
    }

    void loadCart();
    return () => {
      active = false;
    };
  }, [status]);

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

  const addItem = useCallback(
    async (input: CartItemInput, quantity = 1) => {
      if (status === "authenticated") {
        const next = await addCartItemOnServer(input.id, quantity);
        setItems(next);
        return;
      }

      setItems((prev) => {
        const base = ready ? prev : readCartItems();
        const next = addCartItem(base, input, quantity);
        writeCartItems(next);
        return next;
      });
    },
    [ready, status]
  );

  const updateQuantity = useCallback(
    (id: string, quantity: number) => {
      if (status === "authenticated") {
        void updateCartItemOnServer(id, quantity)
          .then((next) => setItems(next))
          .catch(() => {});
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
          .then((next) => setItems(next))
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
    if (status === "authenticated") {
      void clearCartOnServer()
        .then((next) => setItems(next))
        .catch(() => {});
      return;
    }

    writeCartItems([]);
    setItems([]);
  }, [status]);

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      addItem,
      updateQuantity,
      removeItem,
      clear,
      totalItems,
      subtotal,
      ready,
    }),
    [items, addItem, updateQuantity, removeItem, clear, totalItems, subtotal, ready]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
