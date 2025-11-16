import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
  const items = await prisma.product.findMany({ orderBy: { createdAt: "desc" } })
  return NextResponse.json(items)
}

export async function POST(req: Request) {
  const body = await req.json()
  const { title, price, image, department, platform } = body || {}

  if (!title || typeof price !== "number" || !image || !department || !platform) {
    return NextResponse.json({ message: "Invalid payload" }, { status: 400 })
  }

  const created = await prisma.product.create({
    data: { title, price, image, department, platform },
  })
  return NextResponse.json(created, { status: 201 })
}