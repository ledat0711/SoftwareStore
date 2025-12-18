"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type ToastTone = "success" | "error" | "info";

type Toast = {
  id: string;
  message: string;
  tone: ToastTone;
  durationMs: number;
};

type ToastContextValue = {
  push: (message: string, tone?: ToastTone, durationMs?: number) => void;
  success: (message: string, durationMs?: number) => void;
  error: (message: string, durationMs?: number) => void;
  info: (message: string, durationMs?: number) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);
const DEFAULT_DURATION = 3200;

function createToastId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeoutsRef = useRef<Record<string, number>>({});

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    const timeout = timeoutsRef.current[id];
    if (timeout) {
      window.clearTimeout(timeout);
      delete timeoutsRef.current[id];
    }
  }, []);

  const push = useCallback(
    (message: string, tone: ToastTone = "info", durationMs = DEFAULT_DURATION) => {
      const id = createToastId();
      const toast: Toast = { id, message, tone, durationMs };
      setToasts((prev) => [...prev, toast]);

      timeoutsRef.current[id] = window.setTimeout(() => {
        dismiss(id);
      }, durationMs);
    },
    [dismiss]
  );

  useEffect(() => {
    return () => {
      Object.values(timeoutsRef.current).forEach((timeout) => {
        window.clearTimeout(timeout);
      });
      timeoutsRef.current = {};
    };
  }, []);

  const value = useMemo(
    () => ({
      push,
      success: (message: string, durationMs?: number) =>
        push(message, "success", durationMs),
      error: (message: string, durationMs?: number) =>
        push(message, "error", durationMs),
      info: (message: string, durationMs?: number) => push(message, "info", durationMs),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed right-4 top-4 z-50 flex w-[280px] flex-col gap-2 sm:w-[320px]"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start justify-between gap-2 rounded-xl border px-3 py-2 text-sm shadow-lg ${
              toast.tone === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : toast.tone === "error"
                ? "border-red-200 bg-red-50 text-red-900"
                : "border-slate-200 bg-white text-slate-900"
            }`}
          >
            <span>{toast.message}</span>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="rounded-md px-1 text-xs text-slate-500 transition hover:text-slate-800"
            >
              Close
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
