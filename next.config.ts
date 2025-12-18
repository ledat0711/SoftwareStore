import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    typedRoutes: false, // ⛔ Tắt validator của Next.js vì đang bị lỗi
  },
};

export default nextConfig;
