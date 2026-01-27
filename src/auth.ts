export const runtime = "nodejs";

import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import authConfig from "./auth.config";

const prisma = new PrismaClient();

export const { handlers, signIn, signOut, auth } = NextAuth({
  // Hệ thống xác thực của ứng dụng sẽ dùng Prisma + DATABASE để lưu user, session, account, token.
  // Còn cấu hình login, provider, callback, pages… thì lấy từ file auth.config.ts
  // Giải thích dòng code: adapter: PrismaAdapter(prisma)
  //     adapter là thành phần giúp NextAuth kết nối với database thông qua Prisma ORM.
  //     PrismaAdapter(prisma) tạo một adapter sử dụng instance PrismaClient đã khởi tạo (prisma)
  //     để NextAuth có thể thao tác với database (lưu, truy vấn user, session, v.v.)
  // Giải thích dòng code ...authConfig
  //     Nó “trải” toàn bộ config từ file auth.config.ts vào đây
  //     thực chất code trở thành:
  //          NextAuth({
  //              adapter: PrismaAdapter(prisma),

  //              providers: [...],
  //              callbacks: {...},
  //              pages: {...},
  //              session: {...},
  //              secret: "...",
  //              trustHost: true,
  //              ...
  //          })
  adapter: PrismaAdapter(prisma),
  ...authConfig,
});
