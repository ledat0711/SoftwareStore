import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      role?: "USER" | "ADMIN"
    }
  }
  interface User {
    role?: "USER" | "ADMIN"
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "USER" | "ADMIN"
  }
}