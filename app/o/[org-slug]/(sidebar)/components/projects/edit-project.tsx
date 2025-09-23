"use client";

import { useField, useForm } from "@tanstack/react-form";
import { hex2oklch, isHex, oklch2hex } from "colorizr";
import { FolderCode } from "lucide-react";
import { useMemo, useState } from "react";
import { safeParse } from "valibot";
import { FieldInfo } from "@/app/new/components/form";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/animate-ui/components/radix/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { PRESET_PROJECT_COLORS } from "@/constants";
import { fetchClient } from "@/lib/fetch-client";
import type { Project } from "@/types";
import { projectSchema, type TProjectSchema } from "@/validators/projects";

// Declare regex literals at top level (performance + lint rule)
const WS = /\s+/;

async function updateProject(projectId: string, value: TProjectSchema) {
  const response = await fetchClient(`/py-api/projects/${projectId}`, {
    method: "PUT",
    body: JSON.stringify({
      name: value.name,
      color: value.color,
    }),
  });

  if (!response.ok) {
    return {
      fields: {
        name: "Can't update project. Try a different name or color.",
      },
    } as const;
  }

  return (await response.json()) as Project;
}

export function EditProjectModal({
  project,
  open,
  onOpenChange,
  onSuccess,
}: {
  onOpenChange: (open: boolean) => void;
  onSuccess?: (project: Project) => void;
  open: boolean;
  project: Project;
}) {
  const [lStr = "0", cStr = "0", hStr = "0"] = (project.color ?? "")
    .trim()
    .split(WS);
  const initialHex = oklch2hex({
    l: Number(lStr),
    c: Number(cStr),
    h: Number(hStr),
  });

  const [selectedColor, setSelectedColor] = useState<string>(() => initialHex);

  const { l, c, h } = useMemo(() => hex2oklch(selectedColor), [selectedColor]);

  const form = useForm({
    validators: {
      onChange: projectSchema,
      onSubmitAsync: async ({ value }) => {
        const response = await updateProject(project.id, {
          ...value,
          color: `${l} ${c} ${h}`,
        });

        if ("fields" in (response as unknown as Record<string, unknown>)) {
          return response as { fields: { name: string } };
        }

        onOpenChange(false);
        onSuccess?.(response as Project);
      },
    },
    asyncDebounceMs: 500,
    defaultValues: {
      name: project.name,
      color: `${l} ${c} ${h}`,
    },
  });

  const nameField = useField({
    form,
    name: "name",
  });

  return (
    <Dialog modal onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>
            Update your project's name and color.
          </DialogDescription>
        </DialogHeader>

        <form
          id="project-form"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <div className="flex h-9 items-center gap-2 border-t border-b p-1">
            <ProjectColorPicker
              selectedColor={selectedColor}
              setSelectedColor={setSelectedColor}
            />

            <Separator orientation="vertical" />

            <div className="flex-1">
              <form.Field
                listeners={{
                  onChange: ({ value }) => {
                    const newValue = safeParse(
                      projectSchema.entries.name,
                      value
                    );
                    form.setFieldValue(
                      "name",
                      (newValue.output as string) ?? ""
                    );
                  },
                }}
                name="name"
              >
                {(field) => (
                  <Input
                    autoComplete="off"
                    className="!bg-transparent w-full border-0 p-0 focus-visible:border-0 focus-visible:outline-none focus-visible:ring-0"
                    id={field.name}
                    inputMode="text"
                    maxLength={20}
                    minLength={3}
                    name={field.name}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Enter project name"
                    required
                    value={field.state.value}
                  />
                )}
              </form.Field>
            </div>
          </div>

          <form.Subscribe>
            {(state) => (
              <>
                <FieldInfo field={nameField} />

                <Button
                  className="mt-4 w-full"
                  disabled={!state.canSubmit || state.isSubmitting}
                  form="project-form"
                  size="sm"
                  type="submit"
                >
                  {state.isSubmitting ? "Updating Project" : "Update Project"}
                </Button>
              </>
            )}
          </form.Subscribe>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ProjectColorPicker({
  selectedColor,
  setSelectedColor,
}: {
  setSelectedColor: (color: string) => void;
  selectedColor: string;
}) {
  const { l, c, h } = hex2oklch(selectedColor);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        asChild
        className="flex aspect-square h-full w-auto items-center justify-center rounded-sm bg-[color:var(--project-color-bg)] text-[var(--project-color)]"
        style={
          {
            "--project-color": `oklch(${l} ${c} ${h})`,
            "--project-color-bg": `oklch(${l} ${c} ${h} / 0.2)`,
          } as React.CSSProperties
        }
      >
        <button type="button">
          <FolderCode className="size-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48 p-2" sideOffset={4}>
        <Input
          className="mb-2 w-full text-sm"
          id="dropdown-color-hex"
          onChange={(e) => {
            let value = e.target.value.trim();

            if (!value) {
              setSelectedColor(PRESET_PROJECT_COLORS[0]);
              return;
            }

            if (!value.startsWith("#")) {
              value = `#${value}`;
            }

            const isHexValid = isHex(value);

            if (isHexValid) {
              setSelectedColor(value);
            }
          }}
          placeholder="#FFFFFF"
          type="text"
        />
        <div className="grid grid-cols-[repeat(auto-fill,minmax(1.5rem,1fr))] gap-2">
          {PRESET_PROJECT_COLORS.map((color) => (
            <button
              className="h-6 w-6 rounded-sm"
              key={color}
              onClick={() => setSelectedColor(color)}
              style={{ backgroundColor: color } as React.CSSProperties}
              type="button"
            />
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
