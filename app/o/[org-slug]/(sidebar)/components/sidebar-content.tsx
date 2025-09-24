"use client";

import { BotMessageSquare, Command, Plus } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { use } from "react";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/animate-ui/components/radix/sidebar";
import { NEW_PROJECT_MODAL_KEY, NEW_PROJECT_MODAL_VALUE } from "@/constants";
import type { Project } from "@/types";
import NoProjectsCTA from "./projects/no-projects-cta";
import ProjectItem from "./projects/project-item";

// Normalize paths to avoid mismatches due to trailing slashes
function stripTrailingSlash(p: string): string {
  return p.length > 1 && p.endsWith("/") ? p.slice(0, -1) : p;
}

function isActiveRoute({
  allowPrefix,
  current,
  target,
}: {
  current: string;
  target: string;
  allowPrefix: boolean;
}): boolean {
  const c = stripTrailingSlash(current);
  const t = stripTrailingSlash(target);
  if (c === t) {
    return true;
  }
  return allowPrefix && c.startsWith(`${t}/`);
}

const topItems = [
  {
    id: "quick",
    name: "Quick Actions",
    items: [
      {
        id: "overview",
        name: "Overview",
        icon: Command,
        href: "/",
      },
      {
        id: "agent",
        name: "AI Agent",
        icon: BotMessageSquare,
        href: "/agent",
      },
    ],
  },
];

export const AppSidebarContent = ({
  projects: _projects,
}: {
  projects: Promise<Project[]>;
}) => {
  const param = useParams<{ "org-slug": string }>();
  const path = usePathname();
  const slug = param["org-slug"];
  const orgBase = `/o/${slug}` as const;
  const projects = use(_projects);
  const router = useRouter();

  const createNewProject = () => {
    const sp = new URLSearchParams(window.location.search);
    sp.set(NEW_PROJECT_MODAL_KEY, NEW_PROJECT_MODAL_VALUE);
    const search = `${sp.toString()}`;
    router.push(`?${search}`);
  };

  return (
    <SidebarContent>
      {topItems.map((section) => (
        <SidebarGroup className="py-1" key={section.id}>
          <SidebarGroupLabel className="mb-1 h-fit p-1">
            {section.name}
          </SidebarGroupLabel>
          <SidebarMenu>
            {section.items.map((item) => (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  asChild
                  isActive={isActiveRoute({
                    current: path,
                    target: `${orgBase}${item.href}`,
                    allowPrefix: item.href !== "/",
                  })}
                  size="sm"
                >
                  <Link href={`${orgBase}${item.href}`}>
                    <item.icon />
                    <span>{item.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      ))}

      {projects.length === 0 ? (
        <NoProjectsCTA />
      ) : (
        <SidebarGroup className="py-1">
          <SidebarGroupLabel className="mb-1 h-fit p-1">
            Projects
            <SidebarGroupAction
              className="text-muted-foreground hover:text-foreground"
              onClick={createNewProject}
            >
              <Plus className="size-3!" />
            </SidebarGroupAction>
          </SidebarGroupLabel>
          <SidebarMenu>
            {projects.map((p) => (
              <ProjectItem key={p.id} project={p} />
            ))}
          </SidebarMenu>
        </SidebarGroup>
      )}
    </SidebarContent>
  );
};
