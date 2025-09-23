import type { LinkRestProps } from "next/link";
import Link from "next/link";
import type { ParamMap } from "@/.next/types/routes";

type _Href = keyof ParamMap;

// If the ParamMap entry is an empty object, params is omitted; otherwise required.
export type TypedLinkProps<H extends _Href = _Href> = LinkRestProps &
  (ParamMap[H] extends Record<string, never>
    ? { href: H; params?: undefined }
    : { href: H; params: ParamMap[H] });

// Precompiled regex for performance & lint compliance
// Allow hyphens and underscores in param names to match folder segments
const dynamicSegmentRegex = /\[(\.{3})?([A-Za-z0-9_-]+)\]/g;
const unresolvedBracketsRegex = /\[|\]/;

function buildDynamicHref<H extends _Href>(
  pattern: H,
  params: ParamMap[H]
): string {
  if (!params || Object.keys(params as object).length === 0) {
    return pattern as string;
  }
  const missing: string[] = [];
  const result = (pattern as string).replace(
    dynamicSegmentRegex,
    (match, dots: string | undefined, name: string) => {
      const value = resolveParam(params as Record<string, unknown>, name);
      if (dots) {
        if (!Array.isArray(value)) {
          throw new Error(
            `Expected catch-all param "${name}" to be string[] for route ${pattern}`
          );
        }
        if (value.length === 0) {
          missing.push(name);
          return match;
        }
        return value.map((v) => encodeURIComponent(String(v))).join("/");
      }
      if (value == null || Array.isArray(value)) {
        missing.push(name);
        return match;
      }
      return encodeURIComponent(String(value));
    }
  );
  if (missing.length > 0) {
    throw new Error(
      `Missing required route param(s): ${missing.join(", ")} for pattern ${pattern}`
    );
  }
  if (unresolvedBracketsRegex.test(result)) {
    throw new Error(
      `Unresolved dynamic segment(s) remain in built href: ${result}`
    );
  }
  return result;
}

// Additional regex constants at top-level per lint rules
const WORD_SPLIT_RE = /[-_]/;
const CAMEL_BOUNDARY_RE = /([a-z0-9])([A-Z])/g;

// Naming helpers to bridge camelCase, kebab-case, and snake_case param keys
function toCamel(input: string): string {
  return input
    .split(WORD_SPLIT_RE)
    .map((part, idx) =>
      idx === 0
        ? part.toLowerCase()
        : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
    )
    .join("");
}

function toSnake(input: string): string {
  const withUnderscore = input.replace(/-/g, "_");
  return withUnderscore.replace(CAMEL_BOUNDARY_RE, "$1_$2").toLowerCase();
}

function toKebab(input: string): string {
  const withDash = input.replace(/_/g, "-");
  return withDash.replace(CAMEL_BOUNDARY_RE, "$1-$2").toLowerCase();
}

function resolveParam(
  paramMap: Record<string, unknown>,
  name: string
): unknown {
  // Try exact first
  if (Object.hasOwn(paramMap, name)) {
    return paramMap[name];
  }
  // Try common variants
  const variants = new Set<string>([
    name,
    name.replace(/-/g, "_"),
    name.replace(/_/g, "-"),
    toCamel(name),
    toSnake(name),
    toKebab(name),
    toSnake(toCamel(name)),
    toKebab(toCamel(name)),
  ]);
  for (const key of variants) {
    if (Object.hasOwn(paramMap, key)) {
      return paramMap[key];
    }
  }
  return;
}
/**
 * TypedLink is a type-safe wrapper around Next.js's Link component.
 * It enforces route param correctness using your project's ParamMap type.
 *
 * ## Usage
 * - For static routes (no params): pass `href` as the route key.
 * - For dynamic routes: pass `href` and a `params` object matching the route's param shape.
 *
 * Example:
 * ```tsx
 * // Static route
 * <TypedLink href="/about" />
 *
 * // Dynamic route (e.g. /user/[id])
 * <TypedLink href="/user/[id]" params={{ id: "123" }} />
 *
 * // Catch-all route (e.g. /blog/[...slug])
 * <TypedLink href="/blog/[...slug]" params={{ slug: ["2025", "pricing"] }} />
 * ```
 *
 * This component automatically builds the correct href string and throws
 * if required params are missing or malformed.
 *
 * See also: useRouter custom implementation for programmatic navigation with type safety.
 */
export function TypedLink<H extends _Href>(props: TypedLinkProps<H>) {
  const { href, params, ...rest } = props as TypedLinkProps<_Href> & {
    href: H;
  };
  const built: string = ((): string => {
    if (params !== undefined) {
      return buildDynamicHref(href as H, params as ParamMap[H]);
    }
    return href as string;
  })();
  return <Link href={built as never} {...rest} />;
}
