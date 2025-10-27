import { auth } from "@/auth"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  console.log("session@/api/admin:", session?.user) // debug
  if (!session?.user || session.user.role !== "ADMIN") {
    return new NextResponse("Forbidden", { status: 403 })
  }
  return NextResponse.json({ ok: true })
}