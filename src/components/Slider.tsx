"use client"
import { useEffect, useState } from "react"

type Slide = {
  id: string
  title: string
  subtitle?: string
  bg: string // CSS color/gradient
}

export default function Slider({ items, interval = 4000 }: { items: Slide[]; interval?: number }) {
  const [i, setI] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % items.length), interval)
    return () => clearInterval(t)
  }, [items.length, interval])

  const prev = () => setI((p) => (p - 1 + items.length) % items.length)
  const next = () => setI((p) => (p + 1) % items.length)

  return (
    <div style={{ position: "relative", overflow: "hidden", borderRadius: 12, border: "1px solid #e5e7eb" }}>
      <div
        style={{
          display: "flex",
          width: `${items.length * 100}%`,
          transform: `translateX(-${i * (100 / items.length)}%)`,
          transition: "transform .5s ease",
        }}
      >
        {items.map((s) => (
          <div
            key={s.id}
            style={{
              flex: "0 0 100%",
              height: 320,
              background: s.bg,
              color: "#111827",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div style={{ fontSize: 28, fontWeight: 700 }}>{s.title}</div>
            {s.subtitle && <div style={{ opacity: 0.8 }}>{s.subtitle}</div>}
          </div>
        ))}
      </div>

      <button
        aria-label="Prev"
        onClick={prev}
        style={{
          position: "absolute",
          left: 8,
          top: "50%",
          transform: "translateY(-50%)",
          background: "rgba(255,255,255,.9)",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          padding: "6px 10px",
          cursor: "pointer",
        }}
      >
        ‹
      </button>
      <button
        aria-label="Next"
        onClick={next}
        style={{
          position: "absolute",
          right: 8,
          top: "50%",
          transform: "translateY(-50%)",
          background: "rgba(255,255,255,.9)",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          padding: "6px 10px",
          cursor: "pointer",
        }}
      >
        ›
      </button>

      <div style={{ position: "absolute", bottom: 10, left: 0, right: 0, display: "flex", gap: 6, justifyContent: "center" }}>
        {items.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setI(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              border: "1px solid #111827",
              background: idx === i ? "#111827" : "transparent",
              cursor: "pointer",
            }}
          />
        ))}
      </div>
    </div>
  )
}