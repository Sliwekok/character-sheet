/**
 * Which part of a turn a spell takes to cast, derived from its free-text
 * `castingTime`. The compendium uses "Action" / "Bonus" / "Reaction" /
 * "1 Min." etc., while imported or custom spells may say "1 action",
 * "1 bonus action" or "1 reaction, which you take when..." - matching is
 * case-insensitive and checks "bonus" and "reaction" before plain "action".
 * Anything longer (minutes/hours) is "other".
 */
export type SpellActionType = "action" | "bonus" | "reaction" | "other";

/** The Spells tab's casting-time filter - "all" shows every spell. */
export type SpellActionFilter = "all" | Exclude<SpellActionType, "other">;

export const SPELL_ACTION_FILTERS: { key: SpellActionFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "action", label: "Action" },
  { key: "bonus", label: "Bonus action" },
  { key: "reaction", label: "Reaction" },
];

export function getSpellActionType(castingTime: string | undefined): SpellActionType {
  const text = (castingTime ?? "").toLowerCase();
  if (text.includes("bonus")) return "bonus";
  if (text.includes("reaction")) return "reaction";
  if (text.includes("action")) return "action";
  return "other";
}

export function matchesSpellActionFilter(castingTime: string | undefined, filter: SpellActionFilter): boolean {
  return filter === "all" || getSpellActionType(castingTime) === filter;
}
