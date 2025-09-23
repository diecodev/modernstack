import { cache } from "react";
import { authClient } from "@/utils/auth-client";

export const fetchClient = cache(async (...args: Parameters<typeof fetch>) => {
  const session = await authClient.getSession();

  const res = await fetch(args[0], {
    ...args[1],
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.NEXT_PUBLIC_PY_API_SECRET || "",
      "x-organization-id": session.data?.session.activeOrganizationId || "",
      ...args[1]?.headers,
    },
  });

  return res;
});
