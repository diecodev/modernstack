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

    return [
      {
        source: "/py-api/:path*",
        destination: `${host}/api/:path*`,
      },
      {
        source: "/py-api/docs",
        destination: `${host}/docs`,
      },
      {
        source: "/py-api/openapi.json",
        destination: `${host}/openapi.json`,
      },
    ];
  },
};

export default nextConfig;
