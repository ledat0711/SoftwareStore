

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

// -------- User helpers --------
export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email: String(email) },
  });
}

export type CreateUserPayload = {
  name: string | null;
  email: string;
  password: string | null;
  image?: string | null;
};

export async function createUser(payload: CreateUserPayload) {
  return prisma.user.create({
    data: payload,
  });
}

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

export async function deleteAllProducts() {
  await prisma.$executeRaw`DELETE FROM "Product"`;
}

export async function disconnectPrisma() {
  await prisma.$disconnect();
}

// Seed payload is based on the Product model with optional slug/hidden/badge/category/platform for seeding convenience.

export type SeedProductPayload = Omit<
  Product,
  "slug" | "hidden" | "badge" | "category" | "platform"
> & {
  slug?: Product["slug"] | null;
  hidden?: Product["hidden"];
  badge?: Product["badge"];
  category?: Product["category"];
  platform?: Product["platform"];
};

export async function upsertProductFromSeed(payload: SeedProductPayload) {
  const slug: string = payload.slug || slugify(payload.title);
  const badge: string | null = payload.badge ?? null;
  const hidden: boolean = payload.hidden ?? false;

  return prisma.product.upsert({
    where: { slug },
    create: {
      ...payload,
      slug,
      badge,
      hidden,
      category: payload.category ?? null,
      platform: payload.platform ?? null,
    },
    update: {},
  });
}

export async function getAllProducts() {
  "use server";
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

const DEFAULT_SEARCH_LIMIT = 12;
const MAX_SEARCH_LIMIT = 50;

function normalizeSearchLimit(
  rawLimit: number | string | null | undefined,
  fallback = DEFAULT_SEARCH_LIMIT
) {
  const parsedLimit =
    typeof rawLimit === "number" ? rawLimit : rawLimit ? Number(rawLimit) : fallback;
  if (!Number.isFinite(parsedLimit)) return fallback;
  return Math.min(Math.max(parsedLimit, 1), MAX_SEARCH_LIMIT);
}

export async function searchVisibleProductsWithLimit(
  query: string,
  rawLimit?: number | string | null
) {
  const term: string = query.trim();
  if (!term) return [];

  const limit = normalizeSearchLimit(rawLimit);
  return searchVisibleProducts(term, limit);
}

export async function searchVisibleProductsAction(
  query: string,
  limit = DEFAULT_SEARCH_LIMIT
) {
  "use server";
  return searchVisibleProductsWithLimit(query, limit);
}

export async function searchVisibleProducts(query: string, limit = 12) {
  const term: string = query.trim();
  if (!term) return [];

  return prisma.product.findMany({
    where: {
      hidden: false,
      OR: [
        { title: { contains: term, mode: "insensitive" } },
        { description: { contains: term, mode: "insensitive" } },
        { category: { contains: term, mode: "insensitive" } },
        { platform: { contains: term, mode: "insensitive" } },
      ],
    },
    take: limit,
    orderBy: { createdAt: "desc" },
  });
}
