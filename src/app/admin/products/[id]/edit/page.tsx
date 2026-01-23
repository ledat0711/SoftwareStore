import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { Session } from "next-auth";
import ProductEditWorkspace from "./_components/ProductEditWorkspace";

export default async function AdminProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session: Session | null = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const { id } = await params;
  if (!id) notFound();

  const product = await prisma.product.findFirst({
    where: { id, isDeleted: false },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      image: true,
      price: true,
      rating: true,
      tag: true,
      badge: true,
      category: true,
      platform: true,
      hidden: true,
      isDeleted: true,
    },
  });

  if (!product) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <nav className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              <ol className="flex items-center gap-2">
                <li>
                  <Link href="/admin" className="hover:text-slate-700">
                    Admin
                  </Link>
                </li>
                <li className="text-slate-300">/</li>
                <li>
                  <Link href="/admin/products" className="hover:text-slate-700">
                    Products
                  </Link>
                </li>
                <li className="text-slate-300">/</li>
                <li className="text-slate-700">Edit</li>
              </ol>
            </nav>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">
                {product.title}
              </h1>
              <p className="text-sm text-slate-500">
                Product ID: <span className="font-medium">{product.id}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/products"
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Quay lại danh sách
            </Link>
            <Link
              href={`/products/${product.slug}`}
              target="_blank"
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Xem trang sản phẩm
            </Link>
          </div>
        </div>
      </div>

      <ProductEditWorkspace product={product} />
    </div>
  );
}
