// import { PrismaClient } from '@prisma/client'

// const globalForPrisma = global as unknown as {
//   prisma: PrismaClient | undefined
// }

// export const prisma =
//   globalForPrisma.prisma ??
//   new PrismaClient({
//     log: ['query', 'info', 'warn', 'error'],
//   })

// if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

// export default prisma








import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'

const globalForPrisma = global as unknown as { 
    prisma: PrismaClient
}

const prisma = globalForPrisma.prisma || new PrismaClient().$extends(withAccelerate())

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma