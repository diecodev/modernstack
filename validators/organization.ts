/** biome-ignore-all lint/performance/noNamespaceImport: <> */
import * as v from "valibot";
import {
  MAX_ORGANIZATION_NAME_LENGTH,
  MIN_ORGANIZATION_NAME_LENGTH,
} from "@/constants";

export const organizationSchema = v.object({
  name: v.pipe(
    v.string(),
    v.nonEmpty("Required"),
    v.maxLength(
      MAX_ORGANIZATION_NAME_LENGTH,
      `Too long, must be at most ${MAX_ORGANIZATION_NAME_LENGTH} characters`
    ),
    v.minLength(
      MIN_ORGANIZATION_NAME_LENGTH,
      `Too short, must be at least ${MIN_ORGANIZATION_NAME_LENGTH} characters`
    )
  ),
  slug: v.pipe(
    v.string(),
    v.nonEmpty("Required"),
    v.toLowerCase(),
    v.transform((value) => value.replace(/\s+/g, "-")),
    v.maxLength(
      MAX_ORGANIZATION_NAME_LENGTH,
      `Too long, must be at most ${MAX_ORGANIZATION_NAME_LENGTH} characters`
    ),
    v.minLength(
      MIN_ORGANIZATION_NAME_LENGTH,
      `Too short, must be at least ${MIN_ORGANIZATION_NAME_LENGTH} characters`
    ),
    v.trim(),
    v.regex(
      /^[a-z0-9-]+$/,
      "Invalid format, can only contain letters, numbers, and dashes"
    )
  ),
});

export type TOrganizationSchema = v.InferOutput<typeof organizationSchema>;
