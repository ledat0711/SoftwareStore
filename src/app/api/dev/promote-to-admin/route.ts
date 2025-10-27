import { auth } from "@/auth"
import { PrismaClient } from "@prisma/client"
import { NextResponse } from "next/server"

const prisma = new PrismaClient()

export async function POST() {
  const session = await auth()
  if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 })

  await prisma.user.update({
    where: { email: session.user.email },
    data: { role: "ADMIN" },
  })

  return NextResponse.json({ promoted: true })
}