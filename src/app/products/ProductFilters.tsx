"use client";

import { CATEGORY_BASE, PLATFORM_BASE } from "@/constants/product";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useRef } from "react";

type Props = {
  categoryFilter: string[];
  platformFilter: string[];
};

export default function ProductFilters({ categoryFilter, platformFilter }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const formRef = useRef<HTMLFormElement | null>(null);

  const handleChange = useCallback(() => {
    const form = formRef.current;
    if (!form) return;

    const formData = new FormData(form);
    const params = new URLSearchParams(searchParams.toString());

    params.delete("category");
    params.delete("platform");

    formData.getAll("category").forEach((value) => {
      if (typeof value === "string" && value) params.append("category", value);
    });

    formData.getAll("platform").forEach((value) => {
      if (typeof value === "string" && value) params.append("platform", value);
    });

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }, [pathname, router, searchParams]);

  return (
    <form ref={formRef} className="grid gap-4">
      <div className="grid gap-2">
        <h3 className="text-sm font-semibold text-slate-900">Categories</h3>
        <div className="grid gap-1.5">
          {CATEGORY_BASE.map((c) => (
            <label key={c} className="flex items-center gap-2 text-sm text-slate-800">
              <input
                type="checkbox"
                name="category"
                value={c}
                defaultChecked={categoryFilter.includes(c)}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>{c}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-2 border-t border-gray-200 pt-3">
        <h3 className="text-sm font-semibold text-slate-900">Available on</h3>
        <div className="grid gap-1.5">
          {PLATFORM_BASE.map((p) => (
            <label key={p} className="flex items-center gap-2 text-sm text-slate-800">
              <input
                type="checkbox"
                name="platform"
                value={p}
                defaultChecked={platformFilter.includes(p)}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>{p}</span>
            </label>
          ))}
        </div>
      </div>
    </form>
  );
}
