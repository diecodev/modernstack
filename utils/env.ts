import * as v from "valibot";

const envSchema = v.object({
  BETTER_AUTH_URL: v.pipe(v.string(), v.url()),
  BETTER_AUTH_SECRET: v.string(),
  TURSO_DATABASE_URL: v.pipe(v.string(), v.url()),
  TURSO_DATABASE_TOKEN: v.pipe(v.string()),
  GITHUB_CLIENT_ID: v.string(),
  GITHUB_CLIENT_SECRET: v.string(),
  COOKIE_PREFIX: v.string(),
  NEXT_PUBLIC_PY_API_SECRET: v.string(),
});

export const parsedEnv = v.parse(envSchema, process.env);
