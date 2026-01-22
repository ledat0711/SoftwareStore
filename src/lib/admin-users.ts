import { UserStatus } from "@prisma/client";
import type { listUsers } from "@/lib/prisma";

export type AdminUserRecord = Awaited<ReturnType<typeof listUsers>>[number];

export type AdminUserDto = {
  id: string;
  name: string | null;
  email: string;
  status: UserStatus;
  createdAt: string;
  role: "ADMIN" | "USER";
};

// flatMap = map + flat: biến mảng 2 chiều thành mảng 1 chiều
const DEFAULT_ADMIN_EMAILS = new Set(
  [process.env.DEFAULT_ADMINS]
    .filter(Boolean)
    .flatMap((raw) => String(raw).split(","))
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
);

export function toAdminUserDto(user: AdminUserRecord): AdminUserDto {
  const normalizedEmail = user.email.toLowerCase();
  const isDefaultAdmin = DEFAULT_ADMIN_EMAILS.has(normalizedEmail);
  const isAdmin =
    isDefaultAdmin ||
    user.roles?.some((entry) => entry.role?.name === "ADMIN");

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    status: user.status,
    createdAt: user.createdAt.toISOString(),
    role: isAdmin ? "ADMIN" : "USER",
  };
}
