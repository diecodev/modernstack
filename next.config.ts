/** biome-ignore-all lint/suspicious/useAwait: <> */
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    reactCompiler: true,
    useCache: true,
  },
  typedRoutes: true,
  rewrites: async () => {
    return [
      {
        source: "/py-api/:path*",
        destination: "https://api.moick.me/:path*",
      },
      {
        source: "/docs",
        destination: "https://api.moick.me/docs",
      },
      {
        source: "/openapi.json",
        destination: "https://api.moick.me/openapi.json",
      },
    ];
  },
};

export default nextConfig;
