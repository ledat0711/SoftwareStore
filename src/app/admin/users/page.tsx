import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");
  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Quản lý người dùng</h1>
      <p className="text-gray-600">Trang quản lý người dùng (placeholder).</p>
    </div>
  );
}
