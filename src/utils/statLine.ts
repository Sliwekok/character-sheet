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

/**
 * Formats a number as the "+ N" / "- N" continuation of a running equation
 * string, e.g. `` `${base} ${formatEquationTerm(term)} = ${total}` `` ->
 * "8 + 2 = 10" or "8 - 3 = 5".
 *
 * Deliberately NOT the same as writing `+ ${formatSigned(term)}` - that
 * doubles the sign for any non-negative term, since `formatSigned` already
 * prefixes its own "+" (e.g. "8 + +2 = 10", the exact artifact this was
 * added to fix). `formatSigned` is for a modifier shown standalone (not
 * part of an "a + b = c" string); this is for a term being appended onto
 * one - use whichever matches how the value is actually displayed.
 */
export function formatEquationTerm(value: number): string {
  return `${value >= 0 ? "+" : "-"} ${Math.abs(value)}`;
}
