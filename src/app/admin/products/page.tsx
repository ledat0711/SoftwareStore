import {
  createProductAction,
  deleteProductAction,
  getAllProducts,
  toggleHiddenAction,
  updateProductAction,
} from "@/lib/prisma";
import AdminProductsClient from "./AdminProductsClient";

export default async function AdminProductsPage() {
  const products = await getAllProducts();

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
