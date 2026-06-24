import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Vercel maneja el build automáticamente — no necesitamos output: "standalone" */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
