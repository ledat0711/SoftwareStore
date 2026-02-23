"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { ROLES, Role } from "@/constants/role";
import { Package, Flame, Sparkles, Settings } from "lucide-react";

type AppUser = {
  role?: Role;
};

type NavItem = {
  label: string;
  href: string;
  admin?: boolean;
  icon?: React.ReactNode;
};

export default function NavBar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  const role: Role | undefined = (session?.user as AppUser)?.role;
  const isAdmin = role === ROLES.ADMIN;

  // ---------- Loading skeleton ----------
  if (status === "loading") {
    return (
      <div className="px-6 pb-4">
        <div className="flex gap-3 rounded-2xl bg-white/70 dark:bg-gray-900/70 backdrop-blur border border-gray-200 dark:border-gray-700 p-3 shadow-sm">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-9 w-32 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  // ---------- User zone ----------
  const userItems: NavItem[] = [
    {
      label: "All Products",
      href: "/products",
      icon: <Package className="h-4 w-4" />,
    },
    {
      label: "Best Sellers",
      href: "/best-sellers",
      icon: <Flame className="h-4 w-4" />,
    },
    {
      label: "New Releases",
      href: "/new-releases",
      icon: <Sparkles className="h-4 w-4" />,
    },
  ];

  // ---------- Admin zone ----------
  const adminItems: NavItem[] = isAdmin
    ? [
        {
          label: "Products",
          href: "/admin/products",
          admin: true,
          icon: <Settings className="h-4 w-4" />,
        },
        {
          label: "Orders",
          href: "/admin/orders",
          admin: true,
          icon: <Settings className="h-4 w-4" />,
        },
        {
          label: "Users",
          href: "/admin/users",
          admin: true,
          icon: <Settings className="h-4 w-4" />,
        },
        {
          label: "Discounts",
          href: "/admin/discounts",
          admin: true,
          icon: <Settings className="h-4 w-4" />,
        },
      ]
    : [];

  return (
    <div className="px-6 pb-4">
      <nav className="flex flex-wrap items-center gap-2 rounded-2xl bg-white/70 dark:bg-gray-900/70 backdrop-blur border border-gray-200 dark:border-gray-700 p-2 shadow-sm">
        {/* -------- User Zone -------- */}
        {userItems.map((item) => (
          <NavButton
            key={item.href}
            item={item}
            active={pathname === item.href}
          />
        ))}

        {/* -------- Divider -------- */}
        {adminItems.length > 0 && (
          <div className="mx-2 h-8 w-px bg-gray-200 dark:bg-gray-700" />
        )}

        {/* -------- Admin Zone -------- */}
        {adminItems.map((item) => (
          <NavButton
            key={item.href}
            item={item}
            active={pathname === item.href}
          />
        ))}
      </nav>
    </div>
  );
}

// ================== COMPONENT ==================
function NavButton({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      className={`
        group relative inline-flex items-center gap-2
        rounded-full px-5 py-2.5 text-lg font-semibold
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-emerald-400/50
        ${
          active
            ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 shadow-sm"
            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-800/60 hover:text-emerald-600 dark:hover:text-emerald-400"
        }
        hover:-translate-y-[1px]
      `}
    >
      {/* Icon */}
      {item.icon && (
        <span
          className={`transition-colors ${
            active
              ? "text-emerald-500"
              : "text-gray-400 group-hover:text-emerald-500"
          }`}
        >
          {item.icon}
        </span>
      )}

      {/* Label */}
      <span className="relative z-10">{item.label}</span>

      {/* Admin badge */}
      {item.admin && (
        <span
          className={`
            ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide
            ${
              active
                ? "bg-emerald-500 text-white"
                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
            }
          `}
        >
          ADMIN
        </span>
      )}

      {/* Active glow underline */}
      <span
        className={`
          absolute left-3 right-3 -bottom-1 h-[3px] rounded-full
          transition-all duration-300
          ${
            active
              ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]"
              : "bg-transparent group-hover:bg-emerald-400/40"
          }
        `}
      />
    </Link>
  );
}
