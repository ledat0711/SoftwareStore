"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { Session } from "next-auth";
import { useEffect, useMemo, useRef, useState } from "react";

type UserDropdownProps = {
  session: Session;
};

function buildInitials(name?: string | null, email?: string | null): string {
  const source = name?.trim() || email?.trim() || "";
  if (!source) return "U";

  const parts = source.split(/\s+/).slice(0, 2);
  if (parts.length) {
    return parts
      .map((part) => part.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2);
  }

  return source.charAt(0).toUpperCase();
}

export default function UserDropdown({ session }: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  const initials = useMemo(
    () => buildInitials(session.user?.name, session.user?.email),
    [session.user?.email, session.user?.name]
  );

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!isOpen) return;
      const target = event.target as Node;
      if (ref.current && !ref.current.contains(target)) {
        setIsOpen(false);
      }
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen]);

  return (
    // Vì sao dropdown nằm đúng ở góc trên bên phải? Vì component cha có class "relative"
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:ring-offset-2"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-600 text-sm font-bold uppercase text-white">
          {initials}
        </span>
        <div className="hidden text-left sm:block">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            Tài khoản
          </p>
          <p className="max-w-[160px] truncate text-sm font-semibold text-gray-900">
            {session.user?.name || session.user?.email || "Người dùng"}
          </p>
        </div>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className={`h-4 w-4 text-gray-400 transition ${isOpen ? "rotate-180" : ""}`}
        >
          <path
            fill="currentColor"
            d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 0 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4Z"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-3 w-72 rounded-2xl border border-gray-200 bg-white shadow-xl ring-1 ring-gray-100">
          <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-600 text-sm font-bold uppercase text-white">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900">
                {session.user?.name || "Tài khoản"}
              </p>
              {session.user?.email ? (
                <p className="truncate text-xs text-gray-500">
                  {session.user.email}
                </p>
              ) : null}
            </div>
          </div>

          <div className="px-2 py-2">
            <Link
              href="/orders"
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-slate-900 transition hover:bg-gray-50"
              onClick={() => setIsOpen(false)}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900/10 text-slate-900">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M6 6h15l-1.5 9h-12z" />
                  <circle cx="9" cy="20" r="1.3" />
                  <circle cx="18" cy="20" r="1.3" />
                  <path d="M6 6L4 3" />
                </svg>
              </span>
              <div className="text-left">
                <p className="text-sm font-semibold text-slate-900">
                  Đơn hàng của tôi
                </p>
                <p className="text-[11px] text-gray-500">
                  Xem các đơn đã mua bằng tài khoản này
                </p>
              </div>
            </Link>
          </div>

          <div className="border-t border-gray-100 px-4 py-3">
            <button
              type="button"
              onClick={() => signOut()}
              className="w-full rounded-xl bg-red-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
