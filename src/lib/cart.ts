export type CartItem = {
  id: string;
  slug: string;
  title: string;
  price: number;
  image: string | null;
  quantity: number;
};

export type CartItemInput = Omit<CartItem, "quantity">;

export const CART_STORAGE_KEY = "software_store_cart";
const MAX_QUANTITY = 99;

function clampQuantity(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return 1;
  return Math.min(Math.max(Math.floor(parsed), 1), MAX_QUANTITY);
}

function normalizeCartItem(raw: unknown): CartItem | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  const id = String(data.id ?? "").trim();
  const title = String(data.title ?? "").trim();
  const slug = String(data.slug ?? "").trim();
  const price = Number(data.price ?? 0);
  const image = data.image ? String(data.image) : null;
  const quantity = clampQuantity(data.quantity);

  if (!id || !title || !Number.isFinite(price)) return null;

  return {
    id,
    title,
    slug,
    price: Math.max(price, 0),
    image,
    quantity,
  };
}

export function readCartItems(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => normalizeCartItem(item))
      .filter((item): item is CartItem => Boolean(item));
  } catch {
    return [];
  }
}

export function writeCartItems(items: CartItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore write errors (private mode or quota).
  }
}

export function addCartItem(
  items: CartItem[],
  input: CartItemInput,
  quantity = 1
) {
  const qty = clampQuantity(quantity);
  const index = items.findIndex((item) => item.id === input.id);

  if (index >= 0) {
    const next = [...items];
    const existing = next[index];
    next[index] = {
      ...existing,
      ...input,
      quantity: clampQuantity(existing.quantity + qty),
    };
    return next;
  }

  return [...items, { ...input, quantity: qty }];
}

export function removeCartItem(items: CartItem[], id: string) {
  return items.filter((item) => item.id !== id);
}

export function updateCartItemQuantity(
  items: CartItem[],
  id: string,
  quantity: number
) {
  if (quantity <= 0) return removeCartItem(items, id);
  const qty = clampQuantity(quantity);
  return items.map((item) =>
    item.id === id ? { ...item, quantity: qty } : item
  );
}
