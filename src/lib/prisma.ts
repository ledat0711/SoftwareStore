// ******* CLOUD *******
// import { PrismaClient } from '@prisma/client/edge'
// import { withAccelerate } from '@prisma/extension-accelerate'

// const globalForPrisma = global as unknown as {
//     prisma: PrismaClient
// }

// const prisma = globalForPrisma.prisma || new PrismaClient().$extends(withAccelerate())

// if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// export default prisma


// ******* LOCAL *******
import { Prisma, PrismaClient } from "@prisma/client";
import { DefaultArgs } from "@prisma/client/runtime/library";

const globalForPrisma: {
  prisma:
    | PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>
    | undefined;
} = global as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma: PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs> =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["query", "info", "warn", "error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;


// -------- Product helpers --------
export async function getProductBySlug(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
  });
}

export async function getRelatedProducts(
  productId: string,
  category?: string | null
) {
  return prisma.product.findMany({
    where: {
      category: category ?? undefined,
      NOT: { id: productId },
    },
    take: 4,
  });
}
