import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    qualities: [65, 70, 75],
  },
};

export default nextConfig;
