"use client";

import { BotMessageSquare, Command } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/animate-ui/components/radix/sidebar";

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

export const AppSidebarContent = () => {
  const param = useParams<{ "org-slug": string }>();
  const path = usePathname();
  const orgBase = `/o/${param["org-slug"]}` as const;

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
    </SidebarContent>
  );
};
