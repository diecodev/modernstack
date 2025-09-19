import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { parsedEnv } from "./env";

const client = createClient({
  url: parsedEnv.TURSO_DATABASE_URL,
  authToken: parsedEnv.TURSO_DATABASE_TOKEN,
});

export const db = drizzle({ client });
