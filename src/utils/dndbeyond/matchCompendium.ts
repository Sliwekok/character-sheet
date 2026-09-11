import { normalizeName } from "./textUtils";

/**
 * Finds `targetName` in `items` by `.name` - exact match first, then a
 * normalized (lowercase, punctuation-insensitive) match as a fallback, e.g.
 * D&D Beyond's "Fighter" vs this app's "Fighter" (should always agree, but
 * this absorbs the odd casing/whitespace difference without failing an
 * otherwise-good match). Returns `undefined` (not a throw) when nothing
 * matches - every caller in convert.ts treats that as "couldn't import this
 * one item" and records a warning, never as a fatal error for the whole
 * character.
 */
export function findByName<T extends { name: string }>(items: T[], targetName: string | null | undefined): T | undefined {
  if (!targetName) return undefined;

  const exact = items.find((item) => item.name === targetName);
  if (exact) return exact;

  const normalizedTarget = normalizeName(targetName);
  return items.find((item) => normalizeName(item.name) === normalizedTarget);
}
