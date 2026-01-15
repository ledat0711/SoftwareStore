"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import NavBar from "@/components/NavBar";
import CartDropdown from "@/components/CartDropdown";
import ProfileDropdown from "@/components/ProfileDropdown";
import { Session } from "next-auth";

export default function Header() {
  const { data: session }: { data: Session | null }  = useSession();

  return (
    <header className="relative z-50 w-full bg-white shadow-md">
      <div className="py-4 px-8">
        <nav className="flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-gray-800 hover:text-blue-600 transition-colors">
            Software Store
          </Link>
          <div className="flex items-center space-x-4">
            {session ? (
              <>
                <ProfileDropdown userName={session.user?.name || ""} email={session.user?.email || ""} />
              </>
            ) : (
              <Link href="/login" className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition">
                Sign In
              </Link>
            )}
            <CartDropdown />
          </div>
        </nav>
      </div>

      {/* Nav bar tách riêng */}
      <NavBar/>
    </header>
  );
}
