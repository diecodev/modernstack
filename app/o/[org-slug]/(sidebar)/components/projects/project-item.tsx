"use client";

import { FolderCode, MoreHorizontal } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Fragment } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/animate-ui/components/radix/dropdown-menu";
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/animate-ui/components/radix/sidebar";
import { TypedLink } from "@/components/typed-link";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { EDIT_PROJECT_MODAL_KEY, REMOVE_PROJECT_MODAL_KEY } from "@/constants";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Project } from "@/types";

type OptionAction = "edit_project" | "remove_project" | "copy_link";

const options: Array<{ id: number; label: string; action: OptionAction }> = [
  { id: 1, label: "Edit Project", action: "edit_project" },
  { id: 3, label: "Copy Link", action: "copy_link" },
  { id: 2, label: "Remove Project", action: "remove_project" },
];

export function ProjectItem({ project }: { project: Project }) {
  const params = useParams<{ "org-slug": string; name: string }>();
  const isMobile = useIsMobile();
  const router = useRouter();

  const parsedName = decodeURIComponent(params.name || "").toLowerCase();

  const onEditProject = () => {
    const sp = new URLSearchParams(window.location.search);
    sp.set(EDIT_PROJECT_MODAL_KEY, project.id);
    router.push(`?${sp.toString()}`);
  };

  const onRemoveProject = () => {
    const sp = new URLSearchParams(window.location.search);
    sp.set(REMOVE_PROJECT_MODAL_KEY, project.id);
    router.push(`?${sp.toString()}`);
  };
  const onCopyLink = async () => {
    try {
      const url = new URL(
        `${window.location.origin}/o/${params["org-slug"]}/p/${project.name}`
      ).toString();
      await navigator.clipboard.writeText(url);
    } catch {
      return null;
    }
  };

  const handleAction: Record<OptionAction, () => void> = {
    edit_project: onEditProject,
    remove_project: onRemoveProject,
    copy_link: onCopyLink,
  };

  return (
    <SidebarMenuItem className="items-center">
      <ContextMenu>
        <SidebarMenuButton
          asChild
          isActive={parsedName === project.name.toLowerCase()}
          size="sm"
        >
          <ContextMenuTrigger asChild>
            <TypedLink
              href="/o/[org-slug]/p/[name]"
              params={{
                name: project.name.toLowerCase(),
                "org-slug": params["org-slug"],
              }}
            >
              <div
                className="rounded-sm bg-[color:var(--project-color-bg)] p-[3px] text-[color:var(--project-color)]"
                style={
                  {
                    "--project-color": `oklch(${project.color})`,
                    "--project-color-bg": `oklch(${project.color} / 0.2)`,
                  } as React.CSSProperties
                }
              >
                <FolderCode className="size-4" />
              </div>
              <span className="truncate">{project.name}</span>
            </TypedLink>
          </ContextMenuTrigger>
        </SidebarMenuButton>
        {/* Hover action menu as dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild className="-translate-y-1/2 top-1/2">
            <SidebarMenuAction showOnHover>
              <MoreHorizontal className="size-4" />
              <span className="sr-only">Open project menu</span>
            </SidebarMenuAction>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align={isMobile ? "end" : "start"}
            className="w-52"
            side={isMobile ? "bottom" : "right"}
          >
            {options.map((opt) => {
              if (opt.action === "remove_project") {
                return (
                  <Fragment key={opt.id}>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-xs"
                      key={opt.id}
                      onSelect={handleAction[opt.action]}
                      variant="destructive"
                    >
                      {opt.label}
                    </DropdownMenuItem>
                  </Fragment>
                );
              }

              return (
                <DropdownMenuItem
                  className="text-xs"
                  key={opt.id}
                  onSelect={handleAction[opt.action]}
                >
                  {opt.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
        {/* Forward the built project.href as string; TypedLink accepts route keys, so fall back to regular anchor semantics via 'as never' */}
        <ContextMenuContent className="w-52">
          {options.map((opt) => {
            if (opt.action === "remove_project") {
              return (
                <Fragment key={opt.id}>
                  <ContextMenuSeparator />
                  <ContextMenuItem
                    className="text-xs"
                    onSelect={handleAction[opt.action]}
                    variant="destructive"
                  >
                    {opt.label}
                  </ContextMenuItem>
                </Fragment>
              );
            }

            return (
              <ContextMenuItem
                className="text-xs"
                key={opt.id}
                onSelect={handleAction[opt.action]}
              >
                {opt.label}
              </ContextMenuItem>
            );
          })}
        </ContextMenuContent>
      </ContextMenu>
    </SidebarMenuItem>
  );
}

export default ProjectItem;
