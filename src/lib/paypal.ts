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
      `PayPal auth failed (${response.status}): ${errorText || "unknown error"}`
    );
  }

  const data = (await response.json()) as { access_token?: string };
  if (!data?.access_token) {
    throw new Error("PayPal auth response missing access_token");
  }

  return data.access_token;
}

async function paypalRequest<T>(
  path: string,
  init: RequestInit
): Promise<T> {
  const response = await fetch(`${PAYPAL_BASE_URL}${path}`, {
    ...init,
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `PayPal request failed (${response.status}): ${
        errorText || "unknown error"
      }`
    );
  }

  return (await response.json()) as T;
}

export async function createPaypalOrder(
  amount: number
): Promise<PaypalOrderResponse> {
  const accessToken = await getAccessToken();
  const safeAmount = Math.max(Number.isFinite(amount) ? amount : 0, 0.01);

  return paypalRequest<PaypalOrderResponse>("/v2/checkout/orders", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
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
  orderId: string
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
    }
  );
}

export function getPaypalCurrency(): string {
  return PAYPAL_CURRENCY;
}
