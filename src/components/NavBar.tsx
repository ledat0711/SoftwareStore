"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { ROLES, Role } from "@/constants/role";

type AppUser = {
  role?: Role;
};

export default function NavBar() {
  const { data: session } = useSession();
  const pathname: string = usePathname();

  const role: Role | undefined = (session?.user as AppUser)?.role;
  const isAdmin: boolean = role === ROLES.ADMIN;

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
  const items: NavItem[] = isAdmin ? [...baseItems, ...adminItems] : baseItems;

  return (
    <div className="px-8 pb-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 border rounded-md p-2">
        {items.map((item) => {
          const active: boolean = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`text-center rounded-md py-3 font-medium transition-colors border ${
                active
                  ? "bg-green-500 text-white border-green-600"
                  : "bg-green-200 text-gray-800 hover:bg-green-300 border-green-300"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
