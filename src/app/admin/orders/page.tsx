import { auth } from "@/auth";
import { redirect } from "next/navigation";

// Test

export default async function AdminOrdersPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");
  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Quản lý đơn hàng</h1>
      <p className="text-gray-600">Trang quản lý đơn hàng (placeholder).</p>
    </div>
  );
}
