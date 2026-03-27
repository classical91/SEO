import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@rankforge/ai",
    "@rankforge/crawler",
    "@rankforge/db",
    "@rankforge/integrations",
    "@rankforge/seo",
    "@rankforge/ui"
  ]
};

export default nextConfig;
