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
      beforeFiles: [
        {
          source: "/py-api/:path*",
          destination: `${host}/:path*`,
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
    };
  },
};

export default nextConfig;
