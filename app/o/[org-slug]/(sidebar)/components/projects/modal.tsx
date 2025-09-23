"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { use } from "react";
import {
  EDIT_PROJECT_MODAL_KEY,
  NEW_PROJECT_MODAL_KEY,
  NEW_PROJECT_MODAL_VALUE,
} from "@/constants";
import type { Project } from "@/types";
import { CreateProjectModal } from "./create-project";
import { EditProjectModal } from "./edit-project";

export const NewProjectModal = ({
  projects: _projects,
}: {
  projects: Promise<Project[]>;
}) => {
  const router = useRouter();
  const params = useSearchParams();
  const dynamicParams = useParams<{ "org-slug": string; name?: string }>();

  const newProjectParam = params.get(NEW_PROJECT_MODAL_KEY);
  const isNewProjectParamValid = newProjectParam === NEW_PROJECT_MODAL_VALUE;

  const editProjectParam = params.get(EDIT_PROJECT_MODAL_KEY);
  const projects = use(_projects);
  const projectToEdit = projects.find((p) => p.id === editProjectParam);
  const isEditProjectParamValid = Boolean(projectToEdit);

  const isValid = isNewProjectParamValid || isEditProjectParamValid;

  const onOpenChange = (open: boolean) => {
    if (!open) {
      const newParams = new URLSearchParams(params.toString());
      newParams.delete(NEW_PROJECT_MODAL_KEY);
      newParams.delete(EDIT_PROJECT_MODAL_KEY);
      router.replace(`?${newParams.toString()}`);
    }
  };

  const onSuccess = (proj: Project) => {
    // If currently viewing the same project path, force a navigation to new slug
    if (projects.find((p) => p.name === dynamicParams?.name)?.id === proj.id) {
      document.location.href = `/o/${dynamicParams["org-slug"]}/p/${proj.name}`;
      return;
    }
    router.refresh();
  };

  if (!isValid) {
    return null;
  }

  if (isEditProjectParamValid && projectToEdit) {
    return (
      <EditProjectModal
        onOpenChange={onOpenChange}
        onSuccess={onSuccess}
        open
        project={projectToEdit}
      />
    );
  }

  return (
    <CreateProjectModal
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
      open
    />
  );
};
