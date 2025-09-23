/** biome-ignore-all lint/performance/noNamespaceImport: <> */
import * as v from "valibot";
import { MAX_PROJECT_NAME_LENGTH, MIN_PROJECT_NAME_LENGTH } from "@/constants";

export const projectSchema = v.object({
  name: v.pipe(
    v.string(),
    v.nonEmpty("Required"),
    v.maxLength(
      MAX_PROJECT_NAME_LENGTH,
      `Too long, must be at most ${MAX_PROJECT_NAME_LENGTH} characters`
    ),
    v.minLength(
      MIN_PROJECT_NAME_LENGTH,
      `Too short, must be at least ${MIN_PROJECT_NAME_LENGTH} characters`
    )
  ),
  color: v.pipe(v.string(), v.nonEmpty("Required")),
});

export type TProjectSchema = v.InferOutput<typeof projectSchema>;
