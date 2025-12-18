"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
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

type CartContextValue = {
  items: CartItem[];
  addItem: (item: CartItemInput, quantity?: number) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clear: () => void;
  totalItems: number;
  subtotal: number;
  ready: boolean;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => readCartItems());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setItems(readCartItems());
    setReady(true);
  }, []);

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key === CART_STORAGE_KEY || event.key === null) {
        setItems(readCartItems());
      }
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const addItem = useCallback(
    (input: CartItemInput, quantity = 1) => {
      setItems((prev) => {
        const base = ready ? prev : readCartItems();
        const next = addCartItem(base, input, quantity);
        writeCartItems(next);
        return next;
      });
    },
    [ready]
  );

  const updateQuantity = useCallback(
    (id: string, quantity: number) => {
      setItems((prev) => {
        const base = ready ? prev : readCartItems();
        const next = updateCartItemQuantity(base, id, quantity);
        writeCartItems(next);
        return next;
      });
    },
    [ready]
  );

  const removeItem = useCallback(
    (id: string) => {
      setItems((prev) => {
        const base = ready ? prev : readCartItems();
        const next = removeCartItem(base, id);
        writeCartItems(next);
        return next;
      });
    },
    [ready]
  );

  const clear = useCallback(() => {
    writeCartItems([]);
    setItems([]);
  }, []);

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
