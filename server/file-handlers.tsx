"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { PdfIcon } from "@/components/icons/pdf";
import { authClient } from "../utils/auth-client";

const KILOBYTE = 1024; // base unit
const ONE_MB_BYTES = KILOBYTE * KILOBYTE; // 1MB in bytes
const TEN_MB_BYTES = 10 * ONE_MB_BYTES; // 10MB in bytes
const MAX_FILE_SIZE_BYTES = TEN_MB_BYTES; // 10MB limit per file
const MAX_UPLOAD_FILES = 12; // server-side constraint mirrored client-side
const PDF_MIME = "application/pdf";
const ENCRYPT_MARKER_REGEX = /\/Encrypt\b/; // top-level for performance
const PDF_HEAD_SLICE_KB = 256; // slice size in KB for encryption scan
const PDF_ENCRYPT_SLICE_BYTES = PDF_HEAD_SLICE_KB * KILOBYTE; // 256KB head slice
const FILE_CARD_PREVIEW_LIMIT = 4; // max attachment chips displayed before +N more indicator

async function isPdfEncrypted(file: File): Promise<boolean> {
  if (file.type !== PDF_MIME) {
    return false;
  }
  const head = await file.slice(0, PDF_ENCRYPT_SLICE_BYTES).text();
  return ENCRYPT_MARKER_REGEX.test(head);
}

export type UploadStatementsResponse = {
  status: string;
  message?: string;
};

function normalizeFiles(input: FileList | File[]): File[] {
  return Array.isArray(input) ? input : Array.from(input);
}

async function validateFiles(files: File[]): Promise<void> {
  if (files.length === 0) {
    throw new Error("You must select at least one file");
  }
  if (files.length > MAX_UPLOAD_FILES) {
    throw new Error(`A maximum of ${MAX_UPLOAD_FILES} files is allowed`);
  }
  const errors: string[] = [];
  for (const file of files) {
    if (file.type !== PDF_MIME) {
      errors.push(`${file.name}: only PDF files are allowed`);
      continue;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      errors.push(
        `${file.name}: exceeds 10MB (${(file.size / ONE_MB_BYTES).toFixed(2)}MB)`
      );
      continue;
    }
    // eslint-disable-next-line no-await-in-loop
    const encrypted = await isPdfEncrypted(file);
    if (encrypted) {
      errors.push(`${file.name}: the PDF is password protected`);
    }
  }
  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }
}

async function postFiles(
  projectId: string,
  files: File[]
): Promise<UploadStatementsResponse> {
  const session = await authClient.getSession();
  const formData = new FormData();
  for (const file of files) {
    formData.append("files", file, file.name);
  }
  const res = await fetch(`/py-api/projects/${projectId}/statements`, {
    method: "POST",
    body: formData,
    headers: {
      "x-api-key": process.env.NEXT_PUBLIC_PY_API_SECRET || "",
      "x-organization-id": session.data?.session.activeOrganizationId || "",
    },
  });

  if (!res.ok) {
    let message = "Failed to upload files";
    try {
      const data = await res.json();
      message = data.detail || data.message || message;
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(message);
  }

  const json = await res.json();
  return json;
}

export function useUploadFileHandler(projectId: string) {
  return useMutation<UploadStatementsResponse, Error, FileList | File[]>({
    mutationFn: async (rawFiles) => {
      const files = normalizeFiles(rawFiles);
      const fileNames = files.map((f) => f.name);
      const limitedNames = fileNames.slice(0, FILE_CARD_PREVIEW_LIMIT);
      const extraCount = fileNames.length - limitedNames.length;

      const promise = (async () => {
        await validateFiles(files);
        return postFiles(projectId, files);
      })();

      function splitName(full: string) {
        const lastDot = full.lastIndexOf(".");
        if (lastDot <= 0 || lastDot === full.length - 1) {
          return { base: full, ext: "" };
        }
        return { base: full.slice(0, lastDot), ext: full.slice(lastDot + 1) };
      }
      toast.promise(promise, {
        loading: (
          <div className="flex flex-col gap-1.5">
            <p className="font-medium text-sm">
              Uploading {files.length} file{files.length > 1 ? "s" : ""}...
            </p>
            <ul className="flex flex-wrap gap-2">
              {limitedNames.map((n) => {
                const { base, ext } = splitName(n);
                return (
                  <li
                    className="inline-flex items-center gap-1 rounded-md border px-2 py-1 font-medium text-[10px]"
                    key={n}
                    title={n}
                  >
                    <PdfIcon className="size-3" />
                    <span className="max-w-[110px] truncate">{base}</span>
                    {ext && <span className="opacity-70">.{ext}</span>}
                  </li>
                );
              })}
              {extraCount > 0 && (
                <li
                  className="inline-flex items-center gap-1 rounded-md border px-2 py-1 font-medium text-[10px]"
                  title={`+${extraCount} more files`}
                >
                  +{extraCount} more
                </li>
              )}
            </ul>
          </div>
        ),
        success: (data) =>
          data.status === "success"
            ? data.message || "Files uploaded successfully"
            : data.message || "Upload finished with warnings",
        error: (err) => {
          const message = err instanceof Error ? err.message : "Upload failed";
          const lines = message.split("\n");
          if (lines.length > 1) {
            return `Some files were rejected:\n- ${lines
              .map((l) => l.trim())
              .filter(Boolean)
              .join("\n- ")}`;
          }
          return lines[0] || "Upload failed";
        },
      });

      return await promise;
    },
  });
}
