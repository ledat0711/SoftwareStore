"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import NavBar from "@/components/NavBar";

export default function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const role = (session?.user as any)?.role as string | undefined;
  const isAdmin = role === "ADMIN";

  type NavItem = { label: string; href: string };
  const baseItems: NavItem[] = [
    { label: "Best Sellers", href: "/best-sellers" },
    { label: "New Releases", href: "/new-releases" },
  ];
  const adminItems: NavItem[] = [
    { label: "Quản lý sản phẩm", href: "/admin/products" },
    { label: "Quản lý đơn hàng", href: "/admin/orders" },
    { label: "Quản lý người dùng", href: "/admin/users" },
  ];
  const items = isAdmin ? [...baseItems, ...adminItems] : baseItems;

  return (
    <header className="w-full bg-white shadow-md">
      <div className="py-4 px-8">
        <nav className="flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-gray-800 hover:text-blue-600 transition-colors">
            Software Store
          </Link>
          <div className="flex items-center space-x-4">
            {session ? (
              <>
                <div className="text-sm text-gray-500 text-right">
                  {session.user?.name && <div>{session.user.name}</div>}
                  <div>{session.user?.email}</div>
                </div>
                <button
                  onClick={() => signOut()}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link href="/login" className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition">
                Sign In
              </Link>
            )}
          </div>
        </nav>
      </div>

      {/* Nav bar tách riêng */}
      <NavBar />
    </header>
  );
}
