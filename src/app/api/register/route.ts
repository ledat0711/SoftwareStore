import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { UserStatus } from "@prisma/client";
import { z as zod } from "zod";
import { createUser, getUserByEmail } from "@/lib/prisma";

// dùng Zod validate body
const registerSchema: zod.ZodType<{
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}> = zod.object({
  firstName: zod.string().trim().min(1, "First name is required"),
  lastName: zod.string().trim().optional().default(""),
  email: zod.string().trim().toLowerCase().email("Invalid email"),
  password: zod
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(64, "Password is too long"),
});

export async function POST(req: Request) {
  // validate body bằng hàm safeParse của đối tượng registerSchema được khởi tạo bởi zod
  const parsedBody = registerSchema.safeParse(await req.json().catch(() => null));

  // nếu validate không thành công, trả về lỗi 400 kèm thông báo lỗi
  if (!parsedBody.success) {
    const firstIssue = parsedBody.error.issues.at(0)?.message ?? "Invalid payload";
    return NextResponse.json({ error: firstIssue }, { status: 400 });
  }

  // nếu thành công, lấy dữ liệu bao gồm: firstName, lastName, email, password
  const { firstName, lastName, email, password } = parsedBody.data;

  // kiểm tra xem email đã tồn tại chưa
  const existing = await getUserByEmail(email);

  // nếu tồn tại, trả về lỗi 400 kèm thông báo "Email already exists"
  if (existing) {
    return NextResponse.json(
      { error: "Email already exists" },
      { status: 400 }
    );
  }

  // băm mật khẩu trước khi lưu vào DB
  const hashedPassword: string = await bcrypt.hash(password, 10);

  // tạo tên đầy đủ
  const fullName = `${firstName} ${lastName}`.trim();

  try {
    // tạo người dùng mới trong DB
    const user = await createUser({
      name: fullName || null,
      email,
      password: hashedPassword,
      status: UserStatus.ACTIVE,
    });

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    // nếu có lỗi trong quá trình tạo người dùng, trả về lỗi 500: Internal Server Error 
    // cùng thông báo lỗi "Unable to create account"
    return NextResponse.json(
      { error: "Unable to create account" },
      { status: 500 }
    );
  }
}
