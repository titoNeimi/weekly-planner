import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@weekly-planner/db"],
};

export default nextConfig;
