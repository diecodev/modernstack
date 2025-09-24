/** biome-ignore-all lint/a11y/noLabelWithoutControl: <> */
"use client";

import { useState } from "react";
import { Checkbox } from "@/components/animate-ui/components/base/checkbox";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fetchClient } from "@/lib/fetch-client";
import type { Project } from "@/types";

async function deleteProject(projectId: string) {
  const response = await fetchClient(`/py-api/projects/${projectId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Unable to delete project");
  }
}

export function RemoveProjectModal({
  open,
  onOpenChange,
  project,
  onSuccess,
}: {
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  open: boolean;
  project: Project;
}) {
  const [ack, setAck] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDelete = async () => {
    try {
      setLoading(true);
      setError(null);
      await deleteProject(project.id);
      onOpenChange(false);
      onSuccess?.();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog modal onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete project</DialogTitle>
          <DialogDescription>
            You are about to permanently delete “{project.name}” and all of its
            associated data. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 rounded-md border bg-muted/20 p-3 text-muted-foreground text-xs">
          <p>
            • All statements and files linked to this project will be removed.
          </p>
          <p>• This will not affect other projects in the organization.</p>
        </div>

        <label className="mt-4 flex items-start gap-2 text-sm">
          <Checkbox
            aria-label="I understand this action cannot be undone"
            checked={ack}
            onCheckedChange={setAck}
          />
          <span>
            I understand that this will permanently delete the project and all
            its data. This action cannot be undone.
          </span>
        </label>

        {error ? (
          <p className="mt-3 text-[0.8rem] text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <DialogFooter>
          <Button
            disabled={loading}
            onClick={() => onOpenChange(false)}
            size="sm"
            type="button"
            variant="secondary"
          >
            Cancel
          </Button>
          <Button
            aria-disabled={!ack || loading}
            disabled={!ack || loading}
            onClick={onDelete}
            size="sm"
            type="button"
            variant="destructive"
          >
            {loading ? "Deleting…" : "Delete project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default RemoveProjectModal;
