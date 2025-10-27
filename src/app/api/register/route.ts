import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"

export async function POST(req: Request) {
  const { firstName, lastName, email, password } = await req.json()

  if (!email || !password || !firstName)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })

  const hashedPassword = await bcrypt.hash(password, 10)

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing)
    return NextResponse.json({ error: "Email already exists" }, { status: 400 })

  const user = await prisma.user.create({
    data: {
      name: `${firstName} ${lastName || ""}`.trim(),
      email,
      password: hashedPassword,
    },
  })

  return NextResponse.json({ user })
}
