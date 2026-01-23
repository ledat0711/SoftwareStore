import type { ReactNode } from "react";

type LayoutProps = {
  children: ReactNode;
};

export default function AdminProductEditLayout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col px-6 py-8">
        {children}
      </div>
    </div>
  );
}
