import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()
const ADMIN_EMAILS = new Set(["leanhdat1994@gmail.com"])

export async function POST() {
  const emails = ["leanhdat1994@gmail.com", "ledatdn94@gmail.com"]
  await Promise.all(
    emails.map((email) =>
      prisma.user.updateMany({
        where: { email },
        data: { role: ADMIN_EMAILS.has(email) ? "ADMIN" : "USER" },
      })
    )
  )
  return NextResponse.json({ synced: true })
}