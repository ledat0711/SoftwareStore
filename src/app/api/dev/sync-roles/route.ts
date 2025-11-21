import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()
const ADMIN_EMAILS = new Set(["leanhdat1994@gmail.com"])

export async function POST() {
  const emails = ["leanhdat1994@gmail.com", "ledatdn94@gmail.com"]

  const [adminRole, userRole] = await prisma.$transaction([
    prisma.role.upsert({ where: { name: "ADMIN" }, update: {}, create: { name: "ADMIN" } }),
    prisma.role.upsert({ where: { name: "USER" }, update: {}, create: { name: "USER" } }),
  ])

  const users = await prisma.user.findMany({
    where: { email: { in: emails } },
    select: { id: true, email: true },
  })

  await Promise.all(
    users.map((user) => {
      const role = ADMIN_EMAILS.has(user.email) ? adminRole : userRole
      return prisma.roleUser.upsert({
        where: { userId_roleId: { userId: user.id, roleId: role.id } },
        update: {},
        create: { userId: user.id, roleId: role.id },
      })
    })
  )
  return NextResponse.json({ synced: true })
}
