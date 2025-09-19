import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { lastLoginMethod, organization } from "better-auth/plugins";
import * as schema from "./auth-schema";
import { db } from "./db";
import { parsedEnv } from "./env";

export const auth = betterAuth({
  appName: "simply_sign",
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
    usePlural: true,
  }),
  session: {
    cookieCache: {
      enabled: true,
      // biome-ignore lint/style/noMagicNumbers: Cache duration is set to 5 minutes -> min * sec
      maxAge: 5 * 60,
    },
  },
  plugins: [organization(), nextCookies(), lastLoginMethod()],
  secret: parsedEnv.BETTER_AUTH_SECRET,
  baseURL: parsedEnv.BETTER_AUTH_URL,
  socialProviders: {
    github: {
      clientId: parsedEnv.GITHUB_CLIENT_ID,
      clientSecret: parsedEnv.GITHUB_CLIENT_SECRET,
    },
  },
  advanced: { cookiePrefix: parsedEnv.COOKIE_PREFIX },
});
