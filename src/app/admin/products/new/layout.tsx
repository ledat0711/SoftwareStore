import type { ReactNode } from "react";

export default function AdminProductCreateLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col px-6 py-6">
        {children}
      </div>
    </div>
  );
}
