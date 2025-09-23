"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/animate-ui/components/radix/sidebar";
import { NEW_PROJECT_MODAL_KEY, NEW_PROJECT_MODAL_VALUE } from "@/constants";

export function NoProjectsCTA() {
  const router = useRouter();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Projects</SidebarGroupLabel>
      <SidebarMenuItem>
        <SidebarMenuButton
          className="justify-center border border-muted-foreground/50 border-dashed bg-accent/50 text-xs transition-colors hover:border-muted-foreground/70 hover:bg-accent/70"
          onClick={() =>
            router.push(`?${NEW_PROJECT_MODAL_KEY}=${NEW_PROJECT_MODAL_VALUE}`)
          }
          size="sm"
        >
          <Plus className="size-3!" />
          <span>New project</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarGroup>
  );
}

export default NoProjectsCTA;
