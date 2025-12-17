import Slider from "@/components/Slider";
import Link from "next/link";
import { ROLE_LABELS, Role } from "@/constants/role";
import { getLatestVisibleProducts, searchVisibleProducts } from "@/lib/prisma";
import { auth } from "@/auth";
import { Session } from "next-auth";
import { Product } from "@/types/product";
import { currency } from "@/lib/helpers";

type AppUser = {
  role?: Role;
};

type SearchParams = {
  q?: string;
};

const slides: SlideItem[] = [
  {
    id: "s1",
    title: "Welcome to Software Store",
    titleClass: "text-white",
    bg: "linear-gradient(rgba(0,0,0,0.65), rgba(0,0,0,0.65)), url('https://images-eds-ssl.xboxlive.com/image?url=7flt5HU26ZSS3Tgted_TMty0wzqMQYpm03yD7eAPRtQBYO5dMlD18uZxNDuKXvpqAKGFYXbR3E2AUl4SjJkn2wMOGpMzW_eL9bead7iYs2rnbclM65KqMluL9PQUxrK9Ly91WqD2mOR04qP8KhlAr9sCYHV0ITD7w0VDwUVc0OS0dlZQzX_mQjmIhqTnlbcK5QYa0bZ0JBvUwPmYg3m28w--&h=576') center/cover no-repeat",
  },
  {
    id: "s2",
    title: "Performance Optimization",
    titleClass: "text-slate-900 drop-shadow-sm",
    subtitle: "Tối ưu hiệu suất nhanh và mượt",
    subtitleClass: "text-slate-800/80",
    bg: "linear-gradient(120deg,#fff7ed 0%,#ffe4e6 35%,#fecdd3 70%,#ffe7c2 100%)",
  },
  {
    id: "s3",
    title: "Secure & Reliable",
    subtitle: "Bảo mật và ổn định",
    bg: "linear-gradient(135deg,#e9d5ff,#bae6fd)",
  },
];

function ProductCard({ product }: { product: Product}) {
  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white flex flex-col shadow-sm">
      <Link
        href={`/products/${product.slug}`}
        className="relative block bg-gray-50"
      >
        <img
          src={product.image || ""}
          alt={product.title}
          className="w-full h-36 object-contain"
        />
        {product.badge && (
          <span className="absolute top-2 left-2 bg-gray-900 text-white text-xs px-2 py-1 rounded-full font-semibold">
            {product.badge}
          </span>
        )}
      </Link>

      <div className="flex gap-2 px-3 pt-2 pb-1 text-xs">
        {product.category && (
          <span className="bg-gray-100 px-2 py-1 rounded-md">
            {product.category}
          </span>
        )}
        <span className="text-amber-500 font-bold">
          ★ {product.rating ?? "4.8"}
        </span>
      </div>

      <div className="px-3 pb-3 grid gap-3">
        <h3 className="text-sm font-bold leading-tight">
          <Link
            href={`/products/${product.slug}`}
            className="text-gray-900 hover:text-gray-700 transition-colors"
          >
            {product.title}
          </Link>
        </h3>
        <p className="text-xs text-gray-500 leading-relaxed">
          {product.description}
        </p>

        <div className="flex items-center justify-between">
          <span className="text-base font-extrabold text-gray-900">
            {currency(product.price)}
          </span>
          <Link
            href={`/products/${product.slug}`}
            className="bg-gray-900 text-white border border-transparent px-3 py-2 rounded-lg text-xs font-semibold hover:bg-gray-800 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
          >
            Xem
          </Link>
        </div>
      </div>
    </div>
  );
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session: Session | null = await auth();
  const role: Role | undefined = (session?.user as AppUser)?.role;
  const roleString: string =
    role && ROLE_LABELS[role as Role] ? ROLE_LABELS[role] : "Not signed in";

  const params: SearchParams = await searchParams;
  const query: string = params.q?.toString().trim() ?? "";
  const hasSearch: boolean = query.length > 0;

  const recommended: Product[] = await getLatestVisibleProducts(4);
  const searchResults: Product[] = hasSearch ? await searchVisibleProducts(query, 12) : [];

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 grid gap-6">
      <h1 className="text-3xl font-bold flex items-center gap-3">
        Trang chủ
        <span className="text-sm font-semibold px-3 py-1 rounded-full bg-gray-900 text-white">
          Role: {roleString}
        </span>
      </h1>

      <Slider items={slides} />

      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold leading-tight">Tìm kiếm sản phẩm</h2>
            <p className="text-sm text-gray-500">
              Nhập tên sản phẩm hoặc từ khóa bạn muốn tìm.
            </p>
          </div>
          {hasSearch && (
            <span className="text-sm font-semibold text-gray-700">
              {searchResults.length} kết quả cho &quot;{query}&quot;
            </span>
          )}
        </div>

        <form className="mt-4 flex flex-col gap-3 sm:flex-row" role="search">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Ví dụ: Slack, Figma, Visual Studio..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
          <div className="flex gap-2 sm:w-auto">
            <button
              type="submit"
              className="w-full sm:w-auto min-w-[93px] rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
            >
              Tìm kiếm
            </button>
            {hasSearch && (
              <Link
                href="/"
                className="w-full sm:w-auto rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Xóa
              </Link>
            )}
          </div>
        </form>

        {hasSearch && (
          <div className="mt-4">
            {searchResults.length ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {searchResults.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-sm text-gray-600">
                  Không tìm thấy kết quả. Thử từ khóa khác hoặc xem tất cả sản phẩm.
                </p>
                <Link
                  href="/products"
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  Xem tất cả
                </Link>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Recommended section */}
      <section className="mt-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-3">
          <div>
            <h2 className="text-xl font-bold leading-tight">Gợi ý cho bạn</h2>
            <p className="text-sm text-gray-500">
              Một vài sản phẩm phổ biến hôm nay
            </p>
          </div>
          <Link
            href="/products"
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            Xem tất cả
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {recommended.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </main>
  );
}
