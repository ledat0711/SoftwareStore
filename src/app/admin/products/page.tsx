import prisma from "@/lib/prisma";
import { slugify } from "@/lib/helpers";
import { Product } from "@/types/product";
import AdminProductsClient from "./AdminProductsClient";

type ProductForm = Omit<Product, "id">;

// --- Server actions ---
async function createProductAction(payload: ProductForm) {
  "use server";
  const data: ProductForm = { ...payload, slug: payload.slug || slugify(payload.title) };
  return prisma.product.create({ data });
}

async function updateProductAction(id: string, payload: ProductForm) {
  "use server";
  const data: ProductForm = { ...payload, slug: payload.slug || slugify(payload.title) };
  return prisma.product.update({ where: { id }, data });
}

async function deleteProductAction(id: string) {
  "use server";
  await prisma.product.delete({ where: { id } });
  return true;
}

async function toggleHiddenAction(id: string, hidden: boolean) {
  "use server";
  return prisma.product.update({ where: { id }, data: { hidden } });
}

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <AdminProductsClient
      initialProducts={products}
      onCreate={createProductAction}
      onUpdate={updateProductAction}
      onDelete={deleteProductAction}
      onToggleHidden={toggleHiddenAction}
    />
  );
}
