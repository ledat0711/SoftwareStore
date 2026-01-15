import type { CartItem } from "@/lib/cart";

const CART_API_PATH = "/api/cart";

type CartResponse = {
  items?: CartItem[];
};

// Hàm này có mục đích: Tạo một lỗi liên quan đến request
// Hàm này bắt buộc nhận 1 số, thường là HTTP status (400, 401, 500…)
// Tạo Error
// Gắn thêm status (HTTP code)
// Trả về error để throw hoặc xử lý
function createRequestError(status: number) {
  // Error: Built-in class của JavaScript: Dùng để biểu diễn lỗi runtime
  const error = new Error("Cart request failed");

  // Error & { status?: number }: Đây là intersection type.
  // Error: object gốc của JS
  // & kết hợp type mới { status?: number }
  // status?: number: Thuộc tính status là số, có thể không có (optional)
  // Mục đích: mở rộng object Error để thêm thông tin status vào lỗi
  // (error as Error & { status?: number }): ép kiểu error về kiểu mở rộng này
  // Rồi gán thuộc tính status
  // (error as Error & { status?: number }).status = status;
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

// async: Khai báo đây là hàm bất đồng bộ
// Cho phép dùng từ khóa await bên trong
// Hàm luôn trả về Promise, dù bạn có return gì đi nữa
export async function fetchCartItems(): Promise<CartItem[]> {
  // const → giá trị không gán lại
  // Response là kiểu chuẩn của Fetch API, Có các thuộc tính:
  //      status
  //      ok
  //      json()
  //      text()
  //      headers, v.v.
  // await fetch(...): Gọi API và chờ kết quả
  // fetch
  //      Hàm web API chuẩn
  //      Gửi HTTP request
  // { cache: "no-store" }: Cấu hình fetch
  // chọn chế độ KHÔNG cache
  // Mỗi lần gọi → gọi server thật
  // Không dùng cache cũ
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
