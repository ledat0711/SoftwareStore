import { NextResponse } from "next/server";
import { Session } from "next-auth";
import { auth } from "@/auth";
import { listUsers } from "@/lib/prisma";
import { toAdminUserDto } from "@/lib/admin-users";

export async function GET() {
  const session: Session | null = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await listUsers();
  return NextResponse.json({
    users: users.map(toAdminUserDto),
  });
}
