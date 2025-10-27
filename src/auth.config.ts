import type { NextAuthConfig } from "next-auth"
import GitHub from "next-auth/providers/github"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"

const ADMIN_EMAILS = new Set(["leanhdat1994@gmail.com"])

const authConfig = {
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "youremail" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing username or password")
        }

        const user = await prisma.user.findUnique({
          where: { email: String(credentials.email) },
        })

        if (!user || !user.password) {
          throw new Error("User not found or missing password")
        }

        const isValid = await bcrypt.compare(String(credentials.password), user.password)
        if (!isValid) {
          throw new Error("Invalid credentials")
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
        }
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
    async jwt({ token, user }) {
      // Ưu tiên email từ user (lần đăng nhập đầu) sau đó tới token.email
      const email = user?.email ?? (token.email as string | undefined)
      if (email) {
        token.role = ADMIN_EMAILS.has(email) ? "ADMIN" : "USER"
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) session.user.role = (token.role as "ADMIN" | "USER") ?? "USER"
      return session
    },
  },

  secret: process.env.AUTH_SECRET,
} satisfies NextAuthConfig

export default authConfig