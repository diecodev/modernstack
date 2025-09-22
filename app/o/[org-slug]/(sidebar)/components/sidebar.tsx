import { Sidebar } from "@/components/animate-ui/components/radix/sidebar";
import { AppSidebarContent } from "./sidebar-content";
import { AppSidebarHeader as SidebarHeaderContent } from "./sidebar-header";

export function AppSidebar() {
  return (
    <Sidebar side="left" variant="inset">
      <SidebarHeaderContent />
      <AppSidebarContent />
    </Sidebar>
  );
}
