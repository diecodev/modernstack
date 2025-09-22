import { useRouter as useNextRouter } from "next/navigation";
import type { ParamMap } from "@/.next/types/routes";

// Derive route types from Next.js generated ParamMap
type Href = keyof ParamMap;
type HrefsWithoutParams = {
  [K in Href]: ParamMap[K] extends Record<string, never> ? K : never;
}[Href];
type HrefsWithParams = Exclude<Href, HrefsWithoutParams>;

// Navigation options subset we support (mirrors next/navigation types we need)
type NavOptions = {
  readonly scroll?: boolean;
};

// Precompiled regex for performance & lint compliance
// Allow hyphens and underscores in param names
const dynamicSegmentRegex = /\[(\.\.\.)?([A-Za-z0-9_-]+)\]/g;
const unresolvedBracketsRegex = /\[|\]/;
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

function buildDynamicHref(
  pattern: string,
  params: Record<string, unknown> | undefined
): string {
  if (!params || Object.keys(params).length === 0) {
    return pattern;
  }
  const missing: string[] = [];
  const result = pattern.replace(
    dynamicSegmentRegex,
    (match, dots: string | undefined, name: string) => {
      const value = resolveParam(params, name);
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

// Overload sets for push / replace / prefetch
type PushWithParamsFn = {
  <H extends HrefsWithParams>(
    href: H,
    options: NavOptions & { readonly params: ParamMap[H] }
  ): void;
  (href: HrefsWithoutParams, options?: NavOptions): void;
};

type ReplaceWithParamsFn = {
  <H extends HrefsWithParams>(
    href: H,
    options: NavOptions & { readonly params: ParamMap[H] }
  ): void;
  (href: HrefsWithoutParams, options?: NavOptions): void;
};

type PrefetchWithParamsFn = {
  <H extends HrefsWithParams>(
    href: H,
    options: { readonly params: ParamMap[H] }
  ): Promise<void> | void;
  (href: HrefsWithoutParams, options?: undefined): Promise<void> | void;
};

export type TypedRouter = {
  push: PushWithParamsFn;
  replace: ReplaceWithParamsFn;
  prefetch: PrefetchWithParamsFn;
  back(): void;
  forward(): void;
  refresh(): void;
};

/**
 * ### useRouter but fully typed (tanstack router inspired):
 *
 * code example
 *
 * ```tsx
 * const router = useRouter();
 * router.replace('/o/[orgSlug]', {
 *   params: { orgSlug: 'my-org' },
 *   scroll: true
 * });
 * ```
 */
export function useTypedRouter(): TypedRouter {
  const r = useNextRouter();

  const push: PushWithParamsFn = (
    href: string,
    options?: NavOptions & { params?: Record<string, unknown> }
  ) => {
    const built = buildDynamicHref(href, options?.params);
    const { params: _ignore, ...nav } = options ?? {};
    r.push(built as never, nav);
  };

  const replace: ReplaceWithParamsFn = (
    href: string,
    options?: NavOptions & { params?: Record<string, unknown> }
  ) => {
    const built = buildDynamicHref(href, options?.params);
    const { params: _ignore, ...nav } = options ?? {};
    r.replace(built as never, nav);
  };

  const prefetch: PrefetchWithParamsFn = (
    href: string,
    options?: { params?: Record<string, unknown> }
  ) => {
    const built = buildDynamicHref(href, options?.params);
    return r.prefetch(built as never);
  };

  return {
    push,
    replace,
    prefetch,
    back: r.back,
    forward: r.forward,
    refresh: r.refresh,
  };
}
