import { headers as _headers } from "next/headers";
import { Suspense } from "react";
import {
  Sidebar,
  SidebarMenuSkeleton,
} from "@/components/animate-ui/components/radix/sidebar";
import { getAllOrganizations } from "@/server/get-organizations";
import { AppSidebarContent } from "./sidebar-content";
import { AppSidebarHeader as SidebarHeaderContent } from "./sidebar-header";

export async function AppSidebar() {
  const headers = await _headers();
  const organizationData = getAllOrganizations({ headers });

  return (
    <Sidebar side="left" variant="inset">
      <Suspense fallback={<SidebarMenuSkeleton className="h-10" />}>
        <SidebarHeaderContent organizationData={organizationData} />
      </Suspense>
      <AppSidebarContent />
    </Sidebar>
  );
}
