import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/animate-ui/components/radix/sidebar";
import { AppSidebar } from "./components/sidebar";

export default function OrganizationLayout({
  children,
}: LayoutProps<"/o/[org-slug]">) {
  // const { "org-slug": orgSlug } = await params;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <main>
          <SidebarTrigger />
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
