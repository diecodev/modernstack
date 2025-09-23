/** biome-ignore-all lint/suspicious/useAwait: <> */
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    reactCompiler: true,
    useCache: true,
  },
  typedRoutes: true,
  async rewrites() {
    const isDev =
      process.env.VERCEL === "1" &&
      process.env.VERCEL_ENV !== "production" &&
      process.env.VERCEL_ENV !== "preview";

    const host = isDev ? "http://127.0.0.1:8000" : "https://api.moick.me";

    console.log("Rewrites host:", host);

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
