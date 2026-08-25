type ClassValue = string | number | null | boolean | undefined;

/**
 * Tiny classnames joiner - filters out falsy values and joins the rest.
 * Kept dependency-free on purpose (no clsx/tailwind-merge) since class
 * lists in this project don't need conflict resolution, just composition.
 */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}
