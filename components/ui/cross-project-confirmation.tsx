"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Project } from "@/types";

type CrossProjectConfirmationProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  targetProject: Project;
  currentProject: Project;
  filename: string;
};

export function CrossProjectConfirmation({
  isOpen,
  onClose,
  onConfirm,
  targetProject,
  currentProject,
  filename,
}: CrossProjectConfirmationProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Dialog onOpenChange={onClose} open={isOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            Confirm Project Switch
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/20">
            <p className="text-sm">
              You are currently in{" "}
              <span className="font-semibold">{currentProject.name}</span> but
              dropped the file on{" "}
              <span className="font-semibold">{targetProject.name}</span>.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-muted-foreground text-sm">
              <span className="font-medium">{filename}</span> will be uploaded
              to:
            </p>

            <div className="rounded-lg border bg-muted/50 p-3">
              <div className="flex items-center gap-3">
                <div
                  className="h-4 w-4 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: targetProject.color }}
                />
                <div>
                  <div className="font-medium">{targetProject.name}</div>
                  <div className="text-muted-foreground text-xs">
                    Target Project
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p className="text-muted-foreground text-sm">
            Are you sure you want to proceed with this upload?
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button
            className="bg-amber-600 hover:bg-amber-700"
            onClick={handleConfirm}
          >
            Yes, Upload to {targetProject.name}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
