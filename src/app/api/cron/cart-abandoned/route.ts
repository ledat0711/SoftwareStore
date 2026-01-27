import { NextRequest, NextResponse } from "next/server";
import { cartService } from "@/lib/services/cartService";

export const runtime = "nodejs";

function authorize(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  // replace dùng để thay thế một phần chuỗi bằng chuỗi khác
  // string.replace(/pattern/flags, newValue)
  // /pattern/flags: Biểu thức chính quy (regular expression)
  // \s+: khớp với một hoặc nhiều ký tự khoảng trắng (space, tab, newline)
  // i: flag không phân biệt hoa thường (case-insensitive)
  const bearerToken = authHeader?.replace(/Bearer\s+/i, "");

  const queryToken = request.nextUrl.searchParams.get("token");
  const secret = process.env.CRON_SECRET;

  if (!secret) return true;

  return bearerToken === secret || queryToken === secret;
}

export async function GET(request: NextRequest) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await cartService.sendAbandonedCartEmails();

  return NextResponse.json(result);
}
