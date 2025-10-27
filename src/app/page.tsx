import Slider from "@/components/Slider";

export default function HomePage() {
  const slides = [
    {
      id: "s1",
      title: "Welcome to Trading Software",
      subtitle: "Nhanh, đơn giản, hiệu quả",
      bg: "linear-gradient(135deg,#d1fae5,#bfdbfe)",
    },
    {
      id: "s2",
      title: "Trade Smarter",
      subtitle: "Công cụ tối ưu hiệu suất",
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
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>Trang chủ</h1>
      <Slider items={slides} />
    </main>
  );
}
