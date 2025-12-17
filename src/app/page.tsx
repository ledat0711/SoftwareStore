import Slider from "@/components/Slider";
import Link from "next/link";
import { ROLE_LABELS, Role } from "@/constants/role";
import { getLatestVisibleProducts } from "@/lib/prisma";
import { auth } from "@/auth";

type AppUser = {
  role?: Role;
};

function currency(n: number) {
  return `$${n}`;
}

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

export default async function HomePage() {
  const session = await auth();
  const role: Role | undefined = (session?.user as AppUser)?.role;
  const roleString: string =
    role && ROLE_LABELS[role as Role] ? ROLE_LABELS[role] : "Not signed in";

  const recommended = await getLatestVisibleProducts(4);

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 grid gap-6">
      <h1 className="text-3xl font-bold flex items-center gap-3">
        Trang chủ
        <span className="text-sm font-semibold px-3 py-1 rounded-full bg-gray-900 text-white">
          Role: {roleString}
        </span>
      </h1>

      <Slider items={slides} />

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
            <div
              key={p.id}
              className="border border-gray-200 rounded-2xl overflow-hidden bg-white flex flex-col shadow-sm"
            >
              <Link
                href={`/products/${p.slug}`}
                className="relative block bg-gray-50"
              >
                <img
                  src={p.image || ""}
                  alt={p.title}
                  className="w-full h-36 object-contain"
                />
                {p.badge && (
                  <span className="absolute top-2 left-2 bg-gray-900 text-white text-xs px-2 py-1 rounded-full font-semibold">
                    {p.badge}
                  </span>
                )}
              </Link>

              <div className="flex gap-2 px-3 pt-2 pb-1 text-xs">
                <span className="bg-gray-100 px-2 py-1 rounded-md">
                  {p.category}
                </span>
                <span className="text-amber-500 font-bold">
                  ★ {p.rating ?? "4.8"}
                </span>
              </div>

              <div className="px-3 pb-3 grid gap-3">
                <h3 className="text-sm font-bold leading-tight">
                  <Link
                    href={`/products/${p.slug}`}
                    className="text-gray-900 hover:text-gray-700 transition-colors"
                  >
                    {p.title}
                  </Link>
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {p.description}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-base font-extrabold text-gray-900">
                    {currency(p.price)}
                  </span>
                  <Link
                    href={`/products/${p.slug}`}
                    className="bg-gray-900 text-white border border-transparent px-3 py-2 rounded-lg text-xs font-semibold hover:bg-gray-800 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
                  >
                    Xem
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

