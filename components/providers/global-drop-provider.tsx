"use client";

import { useParams } from "next/navigation";
import { use } from "react";
import { GlobalFileDropHandler } from "@/components/global-file-drop-handler";
import { ToastContainer } from "@/components/ui/toast";
import { useToasts } from "@/stores/toast-store";
import type { Project } from "@/types";

type GlobalDropProviderProps = {
  projectsPromise: Promise<Project[]>;
  organizationId: string;
};

export function GlobalDropProvider({
  projectsPromise,
  organizationId,
}: GlobalDropProviderProps) {
  const projects = use(projectsPromise);
  const params = useParams<{ "org-slug": string; name?: string }>();
  const { toasts, removeToast } = useToasts();

  // Determine current project based on URL
  const currentProject = params.name
    ? projects.find((p) => p.name === params.name) || null
    : null;

  // Get API configuration
  const apiKey = process.env.NEXT_PUBLIC_PY_API_SECRET || "";
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <>
      <GlobalFileDropHandler
        apiKey={apiKey}
        baseUrl={baseUrl}
        currentProject={currentProject}
        organizationId={organizationId}
        projects={projects}
      />
      <ToastContainer onRemoveToast={removeToast} toasts={toasts} />
    </>
  );
}
