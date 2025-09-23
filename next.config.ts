/** biome-ignore-all lint/suspicious/useAwait: <> */
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    reactCompiler: true,
    useCache: true,
  },
  typedRoutes: true,
  rewrites: async () => {
    const isDev = process.env.NODE_ENV === "development";

    const host = isDev ? "http://127.0.0.1:8000" : "https://api.moick.me";

    return {
      // Ensure Next/Vercel handles auth endpoints and they're never proxied
      beforeFiles: [
        {
          source: "/api/auth/:path*",
          destination: "/api/auth/:path*",
        },
      ],
      // Proxy other API and docs routes to the backend service
      afterFiles: [
        {
          source: "/api/:path*",
          destination: `${host}/api/:path*`,
        },
        {
          source: "/docs",
          destination: `${host}/docs`,
        },
        {
          source: "/openapi.json",
          destination: `${host}/openapi.json`,
        },
      ],
      fallback: [],
    };
  },
};

export default nextConfig;
