// Client POST /api/orders
//         │
//         ▼
// Lấy session (auth)
//         │
//         ▼
// Parse body JSON
//         │
//         ▼
// Sanitize & validate items
//         │
//         ▼
// Nếu invalid → 400
//         │
//         ▼
// createOrderFromCart()
//         │
//         ├─ Thành công → 200 + order
//         └─ Thất bại → 500

// NextResponse:
// Dùng để trả response HTTP (JSON, status code…) trong App Router.
// Thay cho res.status().json() của Express.
import { NextResponse } from "next/server";
import { auth } from "@/auth";

// createOrderFromCart
// nhận: userId
// danh sách item { id, quantity }
import { createOrderFromCart } from "@/lib/orders";

// Khai báo kiểu dữ liệu item đầu vào
// Dữ liệu client gửi lên không đáng tin,
//     Client có thể gửi thiếu
//     Client có thể gửi sai
// nên:
//      id có thể thiếu
//      quantity có thể thiếu / sai kiểu
// => khai báo là optional (dấu ?)
// Validate thủ công bằng .map() + .filter()
// Đây là cách làm tốt nhất khi làm API
// 1️⃣ Input type luôn cho phép optional
// 2️⃣ Parse → Normalize → Validate (3 bước bắt buộc)
//     Parse: đọc và lấy dữ liệu thô (raw data), thường là JSON
//     Normalize: chuyển về dạng chuẩn (chuẩn hóa kiểu dữ liệu)
//     Validate: kiểm tra tính hợp lệ
// 3️⃣ Fail fast
//     fail fast: nếu phát hiện lỗi, trả về lỗi ngay lập tức, không làm gì thêm
type IncomingItem = { id?: string; quantity?: number };

export async function POST(request: Request): Promise<NextResponse> {
  // Hàm lấy session người dùng hiện tại
  // Trả về thông tin user nếu đã đăng nhập
  const session = await auth();
  const userId: string | null = session?.user?.id ?? null;

  // request: Request
  // Đại diện cho HTTP request gửi tới server
  // Nó chứa:
  //      request.method
  //      request.headers
  //      request.body
  //      request.json():
  // request.json():
  //      Hàm đọc body của request, Chuyển body từ: JSON text → JavaScript object
  //      throw error nếu: Body rỗng, Body không phải JSON hợp lệ, Request đã đọc body rồi
  // .catch(() => null): Bắt lỗi nếu request.json() bị lỗi, Khi lỗi xảy ra → trả về null
  // 1. Lấy danh sách items thô từ body
  // Kiểm tra items có phải mảng hay không
  // Nếu không phải mảng → gán thành mảng rỗng []
  // Đảm bảo biến rawItems luôn là mảng
  // Tránh lỗi khi truy cập .map() bên dưới
  const body = await request.json().catch(() => null);
  const rawItems: IncomingItem[] = Array.isArray(body?.items) ? body.items : [];

  // 2. Chuẩn hóa và lọc lọc danh sách items
  // map(): Chuẩn hóa từng item/bản ghi trong rawItems thành dạng chuẩn:
  //      id: string (cắt khoảng trắng đầu đuôi)
  //      quantity: number
  //     Nếu id hoặc quantity không tồn tại, gán giá trị mặc định:
  //          id: "" (chuỗi rỗng)
  //          quantity: 0
  // filter(): Lọc bỏ những item không hợp lệ:
  //      id rỗng
  //      quantity không phải số hợp lệ
  // Mô tả chi tiết:
  // map(): Được gọi với mỗi item trong rawItems
  //      Trả về object mới với:
  //          id: Lấy item.id, nếu không tồn tại thì lấy chuỗi rỗng "", chuyển về string, cắt khoảng trắng đầu đuôi
  //          quantity: Lấy item.quantity, nếu không tồn tại thì lấy 0, chuyển về number
  // Kết quả của map(): Mảng các item đã được chuẩn hóa
  // filter(): Được gọi với mỗi item đã chuẩn hóa từ map()
  //      Kiểm tra:
  //          item.id phải khác rỗng
  //          item.quantity phải là số hợp lệ (Number.isFinite)
  // Kết quả của filter(): Mảng các item đã được chuẩn hóa và hợp lệ
  const items = rawItems
    .map((item) => ({
      id: String(item?.id ?? "").trim(),
      quantity: Number(item?.quantity ?? 0),
    }))
    .filter((item) => item.id && Number.isFinite(item.quantity));

  // 3. Nếu danh sách items sau khi lọc rỗng
  // Trả về phản hồi JSON với mã trạng thái 400 (Bad Request)
  // và thông báo lỗi "Missing or invalid items"
  // Đây là ví dụ của "fail fast" Ngay khi phát hiện lỗi, trả về lỗi ngay lập tức
  if (!items.length) {
    return NextResponse.json(
      { error: "Missing or invalid items" },
      { status: 400 }
    );
  }

  try {
    const order = await createOrderFromCart(userId, items);
    return NextResponse.json({ order });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to create order" },
      { status: 500 }
    );
  }
}
