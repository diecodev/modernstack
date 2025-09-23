"use server";

import { cache } from "react";
import type { Project } from "@/types";
import { auth } from "@/utils/auth";
import { parsedEnv } from "@/utils/env";

export const getProjects = cache(async ({ headers }: { headers: Headers }) => {
  const activeOrgId = await auth.api.getFullOrganization({ headers });

  const url = parsedEnv.BETTER_AUTH_URL;
  const path = "/api/projects";

  const response = await fetch(`${url}${path}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": parsedEnv.NEXT_PUBLIC_PY_API_SECRET,
      "x-organization-id": activeOrgId?.id ?? "",
    },
  });

  if (response.ok) {
    return (await response.json()) as Project[];
  }

  return [] as Project[];
});
