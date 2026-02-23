import type { CartItem } from "@/lib/cart";

const CART_API_PATH = "/api/cart";

type CartResponse = {
  items?: CartItem[];
  cartId?: string | null;
  couponCode?: string | null;
};

function createRequestError(status: number) {
  const error = new Error("Cart request failed");
  (error as Error & { status?: number }).status = status;
  return error;
}

async function parseCartResponse(response: Response): Promise<{
  items: CartItem[];
  cartId?: string | null;
  couponCode?: string | null;
}> {
  if (!response.ok) throw createRequestError(response.status);
  const data = (await response.json().catch(() => ({}))) as CartResponse;
  return {
    items: Array.isArray(data.items) ? data.items : [],
    cartId: data.cartId ?? null,
    couponCode: data.couponCode ?? null,
  };
}

export async function fetchCartItems(): Promise<{
  items: CartItem[];
  cartId?: string | null;
  couponCode?: string | null;
}> {
  const response: Response = await fetch(CART_API_PATH, { cache: "no-store" });
  return parseCartResponse(response);
}

export async function addCartItemOnServer(
  productId: string,
  quantity = 1,
): Promise<{ items: CartItem[]; cartId?: string | null; couponCode?: string | null }> {
  const response = await fetch(CART_API_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId, quantity }),
  });
  return parseCartResponse(response);
}

export async function updateCartItemOnServer(
  productId: string,
  quantity: number,
): Promise<{ items: CartItem[]; cartId?: string | null; couponCode?: string | null }> {
  const response = await fetch(CART_API_PATH, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId, quantity }),
  });
  return parseCartResponse(response);
}

export async function removeCartItemOnServer(
  productId: string,
): Promise<{ items: CartItem[]; cartId?: string | null; couponCode?: string | null }> {
  const response = await fetch(
    `${CART_API_PATH}?productId=${encodeURIComponent(productId)}`,
    { method: "DELETE" },
  );
  return parseCartResponse(response);
}

export async function clearCartOnServer(): Promise<{
  items: CartItem[];
  cartId?: string | null;
  couponCode?: string | null;
}> {
  const response = await fetch(CART_API_PATH, { method: "DELETE" });
  return parseCartResponse(response);
}
