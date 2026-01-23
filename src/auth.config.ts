//File này:  Định nghĩa toàn bộ cấu hình xác thực cho hệ thống

import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { UserStatus } from "@prisma/client";
import { getUserByEmail, getUserById } from "@/lib/prisma";

const ADMIN_EMAILS = new Set(
  [process.env.DEFAULT_ADMINS]
    .filter(Boolean)
    .flatMap((raw) => String(raw).split(","))
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
);

const authConfig = {
  // provider = phương thức đăng nhập
  // Mỗi phần tử trong providers: [] là một cách để user đăng nhập vào hệ thống
  // hiện tại có 2 cách:
  // providers: [
  //   Credentials(...),
  //   Google(...)
  // ]
  // 1. Credentials: đăng nhập bằng email + password (tài khoản nội bộ)
  // 2. Google: đăng nhập bằng tài khoản Google (OAuth)
  providers: [
    Credentials({
      name: "Credentials",
      // Khai báo:
      // Form đăng nhập của provider này có những field gì
      credentials: {
        email: { label: "Email", type: "text", placeholder: "youremail" },
        password: { label: "Password", type: "password" },
      },

      // Hàm authorize: Đây là hàm tự viết để xác thực user
      async authorize(credentials) {
        // // 1. Chặn input rỗng
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing username or password");
        }

        // 2. Tìm user trong database
        const user = await getUserByEmail(String(credentials.email));

        if (!user || !user.password) {
          throw new Error("User not found or missing password");
        }

        // 3. Kiểm tra user có bị block không
        if (user.status === UserStatus.BLOCKED) {
          throw new Error("ACCOUNT_BLOCKED");
        }

        // 4. So sánh password
        const isValidPassword = await bcrypt.compare(
          String(credentials.password),
          user.password,
        );

        if (!isValidPassword) {
          throw new Error("Invalid credentials");
        }

        // 5. Trả về user cho NextAuth tạo session
        // lúc này return object → NextAuth coi là login thành công và tạo JWT => set cookie => tạo session
        // JWT được lưu trong Cookie của trình duyệt
        // F12 → Application → Cookies → http://localhost:3000 → xem cookie "next-auth.session-token"
        // Chuỗi JWT đã được ký và mã hóa
        // Chúng ta không đọc được bằng mắt
        //     Nhưng NextAuth server sẽ:
        //     Dùng NEXTAUTH_SECRET
        //     Giải mã nó ra thành object
        // đối tượng giải mã được JWT:
        //     NextAuth Server: giải mã được (vì có NEXTAUTH_SECRET để decode)
        //     Browser chỉ lưu không giải mã được
        // Browser
        //   ↓ tự gửi cookie JWT
        // Request /admin
        // Server
        //   ↓ NextAuth lấy cookie
        //   ↓ Giải mã JWT
        //   ↓ Tạo session object
        //   ↓ auth() trả session
        // Code bạn check:
        //   if session.user.role !== "ADMIN"
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          status: user.status,
        };
      },
    }),
    Google({
      allowDangerousEmailAccountLinking: true,
    }),
  ],

  pages: {
    signIn: "/login", // Custom page login
  },

  // NextAuth có 2 mode:
  //     Mode	JWT ở đâu	Session ở đâu
  //     strategy: "jwt"	Cookie	Tạo từ JWT
  //     strategy: "database"	Cookie chỉ chứa sessionId	Session nằm trong DB
  session: { strategy: "jwt" },

  // callbacks = những thời điểm cho phép can thiệp vào từng giai đoạn của quá trình xác thực
  // Luồng tổng thể:

  // User bấm Login
  //    ↓
  // Provider xác thực xong (Credentials / Google)
  //    ↓
  // callbacks.signIn()     ← cho phép hoặc chặn đăng nhập
  //    ↓
  // callbacks.jwt()        ← tạo / cập nhật JWT
  //    ↓
  // Cookie lưu JWT vào browser
  //    ↓
  // Mỗi request sau này:
  //    ↓
  // NextAuth giải mã JWT
  //    ↓
  // callbacks.session()   ← tạo session gửi cho frontend
  callbacks: {
    // Quyết định cho phép đăng nhập hay không
    // Nó chạy:
    //     Sau khi Google / Credentials xác thực thành công
    //     Trước khi JWT được tạo
    async signIn({ user }) {
      if (!user?.email) return true;
      const existing = await getUserByEmail(user.email);

      // Dù đúng password hoặc Google login thành công
      // Nhưng nếu admin block → vẫn không vào được hệ thống
      if (existing?.status === UserStatus.BLOCKED) {
        throw new Error("ACCOUNT_BLOCKED");
      }
      return true;
    },
    async jwt({ token, user }) {
      // Ưu tiên email từ user (lần đăng nhập đầu) sau đó tới JWT - token.email
      const email = user?.email ?? (token.email as string | undefined);
      const normalizedEmail = email?.toLowerCase();

      if (normalizedEmail) {
        token.role = ADMIN_EMAILS.has(normalizedEmail) ? "ADMIN" : "USER";
      }

      if (user?.id) {
        // token.sub: ID duy nhất đại diện cho người dùng đang đăng nhập
        token.sub = user.id;
      }

      if (user && "status" in user) {
        token.status = (user as { status?: UserStatus }).status;
      } else if (token.sub) {
        const latest = await getUserById(token.sub);
        if (latest) {
          token.status = latest.status;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.status === UserStatus.BLOCKED) {
        return {
          ...session,
          user: undefined,
        };
      }

      if (session.user) {
        session.user.role = (token.role as "ADMIN" | "USER") ?? "USER";
        if (token.sub) session.user.id = token.sub;
        if (token.status) {
          session.user.status = token.status as UserStatus;
        }
      }

      return session;
    },

    // Sau khi login thành công trả về url
    // baseUrl: URL gốc của ứng dụng, ví dụ: http://localhost:3000
    async redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl)) return url;
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      return baseUrl;
    },
  },

  secret: process.env.AUTH_SECRET,
} satisfies NextAuthConfig;

export default authConfig;
