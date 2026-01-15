"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";

export default function ProfileDropdown({ userName, email }: { userName: string; email: string }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!open) return;
      const target = event.target as Node;
      if (containerRef.current && !containerRef.current.contains(target)) {
        setOpen(false);
      }
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span>{userName}</span>
      </button>

      {open && (
        <div
          className="absolute right-0 z-50 mt-2 w-[320px] rounded-2xl border border-gray-200 bg-white shadow-xl"
          role="dialog"
          aria-label="Mini cart"
        >
          

    <div className="border-t border-gray-100 px-4 py-3">
            <div className="flex items-center justify-between text-sm font-semibold text-gray-900">
             <div className="p-2">
      <div className="flex items-center px-2.5 p-2 space-x-1.5 text-sm bg-neutral-secondary-strong rounded">
        <div className="text-sm">
          <div className="font-medium text-heading">{userName}</div>
          <div className="truncate text-body">{email}</div>
        </div>
      </div>
    </div>
            </div>
          </div>

          <div className="border-t border-gray-100 px-4 py-3">
            <div className="flex items-center justify-between text-sm font-semibold text-gray-900">
              <span><Link
                    href="/customer/profile"
                  >
                    Profile
                  </Link></span>
            </div>
          </div>

          <div className="border-t border-gray-100 px-4 py-3">
            <div className="flex items-center justify-between text-sm font-semibold text-gray-900">
              <span><Link
                    href="/customer/orders"
                  >
                    Orders
                  </Link></span>
            </div>
          </div>

          <div className="border-t border-gray-100 px-4 py-3">
            <div className="flex items-center justify-between text-sm font-semibold text-gray-900">
              <span><Link
                    href="/customer/orders"
                  >
                    ninZaFamily
                  </Link></span>
            </div>
          </div>

          <div className="border-t border-gray-100 px-4 py-3">
            <div className="flex items-center justify-between text-sm font-semibold text-gray-900">
              <span><Link
                    href="/customer/orders"
                  >
                    License Manager
                  </Link></span>
            </div>
          </div>

          <div className="mt-3 grid">
              <button
                  onClick={() => signOut()}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                  >
                  Log Out
                  </button>
            </div>
        </div>
      )}
    </div>
  );
}
