"use client";

import { glass } from "@dicebear/collection";
import { createAvatar } from "@dicebear/core";
import { ChevronsUpDown, Plus } from "lucide-react";
import Image from "next/image";
import { use, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/animate-ui/components/radix/dropdown-menu";
import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/animate-ui/components/radix/sidebar";
import { TypedLink } from "@/components/typed-link";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTypedRouter } from "@/hooks/use-typed-router";
import { setupOrganizationShortcuts } from "@/lib/organization-shortcuts";
import type { getAllOrganizations } from "@/server/get-organizations";
import { authClient } from "@/utils/auth-client";

const avatar = (orgName: string) =>
  createAvatar(glass, {
    seed: orgName,
    radius: 50,
    scale: 50,
    size: 32,
    backgroundType: ["gradientLinear"],
  }).toDataUri();

export function AppSidebarHeader({
  organizationData,
}: {
  organizationData: ReturnType<typeof getAllOrganizations>;
}) {
  const data = use(organizationData);

  const isMobile = useIsMobile();
  const router = useTypedRouter();

  useEffect(() => {
    setupOrganizationShortcuts({
      teams: data.organizations,
      router,
    });
  }, [data.organizations, router]);

  return (
    <SidebarHeader className="p-0">
      {/* Team Switcher */}
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton className="h-fit data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:p-0!">
                <div>
                  <Image
                    alt="Team Avatar"
                    height={24}
                    src={avatar(data.active?.name ?? "Default")}
                    width={24}
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {data.active?.name}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              sideOffset={4}
            >
              <DropdownMenuLabel className="py-0.5 text-muted-foreground text-xs">
                Teams
              </DropdownMenuLabel>
              {data.organizations?.map((team, index) => (
                <DropdownMenuItem
                  className="gap-2 p-1"
                  key={team.id}
                  onClick={async () => {
                    await authClient.organization.setActive({
                      organizationId: team.id,
                    });

                    // change the location to the new org slug
                    router.push("/o/[org-slug]", {
                      params: { "org-slug": team.slug },
                    });
                  }}
                >
                  <div className="flex size-6 items-center justify-center rounded-sm">
                    <Image
                      alt="Team Avatar"
                      height={16}
                      src={avatar(team.name)}
                      width={16}
                    />
                  </div>
                  {team.name}
                  <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <TypedLink href="/new">
                <DropdownMenuItem className="gap-2 p-1">
                  <div className="flex size-5 items-center justify-center rounded-md border bg-accent">
                    <Plus className="size-4" />
                  </div>
                  <div className="font-medium text-muted-foreground">
                    Add team
                  </div>
                </DropdownMenuItem>
              </TypedLink>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
      {/* Team Switcher */}
    </SidebarHeader>
  );
}
