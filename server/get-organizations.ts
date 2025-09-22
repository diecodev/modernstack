"use server";

import { cache } from "react";
import { auth } from "@/utils/auth";

export const getAllOrganizations = cache(
  async ({ headers }: { headers: Headers }) => {
    const activeOrg = auth.api.getFullOrganization({ headers });
    const orgs = auth.api.listOrganizations({ headers });

    const allOrgs = await Promise.all([activeOrg, orgs]);

    // sort organizations by createdAt date
    const organizations = allOrgs[1] ?? [];
    organizations.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    return {
      active: allOrgs[0],
      organizations,
    };
  }
);
