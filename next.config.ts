import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  env: {
    // Bake build timestamp into the bundle at build time
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },
  // Fix for Prisma + Turbopack compatibility in standalone mode
  // https://github.com/prisma/prisma/discussions/28956
  serverExternalPackages: ["@prisma/client", "prisma"],
};

export default nextConfig;
