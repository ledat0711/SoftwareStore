"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import NavBar from "@/components/NavBar";
import CartDropdown from "@/components/CartDropdown";
import UserDropdown from "@/components/UserDropdown";
import { Session } from "next-auth";

export default function Header() {
  const { data: session }: { data: Session | null } = useSession();

  return (
    <header className="relative z-50 w-full bg-white shadow-md">
      <div className="py-4 px-8">
        {/* 
          khi viết <div class="flex justify-between"> thì nó chia đều hai bên
          ┌─────────────────────────────── HEADER ───────────────────────────────┐
          │ Bên trái                                                  Bên phải   │
          │ Logo / Menu                                             Cart | User  │
          └──────────────────────────────────────────────────────────────────────┘
        */}
        <nav className="flex justify-between items-center">
          <Link
            href="/"
            className="text-xl font-bold text-gray-800 hover:text-blue-600 transition-colors"
          >
            Software Store
          </Link>
          <div className="flex items-center space-x-4">
            <CartDropdown />
            {session ? (
              <UserDropdown session={session} />
            ) : (
              <Link
                href="/login"
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
              >
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
