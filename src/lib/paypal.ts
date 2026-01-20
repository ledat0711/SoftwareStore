const PAYPAL_BASE_URL =
  process.env.PAYPAL_API_BASE?.trim() || "https://api-m.sandbox.paypal.com";
const PAYPAL_CURRENCY =
  process.env.PAYPAL_CURRENCY?.trim() ||
  process.env.NEXT_PUBLIC_PAYPAL_CURRENCY?.trim() ||
  "USD";

type PaypalOrderResponse = {
  id?: string;
  status?: string;
};

type PaypalCaptureResponse = {
  status?: string;
  purchase_units?: Array<{
    payments?: {
      captures?: Array<{
        status?: string;
        id?: string;
      }>;
    };
  }>;
};

function getCredentials(): { clientId: string; secret: string } {
  const clientId = process.env.PAYPAL_CLIENT_ID?.trim();
  const secret = process.env.PAYPAL_CLIENT_SECRET?.trim();

  if (!clientId || !secret) {
    throw new Error("Missing PayPal credentials");
  }

  return { clientId, secret };
}

async function getAccessToken(): Promise<string> {
  const { clientId, secret } = getCredentials();
  const basicAuth = Buffer.from(`${clientId}:${secret}`).toString("base64");

  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `PayPal auth failed (${response.status}): ${errorText || "unknown error"}`,
    );
  }

  const data = (await response.json()) as { access_token?: string };
  if (!data?.access_token) {
    throw new Error("PayPal auth response missing access_token");
  }

  // Token này được bạn gắn vào header ở các request sau:
  // Authorization: `Bearer ${accessToken}`
  // Ví dụ thực tế gửi lên PayPal sẽ thành:
  // Authorization: Bearer A21AAHjKf8z9GvZbFQ5k6QZKxYp4...
  return data.access_token;
}

async function paypalRequest<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${PAYPAL_BASE_URL}${path}`, {
    ...init,
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `PayPal request failed (${response.status}): ${
        errorText || "unknown error"
      }`,
    );
  }

  return (await response.json()) as T;
}

export async function createPaypalOrder(
  amount: number,
): Promise<PaypalOrderResponse> {
  const accessToken = await getAccessToken();
  const safeAmount = Math.max(Number.isFinite(amount) ? amount : 0, 0.01);

  return paypalRequest<PaypalOrderResponse>("/v2/checkout/orders", {
    method: "POST",
    headers: {
      // Header này tuân theo chuẩn:
      // Authorization: <scheme> <credentials>
      // Authorization: Bearer ACCESS_TOKEN
      //      Bearer = loại xác thực
      //      ACCESS_TOKEN = “thẻ ra vào” của bạn
      //      Nếu lộ token → người khác dùng token này để giả mạo gửi request lên PayPal
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      // intent = “ý định của giao dịch”
      // intent cho PayPal biết: Sau khi người dùng bấm Approve trên cửa sổ PayPal, bạn muốn làm gì với tiền?
      // CAPTURE = “thu tiền ngay lập tức”
      // AUTHORIZE = “tạm thời giữ tiền, sẽ thu tiền sau”
      intent: "CAPTURE",

      // - purchase_units: [ ... ]: Danh sách các đơn vị mua hàng trong đơn đặt hàng này
      //     1 Order PayPal = có thể chứa nhiều “hóa đơn con”
      //     mỗi “hóa đơn con” thể hiện một đơn vị mua hàng riêng biệt
      // - Vì sao purchase_units có dạng mảng?
      //     Nhiều người bán trong 1 đơn => Chia tiền cho nhiều người bán
      //     Dự án hiện tại chỉ có 1 người bán
      // - purchase_units[0] : là một “hóa đơn con”. purchase_units[0] có các thuộc tính:
      //     amount → Tổng tiền
      //     items → Danh sách sản phẩm
      //     shipping → Địa chỉ giao hàng
      //     payee → Người nhận tiền
      //     reference_id → ID nội bộ của bạn
      // - amount: { ... } : Thông tin về số tiền của đơn vị mua hàng này
      //     currency_code: Mã tiền tệ, ví dụ: USD, EUR, VND
      //     value: Số tiền tổng cộng của đơn vị mua hàng này
      purchase_units: [
        {
          amount: {
            currency_code: PAYPAL_CURRENCY,
            value: safeAmount.toFixed(2),
          },
        },
      ],
    }),
  });
}

export async function capturePaypalOrder(
  orderId: string,
): Promise<PaypalCaptureResponse> {
  const accessToken = await getAccessToken();

  return paypalRequest<PaypalCaptureResponse>(
    `/v2/checkout/orders/${orderId}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    },
  );
}

export function getPaypalCurrency(): string {
  return PAYPAL_CURRENCY;
}
