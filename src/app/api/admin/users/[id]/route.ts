import { NextResponse } from "next/server";
import { Session } from "next-auth";
import { z } from "zod";
import { UserStatus } from "@prisma/client";
import { auth } from "@/auth";
import { deleteUserById, getUserById, updateUserStatus } from "@/lib/prisma";
import { toAdminUserDto } from "@/lib/admin-users";

const actionSchema = z.object({
  action: z.enum(["BLOCK", "ACTIVATE"]),
});

const forbidden = NextResponse.json({ error: "Forbidden" }, { status: 403 });

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session: Session | null = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return forbidden;
  }

  const { id: userId } = await params;
  if (!userId) {
    return NextResponse.json({ error: "Missing user id" }, { status: 400 });
  }

  const parsedBody = actionSchema.safeParse(await req.json().catch(() => null));
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  if (session.user.id === userId && parsedBody.data.action === "BLOCK") {
    return NextResponse.json(
      { error: "You cannot block your own account" },
      { status: 400 },
    );
  }

  const target = await getUserById(userId);
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const status =
    parsedBody.data.action === "BLOCK" ? UserStatus.BLOCKED : UserStatus.ACTIVE;

  const updated = await updateUserStatus(userId, status);
  return NextResponse.json({ user: toAdminUserDto(updated) });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session: Session | null = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return forbidden;
  }

  const { id: userId } = await params;
  if (!userId) {
    return NextResponse.json({ error: "Missing user id" }, { status: 400 });
  }

  if (session.user.id === userId) {
    return NextResponse.json(
      { error: "You cannot delete your own account" },
      { status: 400 },
    );
  }

  const target = await getUserById(userId);
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const deleted = await deleteUserById(userId);
  return NextResponse.json({ user: toAdminUserDto(deleted) });
}
