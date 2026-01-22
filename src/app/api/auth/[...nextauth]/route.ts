import { handlers } from "@/auth"; // Referring to the auth.ts we just created

// Force Node.js runtime so Prisma Client can run (Prisma is not edge-compatible)
export const runtime = "nodejs";
// Avoid any static optimization for the auth handler
export const dynamic = "force-dynamic";

export const { GET, POST } = handlers;
