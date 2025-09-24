import { headers as _headers } from "next/headers";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/animate-ui/components/radix/sidebar";
import { AppSidebar } from "./components/sidebar";
import { GlobalDropProvider } from "@/components/providers/global-drop-provider";
import { getProjects } from "@/server/get-projects";
import { auth } from "@/utils/auth";

export default async function OrganizationLayout({
  children,
}: LayoutProps<"/o/[org-slug]">) {
  const headers = await _headers();
  const projectsData = getProjects({ headers });
  const activeOrg = await auth.api.getFullOrganization({ headers });

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <main>
          <SidebarTrigger />
          {children}
        </main>
      </SidebarInset>
      {activeOrg?.id && (
        <GlobalDropProvider
          projectsPromise={projectsData}
          organizationId={activeOrg.id}
        />
      )}
    </SidebarProvider>
  );
}
