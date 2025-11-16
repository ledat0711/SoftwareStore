import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

type UpdateData = {
  title?: string
  price?: number
  image?: string
  department?: "Apps" | "Games"
  platform?: "PC" | "Mobile"
  hidden?: boolean // NEW
}

async function doUpdate(req: Request, id: string) {
  const body = await req.json()
  const data: UpdateData = {}
  for (const k of ["title", "price", "image", "department", "platform", "hidden"] as const) {
    if (body[k] !== undefined) (data as any)[k] = body[k]
  }
  if (typeof data.price === "string") data.price = parseFloat(data.price)

  try {
    const updated = await prisma.product.update({ where: { id }, data })
    return NextResponse.json(updated)
  } catch (err: any) {
    if (err?.code === "P2025") {
      return NextResponse.json({ message: "Not found" }, { status: 404 })
    }
    return NextResponse.json({ message: "Update failed" }, { status: 500 })
  }
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  return doUpdate(req, id)
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  return doUpdate(req, id)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    await prisma.product.delete({ where: { id } })
    return new NextResponse(null, { status: 204 })
  } catch (err: any) {
    if (err?.code === "P2025") {
      return NextResponse.json({ message: "Not found" }, { status: 404 })
    }
    return NextResponse.json({ message: "Delete failed" }, { status: 500 })
  }
}