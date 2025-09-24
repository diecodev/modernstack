"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CrossProjectConfirmation } from "@/components/ui/cross-project-confirmation";
import { ProjectSelectorDialog } from "@/components/ui/project-selector-dialog";
import { validatePDFFile } from "@/lib/file-validation";
import { useToasts } from "@/stores/toast-store";
import type { Project } from "@/types";

type GlobalFileDropHandlerProps = {
  projects: Project[];
  currentProject?: Project | null;
  organizationId: string;
  apiKey: string;
  baseUrl: string;
};

export function GlobalFileDropHandler({
  projects,
  currentProject,
  organizationId,
  apiKey,
  baseUrl,
}: GlobalFileDropHandlerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [showCrossProjectConfirmation, setShowCrossProjectConfirmation] =
    useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [targetProject, setTargetProject] = useState<Project | null>(null);

  const { addToast, updateToast, autoRemoveToast } = useToasts();
  const workerRef = useRef<Worker | null>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Initialize worker
  useEffect(() => {
    workerRef.current = new Worker("/upload-worker.js");

    workerRef.current.onmessage = (event) => {
      const { type, payload } = event.data;

      switch (type) {
        case "UPLOAD_PROGRESS":
          updateToast(payload.toastId, {
            status: payload.status,
            message: payload.message,
          });
          break;
        case "STATUS_UPDATE":
          updateToast(payload.toastId, {
            status: payload.status,
            message: payload.message,
          });
          if (payload.status === "completed" || payload.status === "failed") {
            autoRemoveToast(payload.toastId);
          }
          break;
        case "UPLOAD_ERROR":
          updateToast(payload.toastId, {
            status: "failed",
            message: payload.error,
          });
          autoRemoveToast(payload.toastId);
          break;
        default:
          console.warn("Unknown message type:", type);
          break;
      }
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, [updateToast, autoRemoveToast]);

  const startUpload = useCallback(
    (file: File, project: Project) => {
      const toastId = addToast(
        `Uploading ${file.name}...`,
        "pending",
        file.name
      );

      workerRef.current?.postMessage({
        type: "START_UPLOAD",
        payload: {
          file,
          projectId: project.id,
          organizationId,
          apiKey,
          baseUrl,
          toastId,
        },
      });
    },
    [addToast, organizationId, apiKey, baseUrl]
  );

  const handleFilesDrop = useCallback(
    async (files: File[], droppedProject?: Project | null) => {
      if (files.length > 1) {
        addToast("Only one file at a time is allowed", "failed");
        return;
      }

      const file = files[0];
      if (!file) return;

      try {
        const validation = await validatePDFFile(file);
        if (!validation.valid) {
          addToast(validation.error?.message || "Invalid file", "failed");
          return;
        }

        let projectToUse: Project | null = null;

        if (droppedProject) {
          if (currentProject && droppedProject.id !== currentProject.id) {
            setTargetProject(droppedProject);
            setPendingFile(file);
            setShowCrossProjectConfirmation(true);
            return;
          }
          projectToUse = droppedProject;
        } else if (currentProject) {
          projectToUse = currentProject;
        } else {
          setPendingFile(file);
          setShowProjectSelector(true);
          return;
        }

        if (projectToUse) {
          startUpload(file, projectToUse);
        }
      } catch (error) {
        addToast("Error validating file", "failed");
        console.error("File validation error:", error);
      }
    },
    [addToast, currentProject, startUpload]
  );

  // Global drag and drop handlers
  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      setDragCounter((prev) => prev + 1);

      if (e.dataTransfer?.types.includes("Files")) {
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      setDragCounter((prev) => {
        const newCounter = prev - 1;
        if (newCounter <= 0) {
          setIsDragging(false);
          return 0;
        }
        return newCounter;
      });
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      setIsDragging(false);
      setDragCounter(0);

      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;

      const dropTarget = e.target as HTMLElement;
      const projectElement = dropTarget.closest("[data-project-id]");
      const droppedProjectId = projectElement?.getAttribute("data-project-id");

      let targetProjectForDrop: Project | null = null;
      if (droppedProjectId) {
        targetProjectForDrop =
          projects.find((p) => p.id === droppedProjectId) || null;
      }

      await handleFilesDrop(Array.from(files), targetProjectForDrop);
    };

    document.addEventListener("dragenter", handleDragEnter);
    document.addEventListener("dragleave", handleDragLeave);
    document.addEventListener("dragover", handleDragOver);
    document.addEventListener("drop", handleDrop);

    return () => {
      document.removeEventListener("dragenter", handleDragEnter);
      document.removeEventListener("dragleave", handleDragLeave);
      document.removeEventListener("dragover", handleDragOver);
      document.removeEventListener("drop", handleDrop);
    };
  }, [projects, handleFilesDrop]);

  const handleProjectSelection = (project: Project) => {
    if (pendingFile) {
      startUpload(pendingFile, project);
      setPendingFile(null);
    }
    setShowProjectSelector(false);
  };

  const handleCrossProjectConfirmation = () => {
    if (pendingFile && targetProject) {
      startUpload(pendingFile, targetProject);
      setPendingFile(null);
      setTargetProject(null);
    }
  };

  return (
    <>
      {isDragging && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-blue-500/20 backdrop-blur-sm"
          ref={dropZoneRef}
          style={{ pointerEvents: "none" }}
        >
          <div className="max-w-md rounded-lg border-2 border-blue-500 border-dashed bg-background/90 p-8 text-center backdrop-blur-sm">
            <div className="mb-4 text-6xl">📄</div>
            <h3 className="mb-2 font-semibold text-lg">Drop PDF File Here</h3>
            <p className="text-muted-foreground text-sm">
              {currentProject
                ? `Upload to ${currentProject.name}`
                : "Choose a project to upload to"}
            </p>
          </div>
        </div>
      )}

      <ProjectSelectorDialog
        filename={pendingFile?.name || ""}
        isOpen={showProjectSelector}
        onClose={() => {
          setShowProjectSelector(false);
          setPendingFile(null);
        }}
        onSelectProject={handleProjectSelection}
        projects={projects}
      />

      {targetProject && currentProject && (
        <CrossProjectConfirmation
          currentProject={currentProject}
          filename={pendingFile?.name || ""}
          isOpen={showCrossProjectConfirmation}
          onClose={() => {
            setShowCrossProjectConfirmation(false);
            setPendingFile(null);
            setTargetProject(null);
          }}
          onConfirm={handleCrossProjectConfirmation}
          targetProject={targetProject}
        />
      )}
    </>
  );
}
