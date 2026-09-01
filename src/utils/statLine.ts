/**
 * One label/value row shown inside an info Tooltip - the shared shape for
 * every "how was this number computed" breakdown in the app (ability
 * scores, AC, HP, initiative, weapon attacks/damage, spellcasting).
 */
export type StatLine = { label: string; value: string };

/**
 * Formats a signed number, e.g. 2 -> "+2", -1 -> "-1", 0 -> "+0". Same
 * convention as `formatModifier` in components/ui/StatBlock.tsx, duplicated
 * here (rather than imported) so utils/ stays UI-agnostic - see
 * docs/architecture.md's folder layout note that utils/ derives stats from
 * a Character with no rendering concerns.
 */
export function formatSigned(value: number): string {
  return value >= 0 ? `+${value}` : `${value}`;
}
