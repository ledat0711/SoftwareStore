"use client";

import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { FaXTwitter, FaDiscord } from "react-icons/fa6";
import { FaMicrosoft } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

// Form → POST /api/register → bcrypt.hash → save DB
export default function RegisterPage() {
  const router: AppRouterInstance = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    // event.preventDefault(): Không cho trình duyệt submit form theo cách HTML truyền thống (reload trang).
    // Chúng ta muốn tự điều khiển luồng bằng JavaScript
    event.preventDefault();
    setError(""); // Xóa lỗi cũ
    setLoading(true); // Bật cờ “đang xử lý” . Đây là cờ trạng thái hệ thống:loading = true → disable nút, hiện "Creating..."

    // Gom dữ liệu trong form => lấy dữ liệu theo name của input
    const formData: FormData = new FormData(event.currentTarget);
    const firstNameRaw = formData.get("firstName");
    const lastNameRaw = formData.get("lastName");
    const emailRaw = formData.get("email");
    const passwordRaw = formData.get("password");

    // ***** Chuẩn hóa dữ liệu *****
    // Trim → bỏ khoảng trắng
    // Lowercase → tránh:
    //    ABC@gmail.com
    //    abc@gmail.com
    //    bị coi là 2 user khác nhau
    const firstName =
      typeof firstNameRaw === "string" ? firstNameRaw.trim() : "";
    const lastName = typeof lastNameRaw === "string" ? lastNameRaw.trim() : "";
    const email =
      typeof emailRaw === "string" ? emailRaw.trim().toLowerCase() : "";
    const password = typeof passwordRaw === "string" ? passwordRaw : "";

    // ***** Validate dữ liệu (phía client) *****
    if (!firstName) {
      setError("Please enter your first name");
      setLoading(false);
      return;
    }

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    try {
      // Giao tiếp server bằng fetch API để gọi API đăng ký người dùng mà ta đã tạo ở bước trước (src/app/api/register/route.ts)
      // Đóng gói dữ liệu → gửi lên API => chờ server xử lý lưu dữ liệu và phản hồi
      const res: Response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, password }),
      });

      // nếu phản hồi không OK (status code không phải 2xx), hiển thị lỗi
      if (!res.ok) {
        const data: { error?: string } = await res.json().catch(() => ({}));
        setError(data.error || "Registration failed");
        return;
      }

      // sessionStorage.setItem("registeredEmail", email): lưu email đã đăng ký vào sessionStorage
      // để dùng trong trang /credentials: tự động điền username vào form đăng nhập
      sessionStorage.setItem("registeredEmail", email);
      router.push("/credentials");
    } catch (err) {
      setError("Unable to register right now, please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          Let’s create an account
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* First & Last Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="firstName"
                autoComplete="given-name"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="John"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                autoComplete="family-name"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Doe"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              autoComplete="email"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="you@example.com"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="new-password"
                minLength={8}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-pink-600 text-white py-3 rounded-lg font-semibold hover:bg-pink-700 transition-all duration-200 cursor-pointer disabled:opacity-70"
          >
            {loading ? "Creating..." : "CREATE ACCOUNT"}
          </button>
        </form>

        {/* Login Link */}
        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
          Already have an account?{" "}
          <a
            href="/login"
            className="text-pink-600 font-semibold hover:underline"
          >
            LOGIN
          </a>
        </p>
      </div>
    </div>
  );
}
