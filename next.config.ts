import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse", "libreoffice-convert"],
};

export default nextConfig;
