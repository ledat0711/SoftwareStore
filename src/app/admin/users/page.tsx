import { auth } from "@/auth";
import { Session } from "next-auth";
import { redirect } from "next/navigation";
import { listUsers } from "@/lib/prisma";
import { toAdminUserDto } from "@/lib/admin-users";
import UsersTable from "./UsersTable";

export default async function AdminUsersPage() {
  const session: Session | null = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");
  const users = await listUsers();
  const userRows = users.map(toAdminUserDto);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Quản lý người dùng
          </h1>
          <p className="text-sm text-gray-600">
            Theo dõi tài khoản đã đăng ký và cập nhật trạng thái hoạt động.
          </p>
        </div>
        <div className="rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700">
          Tổng số: {userRows.length}
        </div>
      </div>

      <UsersTable
        initialUsers={userRows}
        currentUserId={session.user.id ?? undefined}
      />
    </div>
  );
}
