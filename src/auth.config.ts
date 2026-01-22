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
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "youremail" },
        password: { label: "Password", type: "password" },
      },

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

        // // 3. Kiểm tra user có bị block không
        if (user.status === UserStatus.BLOCKED) {
          throw new Error("ACCOUNT_BLOCKED");
        }

        // // 4. So sánh password
        const isValid = await bcrypt.compare(
          String(credentials.password),
          user.password,
        );

        if (!isValid) {
          throw new Error("Invalid credentials");
        }

        // 5. Trả về user cho NextAuth tạo session
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          status: user.status,
        };
      },
    }),
    GitHub({
      allowDangerousEmailAccountLinking: true,
    }),
    Google({
      allowDangerousEmailAccountLinking: true,
    }),
  ],

  pages: {
    signIn: "/login", // Custom page login
  },

  session: { strategy: "jwt" },

  callbacks: {
    async signIn({ user }) {
      if (!user?.email) return true;
      const existing = await getUserByEmail(user.email);
      if (existing?.status === UserStatus.BLOCKED) {
        throw new Error("ACCOUNT_BLOCKED");
      }
      return true;
    },
    async jwt({ token, user }) {
      // Ưu tiên email từ user (lần đăng nhập đầu) sau đó tới token.email
      const email = user?.email ?? (token.email as string | undefined);
      const normalizedEmail = email?.toLowerCase();
      if (normalizedEmail) {
        token.role = ADMIN_EMAILS.has(normalizedEmail) ? "ADMIN" : "USER";
      }
      if (user?.id) {
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

    async redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl)) return url;
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      return baseUrl;
    },
  },

  secret: process.env.AUTH_SECRET,
} satisfies NextAuthConfig;

export default authConfig;
