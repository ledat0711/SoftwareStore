import type { CartItem } from "@/lib/cart";

const CART_API_PATH = "/api/cart";

type CartResponse = {
  items?: CartItem[];
};

function createRequestError(status: number) {
  const error = new Error("Cart request failed");
  (error as Error & { status?: number }).status = status;

  // Nếu console.log(error)
  // Console hiển thị:
  // Error: Cart request failed
  //     at createRequestError (...)
  //     Mở rộng object sẽ thấy thêm:
  //     status: 401

  return error;
}

// hàm async trong JavaScript / TypeScript LUÔN trả về Promise
// Quy tắc: của async (rất quan trọng)
// Hễ có async → return value tự động được bọc trong Promise
async function parseCartResponse(response: Response): Promise<CartItem[]> {
  if (!response.ok) {
    throw createRequestError(response.status);
  }
  const data = (await response.json().catch(() => ({}))) as CartResponse;
  return Array.isArray(data.items) ? data.items : [];
}

export async function fetchCartItems(): Promise<CartItem[]> {
  const response: Response = await fetch(CART_API_PATH, { cache: "no-store" });
  return parseCartResponse(response);
}

export async function addCartItemOnServer(
  productId: string,
  quantity = 1
): Promise<CartItem[]> {
  const response = await fetch(CART_API_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId, quantity }),
  });
  return parseCartResponse(response);
}

export async function updateCartItemOnServer(
  productId: string,
  quantity: number
): Promise<CartItem[]> {
  const response = await fetch(CART_API_PATH, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId, quantity }),
  });
  return parseCartResponse(response);
}

export async function removeCartItemOnServer(
  productId: string
): Promise<CartItem[]> {
  const response = await fetch(
    `${CART_API_PATH}?productId=${encodeURIComponent(productId)}`,
    { method: "DELETE" }
  );
  return parseCartResponse(response);
}

export async function clearCartOnServer(): Promise<CartItem[]> {
  const response = await fetch(CART_API_PATH, { method: "DELETE" });
  return parseCartResponse(response);
}
