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
import { slugify } from "@/lib/helpers";
import { Product } from "@/types/product";

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

// -------- Product actions --------
export type ProductForm = Omit<Product, "id">;

export async function createProductAction(payload: ProductForm) {
  "use server";
  const data: ProductForm = { ...payload, slug: payload.slug || slugify(payload.title) };
  return prisma.product.create({ data });
}

export async function updateProductAction(id: string, payload: ProductForm) {
  "use server";
  const data: ProductForm = { ...payload, slug: payload.slug || slugify(payload.title) };
  return prisma.product.update({ where: { id }, data });
}

export async function deleteProductAction(id: string) {
  "use server";
  await prisma.product.delete({ where: { id } });
  return true;
}

export async function toggleHiddenAction(id: string, hidden: boolean) {
  "use server";
  return prisma.product.update({ where: { id }, data: { hidden } });
}

export async function getAllProducts() {
  return prisma.product.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getLatestVisibleProducts(limit = 4) {
  return prisma.product.findMany({
    where: { hidden: false },
    take: limit,
    orderBy: { createdAt: "desc" },
  });
}

export async function getFilteredVisibleProducts(
  categoryFilter: string[] = [],
  platformFilter: string[] = []
) {
  return prisma.product.findMany({
    where: {
      hidden: false,
      category: categoryFilter.length ? { in: categoryFilter } : undefined,
      platform: platformFilter.length ? { in: platformFilter } : undefined,
    },
    orderBy: { createdAt: "desc" },
  });
}
