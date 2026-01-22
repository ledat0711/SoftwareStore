import NextAuth, { DefaultSession } from "next-auth"
import { UserStatus } from "@prisma/client"

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id?: string
      role?: "USER" | "ADMIN"
      status?: UserStatus
    }
  }
  interface User {
    id?: string
    role?: "USER" | "ADMIN"
    status?: UserStatus
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "USER" | "ADMIN"
    status?: UserStatus
  }
}
