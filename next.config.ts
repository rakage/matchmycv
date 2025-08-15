import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse", "libreoffice-convert"],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
