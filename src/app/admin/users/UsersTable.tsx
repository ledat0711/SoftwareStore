"use client";

import { useMemo, useState } from "react";
import { UserStatus } from "@prisma/client";
import { AdminUserDto } from "@/lib/admin-users";

type UsersTableProps = {
  initialUsers: AdminUserDto[];
  currentUserId?: string;
};

type UserAction = "BLOCK" | "ACTIVATE";

export default function UsersTable({
  initialUsers,
  currentUserId,
}: UsersTableProps) {
  const [users, setUsers] = useState<AdminUserDto[]>(initialUsers);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string>("");

  // totalActive để hiện thị: Đang hoạt động: "totalActive" / 5
  const totalActive = useMemo(
    () => users.filter((user) => user.status === "ACTIVE").length,
    [users],
  );

  async function handleStatusChange(userId: string, action: UserAction) {
    setBusyId(userId);
    setError("");
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const data: { user?: AdminUserDto; error?: string } = await res
        .json()
        .catch(() => ({}));

      if (!res.ok || !data.user) {
        setError(data.error || "Không thể cập nhật trạng thái người dùng.");
      } else {
        setUsers((prev) =>
          prev.map((user) => (user.id === data.user?.id ? data.user : user)),
        );
      }
    } catch (err) {
      setError("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(userId: string) {
    const confirmed = window.confirm(
      "Xóa tài khoản này? Hành động không thể hoàn tác.",
    );
    if (!confirmed) return;

    setBusyId(userId);
    setError("");
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      const data: { user?: AdminUserDto; error?: string } = await res
        .json()
        .catch(() => ({}));

      if (!res.ok || !data.user) {
        setError(data.error || "Không thể xóa người dùng.");
      } else {
        setUsers((prev) => prev.filter((user) => user.id !== data.user?.id));
      }
    } catch (err) {
      setError("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 py-3">
        <div className="text-sm text-gray-700">
          Đang hoạt động:{" "}
          <span className="font-semibold text-emerald-700">{totalActive}</span>
          {" / "}
          <span className="font-semibold text-gray-900">{users.length}</span>
        </div>
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          {/* <thead> viết tắt của Table Head → Dùng để chứa phần tiêu đề của bảng */}
          <thead className="bg-gray-50">
            {/* <tr> viết tắt của Table Row → Dùng để tạo 1 hàng trong bảng */}
            <tr>
              {/* <th> viết tắt của Table Header → Dùng để tạo ô tiêu đề trong bảng */}
              <th className="px-4 py-3 text-left font-semibold text-gray-700">
                Người dùng
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">
                Email
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">
                Vai trò
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">
                Trạng thái
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">
                Ngày tạo
              </th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  Chưa có tài khoản nào.
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const isSelf = user.id === currentUserId;
                const isBusy = busyId === user.id;
                const toggleAction: UserAction =
                  user.status === "ACTIVE" ? "BLOCK" : "ACTIVATE";

                return (
                  <tr key={user.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {user.name || "Không có tên"}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{user.email}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {user.role === "ADMIN" ? "Admin" : "User"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={user.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleStatusChange(user.id, toggleAction)
                          }
                          disabled={isBusy || isSelf}
                          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {user.status === "ACTIVE" ? "Khóa" : "Kích hoạt"}
                        </button>
                      </div>
                      {isSelf && (
                        <p className="mt-1 text-right text-[11px] text-gray-400">
                          Không thể tự khóa hoặc xóa tài khoản của bạn.
                        </p>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: UserStatus }) {
  const style =
    status === "ACTIVE"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-amber-200 bg-amber-50 text-amber-700";
  const label = status === "ACTIVE" ? "Đang hoạt động" : "Đã khóa";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold ${style}`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          status === "ACTIVE" ? "bg-emerald-500" : "bg-amber-500"
        }`}
      />
      {label}
    </span>
  );
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
