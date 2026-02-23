import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Discount } from "@/types/discount";
import { DiscountForm } from "../components/DiscountForm";

type Params = {
  params: Promise<{ id: string }>;
};

export default async function DiscountDetailPage({ params }: Params) {
  const { id } = await params;

  const discountRecord = await prisma.discount.findUnique({
    where: { id },
    include: { products: true },
  });

  if (!discountRecord) return notFound();

  const discount: Discount = {
    ...discountRecord,
    startAt: discountRecord.startAt?.toISOString() ?? null,
    endAt: discountRecord.endAt?.toISOString() ?? null,
    createdAt: discountRecord.createdAt?.toISOString(),
    updatedAt: discountRecord.updatedAt?.toISOString(),
    products: discountRecord.products.map((p) => ({ productId: p.productId })),
  };

  const products = await prisma.product.findMany({
    where: { isDeleted: false },
    orderBy: { title: "asc" },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit discount</h1>
          <p className="text-sm text-gray-600">
            {discount.name} {" • "}scope {discount.scope}
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Link
            href="/admin/discounts"
            className="font-semibold text-blue-600 underline underline-offset-2"
          >
            {"<- Back"}
          </Link>
          <Link
            href={`/admin/discounts/${discount.id}/analytics`}
            className="text-gray-700 underline underline-offset-2"
          >
            Analytics
          </Link>
        </div>
      </div>

      <DiscountForm
        initial={discount}
        products={products}
        submitUrl={`/api/admin/discounts/${discount.id}`}
        method="PATCH"
        redirectUrl="/admin/discounts"
      />
    </div>
  );
}
