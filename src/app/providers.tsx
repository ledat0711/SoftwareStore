"use client";

import { SessionProvider } from "next-auth/react";
import { CartProvider } from "@/components/CartProvider";
import { ToastProvider } from "@/components/ToastProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>
        <CartProvider>{children}</CartProvider>
      </ToastProvider>
    </SessionProvider>
  );
} 
