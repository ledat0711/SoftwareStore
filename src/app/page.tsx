"use client";

import Slider from "@/components/Slider";
import { useSession } from "next-auth/react";

export default function HomePage() {
  const { data: session, status } = useSession();

  const role = (session?.user as any)?.role
  const roleString  = role === "ADMIN" ? "Admin" : role === "USER" ? "User" : "Customer"

  const slides = [
    {
      id: "s1",
      title: "Welcome to Software Store",
      titleClass: "text-white",
      bg: "linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('https://images-eds-ssl.xboxlive.com/image?url=7flt5HU26ZSS3Tgted_TMty0wzqMQYpm03yD7eAPRtQBYO5dMlD18uZxNDuKXvpqAKGFYXbR3E2AUl4SjJkn2wMOGpMzW_eL9bead7iYs2rnbclM65KqMluL9PQUxrK9Ly91WqD2mOR04qP8KhlAr9sCYHV0ITD7w0VDwUVc0OS0dlZQzX_mQjmIhqTnlbcK5QYa0bZ0JBvUwPmYg3m28w--&h=576') center/cover no-repeat",
    },
    {
      id: "s2",
      title: "Performance Optimization",
      subtitle: "Tối ưu hiệu suất",
      bg: "linear-gradient(135deg,#fde68a,#fecaca)",
    },
    {
      id: "s3",
      title: "Secure & Reliable",
      subtitle: "Bảo mật và ổn định",
      bg: "linear-gradient(135deg,#e9d5ff,#bae6fd)",
    },
  ];

  return (
    <main style={{ maxWidth: 960, margin: "32px auto", padding: "0 16px", display: "grid", gap: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, display: "flex", alignItems: "center", gap: 12 }}>
        Trang chủ
        {(
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              padding: "2px 10px",
              borderRadius: 999,
              background: "#111827",
              color: "#fff",
            }}
          >
            Role: {roleString}
          </span>
        )}
      </h1>
      <Slider items={slides} />
    </main>
  );
}
