"use client";

import { useEffect, useState } from "react";

export default function Slider({ items }: { items: SlideItem[] }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    const t: NodeJS.Timeout = setInterval(() => setI((p) => (p + 1) % items.length), 4000);
    return () => clearInterval(t);
  }, [items.length]);

  const prev: () => void = () => setI((p) => (p - 1 + items.length) % items.length);
  const next: () => void = () => setI((p) => (p + 1) % items.length);

  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-200">
      <div
        className="flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${i * 100}%)` }}
      >
        {items.map((s) => (
          <div
            key={s.id}
            className="flex min-w-full flex-col items-center justify-center gap-3 px-6 py-12 text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.35)] md:h-[320px]"
            style={s.bg ? { background: s.bg } : undefined}
          >
            <div className={`text-3xl font-bold ${s.titleClass ?? ""}`}>
              {s.title}
            </div>
            {s.subtitle ? (
              <div className={`text-lg font-semibold ${s.subtitleClass ?? ""}`}>
                {s.subtitle}
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <button
        aria-label="Prev"
        onClick={prev}
        className="absolute left-3 top-1/2 -translate-y-1/2 rounded-lg border border-gray-200 bg-white/90 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
      >
        ←
      </button>
      <button
        aria-label="Next"
        onClick={next}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg border border-gray-200 bg-white/90 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
      >
        →
      </button>

      <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-2">
        {items.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setI(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            className={`h-2 w-2 rounded-full border border-slate-900 transition ${
              idx === i ? "bg-slate-900" : "bg-transparent"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
