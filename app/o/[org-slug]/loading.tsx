import {
  Sidebar,
  SidebarInset,
  SidebarMenuSkeleton,
  SidebarProvider,
} from "@/components/animate-ui/components/radix/sidebar";

export default function Loading() {
  return (
    <SidebarProvider>
      <Sidebar side="left" variant="inset">
        <SidebarMenuSkeleton className="h-10" />
      </Sidebar>
      <SidebarInset>
        <main />
      </SidebarInset>
    </SidebarProvider>
  );
}
