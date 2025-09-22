"use server";

import { auth } from "@/utils/auth";

export const getOrganizationRedirect = async ({
  headers,
}: {
  headers: Headers;
}): Promise<string> => {
  const activeOrg = await auth.api.getFullOrganization({ headers });

  if (activeOrg) {
    return `o/${activeOrg.slug}`;
  }

  const org = await auth.api.listOrganizations({ headers });
  const organization = org[0];

  if (organization?.id) {
    await auth.api.setActiveOrganization({
      headers,
      body: {
        organizationId: organization.id,
      },
    });

    return `o/${organization.slug}`;
  }

  return "new";
};
