import Slider from "@/components/Slider";
import Link from "next/link";
import { ROLE_LABELS, Role } from "@/constants/role";
import {
  getLatestVisibleProducts,
  searchVisibleProducts,
  searchVisibleProductsAction,
} from "@/lib/prisma";
import { auth } from "@/auth";
import { Session } from "next-auth";
import { Product } from "@/types/product";
import ProductSearch from "@/components/ProductSearch";
import ProductCard from "@/components/ProductCard";

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

  const recommended: Product[] = await getLatestVisibleProducts(4);
  const searchResults: Product[] = query.length > 0 ? await searchVisibleProducts(query, 12) : [];

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 grid gap-6">
      <h1 className="text-3xl font-bold flex items-center gap-3">
        Trang chủ
        <span className="text-sm font-semibold px-3 py-1 rounded-full bg-gray-900 text-white">
          Role: {roleString}
        </span>
      </h1>

      <Slider items={slides} />

      <ProductSearch
        initialQuery={query}
        initialResults={searchResults}
        onSearch={searchVisibleProductsAction}
      />

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
