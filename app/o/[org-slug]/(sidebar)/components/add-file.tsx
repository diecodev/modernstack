"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useUploadFileHandler } from "@/server/file-handlers";

export function AddFile({ projectId }: { projectId: string }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const { mutate, isPending } = useUploadFileHandler(projectId);
  const [pendingNames, setPendingNames] = useState<string[]>([]);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target;
    if (files && files.length > 0) {
      mutate(files, {
        onSettled: () => {
          setPendingNames([]);
          e.target.value = "";
        },
      });
    }
  };

  return (
    <>
      <Button
        className="h-7 text-xs"
        disabled={isPending}
        onClick={() => fileInput.current?.click()}
        size="sm"
        variant="secondary"
      >
        <span>{isPending ? "Uploading..." : "Add file"}</span>
      </Button>
      <input
        accept="application/pdf"
        aria-hidden="true"
        className="hidden"
        multiple={true}
        onChange={onInputChange}
        ref={fileInput}
        tabIndex={-1}
        type="file"
      />
      {isPending && pendingNames.length > 0 && (
        <div className="rounded-md border p-2">
          <p className="mb-1 font-semibold text-xs">Uploading:</p>
          <ul className="list-disc space-y-0.5 pl-4 text-[11px]">
            {pendingNames.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
