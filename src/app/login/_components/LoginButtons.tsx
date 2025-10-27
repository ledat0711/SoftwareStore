"use client"
import { signIn } from "next-auth/react"

export default function LoginButtons() {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {/* Nếu dùng OAuth (ví dụ Google/GitHub) hãy thay undefined bằng tên provider */}
      <button onClick={() => signIn(undefined, { callbackUrl: "/" })}>
        Đăng nhập
      </button>

      {/* Ví dụ Credentials */}
      {/* onSubmit={() => signIn("credentials", { email, password, redirect: true, callbackUrl: "/" })} */}
    </div>
  )
}