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
import { Prisma, PrismaClient, UserStatus } from "@prisma/client";
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

export const prisma: PrismaClient<
  Prisma.PrismaClientOptions,
  never,
  DefaultArgs
> =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["query", "info", "warn", "error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;

// -------- User helpers --------
// SELECT *
// FROM "User"
// WHERE email = "test@example.com"
// LIMIT 1;
export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email: String(email) },
  });
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id: String(id) },
  });
}

export type CreateUserPayload = {
  name: string | null;
  email: string;
  password: string | null;
  status?: UserStatus;
  image?: string | null;
};

const userSummarySelect = {
  id: true,
  name: true,
  email: true,
  status: true,
  createdAt: true,
  roles: {
    select: {
      role: true,
    },
  },
};

export async function createUser(payload: CreateUserPayload) {
  return prisma.user.create({
    data: payload,
  });
}

export async function listUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: userSummarySelect,
  });
}

export async function updateUserStatus(id: string, status: UserStatus) {
  return prisma.user.update({
    where: { id },
    data: { status },
    select: userSummarySelect,
  });
}

export async function deleteUserById(id: string) {
  return prisma.user.delete({
    where: { id },
    select: userSummarySelect,
  });
}

// -------- Product helpers --------
export async function getProductBySlug(slug: string) {
  return prisma.product.findFirst({
    where: { slug, isDeleted: false },
  });
}

export async function getRelatedProducts(
  productId: string,
  category?: string | null,
) {
  return prisma.product.findMany({
    where: {
      category: category ?? undefined,
      isDeleted: false,
      NOT: { id: productId },
    },
    take: 4,
  });
}

// -------- Product actions --------
export type ProductForm = Omit<Product, "id" | "isDeleted">;

// Tạo sản phẩm mới trong database, nhưng nếu payload có id thì bỏ qua id
export async function createProductAction(payload: ProductForm) {
  "use server";
  const { id: _ignoreId, ...rest } = payload as ProductForm & { id?: string };
  // Giả sử payload là:
  // payload = {
  //   id: "p01",
  //   title: "Windows 11 Pro",
  //   price: 120,
  //   slug: ""
  // };
  // Sau khi destructuring:
  // => Kết quả trong bộ nhớ:
  // _ignoreId = "p01";
  // rest = toàn bộ thuộc tính còn lại, sau khi bỏ id
  // rest = {
  //   title: "Windows 11 Pro",
  //   price: 120,
  //   slug: ""
  // };
  const data: Prisma.ProductCreateInput = {
    ...rest,
    slug: rest.slug || slugify(rest.title),
  };
  return prisma.product.create({ data });
}

export async function updateProductAction(id: string, payload: ProductForm) {
  "use server";
  const data: ProductForm = {
    ...payload,
    slug: payload.slug || slugify(payload.title),
  };

  // trong prisma: hàm update cập nhật 1 record duy nhất, và trả về 1 record đã được cập nhật
  // { where: { id }, data }: là 1 object JS, được truyền vào hàm update
  // Viết đầy đủ:
  //
  // {
  //   where: {
  //     id: id
  //   },
  //   data: data
  // }

  // update({
  // where: {...}, // BẮT BUỘC: xác định record
  // data: {...}   // BẮT BUỘC: dữ liệu mới
  // })
  // Client (form submit)
  //    ↓
  // Server Action (updateProductAction)
  //    ↓
  // Prisma.product.update({
  //       where: { id },
  //       data
  //    })
  //    ↓
  // Database
  return prisma.product.update({ where: { id }, data });
}

export async function deleteProductAction(id: string) {
  "use server";
  await prisma.product.update({
    where: { id },
    data: { isDeleted: true },
  });
  return true;
}

export async function toggleHiddenAction(payload: {
  id: string;
  hidden: boolean;
}) {
  "use server";
  const { id, hidden } = payload;
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
  "slug" | "hidden" | "badge" | "category" | "platform" | "isDeleted"
> & {
  slug?: Product["slug"] | null;
  hidden?: Product["hidden"];
  badge?: Product["badge"];
  category?: Product["category"];
  platform?: Product["platform"];
  isDeleted?: Product["isDeleted"];
};

export async function upsertProductFromSeed(payload: SeedProductPayload) {
  const slug: string = payload.slug || slugify(payload.title);
  const badge: string | null = payload.badge ?? null;
  const hidden: boolean = payload.hidden ?? false;
  const isDeleted: boolean = payload.isDeleted ?? false;

  return prisma.product.upsert({
    where: { slug },
    create: {
      ...payload,
      slug,
      badge,
      hidden,
      isDeleted,
      category: payload.category ?? null,
      platform: payload.platform ?? null,
    },
    update: {},
  });
}

export async function getAllProducts() {
  "use server";
  return prisma.product.findMany({
    where: { isDeleted: false },
    orderBy: { createdAt: "desc" },
  });
}

export async function getLatestVisibleProducts(limit = 4) {
  return prisma.product.findMany({
    where: { hidden: false, isDeleted: false },
    take: limit,
    orderBy: { createdAt: "desc" },
  });
}

export async function getFilteredVisibleProducts(
  categoryFilter: string[] = [],
  platformFilter: string[] = [],
) {
  return prisma.product.findMany({
    where: {
      hidden: false,
      isDeleted: false,
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
  fallback = DEFAULT_SEARCH_LIMIT,
) {
  const parsedLimit =
    typeof rawLimit === "number"
      ? rawLimit
      : rawLimit
        ? Number(rawLimit)
        : fallback;
  if (!Number.isFinite(parsedLimit)) return fallback;
  return Math.min(Math.max(parsedLimit, 1), MAX_SEARCH_LIMIT);
}

export async function searchVisibleProductsWithLimit(
  query: string,
  rawLimit?: number | string | null,
) {
  const term: string = query.trim();
  if (!term) return [];

  const limit = normalizeSearchLimit(rawLimit);
  return searchVisibleProducts(term, limit);
}

export async function searchVisibleProductsAction(
  query: string,
  limit = DEFAULT_SEARCH_LIMIT,
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
      isDeleted: false,
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
