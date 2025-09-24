"use client";

import { FolderOpen } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Project } from "@/types";

type ProjectSelectorDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelectProject: (project: Project) => void;
  projects: Project[];
  filename: string;
};

export function ProjectSelectorDialog({
  isOpen,
  onClose,
  onSelectProject,
  projects,
  filename,
}: ProjectSelectorDialogProps) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const handleSelect = () => {
    if (selectedProject) {
      onSelectProject(selectedProject);
      onClose();
    }
  };

  return (
    <Dialog onOpenChange={onClose} open={isOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Select Project
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Choose a project to upload{" "}
            <span className="font-medium">{filename}</span>:
          </p>

          <div className="space-y-2">
            {projects.map((project) => (
              <motion.button
                className={`w-full rounded-lg border-2 p-3 text-left transition-colors ${
                  selectedProject?.id === project.id
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-border hover:border-blue-300 hover:bg-blue-500/5"
                }`}
                key={project.id}
                onClick={() => setSelectedProject(project)}
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-4 w-4 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: project.color }}
                  />
                  <div>
                    <div className="font-medium">{project.name}</div>
                    <div className="text-muted-foreground text-xs">
                      Created{" "}
                      {new Date(project.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          {projects.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">
              <FolderOpen className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>No projects available</p>
              <p className="text-sm">Create a project first to upload files</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            disabled={!selectedProject}
            onClick={handleSelect}
          >
            Upload to Project
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
