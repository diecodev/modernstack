import { defineConfig } from "drizzle-kit";
import { parsedEnv } from "@/utils/env";

export default defineConfig({
  schema: "./utils/auth-schema.ts",
  out: "./drizzle/out",
  dialect: "turso",
  dbCredentials: {
    url: parsedEnv.TURSO_DATABASE_URL,
    authToken: parsedEnv.TURSO_DATABASE_TOKEN,
  },
});
