import {
  createProductAction,
  deleteProductAction,
  getAllProducts,
  toggleHiddenAction,
  updateProductAction,
} from "@/lib/prisma";
import AdminProductsClient from "./AdminProductsClient";
import { Product } from "@/types/product";

export default async function AdminProductsPage() {
  const products: Product[] = await getAllProducts();

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
