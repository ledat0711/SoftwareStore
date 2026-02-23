import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DiscountForm } from "../components/DiscountForm";

export default async function NewDiscountPage() {
  const products = await prisma.product.findMany({
    where: { isDeleted: false },
    orderBy: { title: "asc" },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tạo discount</h1>
          <p className="text-sm text-gray-600">Global, Product hoặc Coupon.</p>
        </div>
        <Link
          href="/admin/discounts"
          className="text-sm font-semibold text-blue-600 underline underline-offset-2"
        >
          ← Back
        </Link>
      </div>

      <DiscountForm
        products={products}
        submitUrl="/api/admin/discounts"
        method="POST"
        redirectUrl="/admin/discounts"
      />
    </div>
  );
}
