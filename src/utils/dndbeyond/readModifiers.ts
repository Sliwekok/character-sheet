import type { DdbGrantedModifier, DdbModifierGroups } from "./types";
import type { AbilityScores } from "@/interfaces/Characters";
import type { SkillName } from "@/interfaces/Skill";

/**
 * Best-effort reading of D&D Beyond's `modifiers` grouping (race/class/
 * background/feat/item/condition -> a flat list of grants). This project
 * never got to confirm that shape against a live character during
 * development (see types.ts's header comment and README.md's "Best
 * effort" section) - every function here is written to degrade to "found
 * nothing" rather than throw when the real shape turns out to differ from
 * what's assumed below, so a schema surprise costs you an accurate
 * skill/ability-bonus list, never a crashed import.
 */

const ABILITY_SUBTYPE_TO_KEY: Record<string, keyof AbilityScores> = {
  "strength-score": "strength",
  "dexterity-score": "dexterity",
  "constitution-score": "constitution",
  "intelligence-score": "intelligence",
  "wisdom-score": "wisdom",
  "charisma-score": "charisma",
};

const SKILL_SUBTYPE_TO_NAME: Record<string, SkillName> = {
  acrobatics: "Acrobatics",
  "animal-handling": "Animal Handling",
  arcana: "Arcana",
  athletics: "Athletics",
  deception: "Deception",
  history: "History",
  insight: "Insight",
  intimidation: "Intimidation",
  investigation: "Investigation",
  medicine: "Medicine",
  nature: "Nature",
  perception: "Perception",
  performance: "Performance",
  persuasion: "Persuasion",
  religion: "Religion",
  "sleight-of-hand": "Sleight of Hand",
  stealth: "Stealth",
  survival: "Survival",
};

/** True for anything shaped enough like `DdbGrantedModifier[]` to iterate safely. */
function isModifierArray(value: unknown): value is DdbGrantedModifier[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "object" && entry !== null);
}

/** Every modifier across every group in `modifiers` (or only the named `groups`), flattened - or `[]` if `modifiers` is missing/an unexpected shape. */
function allModifiers(modifiers: DdbModifierGroups | undefined, groups?: string[]): DdbGrantedModifier[] {
  if (!modifiers || typeof modifiers !== "object") return [];

  return Object.entries(modifiers)
    .filter(([group]) => !groups || groups.includes(group))
    .map(([, entries]) => entries)
    .filter(isModifierArray)
    .flat();
}

/**
 * The `modifiers` groups whose ability-score bonuses count toward the
 * character's permanent scores: racial bonuses, class ASIs (2014), the 2024
 * background allocation, and feats (2024 ASIs are feats on D&D Beyond).
 * `item` and `condition` are left out on purpose - magic items are handled
 * separately by this app and conditions are temporary.
 */
export const PERMANENT_ABILITY_BONUS_GROUPS = ["race", "class", "background", "feat"];

/**
 * Flat ability-score bonuses granted outside the character's base `stats`
 * - keyed by ability, summed if more than one source grants the same
 * ability. Pass `groups` to only count certain sources (see
 * `PERMANENT_ABILITY_BONUS_GROUPS`).
 *
 * The result is summed and UNATTRIBUTED (no way to tell which bonus came
 * from which ASI slot), so it must never be baked straight into the final
 * scores. convert.ts only uses it to work out the character's TARGET
 * totals; reconcileAbilityScores.ts then turns the gap between that target
 * and what this app shows into explicit background/ASI bookkeeping, and
 * only that bookkeeping is added to the scores - see utils/characterDraft.ts
 * for why the two must always match.
 */
export function readAbilityScoreBonuses(
  modifiers: DdbModifierGroups | undefined,
  groups?: string[],
): Partial<AbilityScores> {
  const bonuses: Partial<AbilityScores> = {};

  for (const modifier of allModifiers(modifiers, groups)) {
    if (modifier.type !== "bonus" || !modifier.subType) continue;
    const key = ABILITY_SUBTYPE_TO_KEY[modifier.subType];
    if (!key) continue;

    const amount = modifier.value ?? modifier.fixedValue ?? 0;
    if (!amount) continue;

    bonuses[key] = (bonuses[key] ?? 0) + amount;
  }

  return bonuses;
}

/** Every skill the character is proficient in, per `modifiers` grants (class/background/race/feat picks alike - D&D Beyond doesn't distinguish the source once granted). `[]` if nothing could be read. */
export function readSkillProficiencies(modifiers: DdbModifierGroups | undefined): SkillName[] {
  const skills = new Set<SkillName>();

  for (const modifier of allModifiers(modifiers)) {
    if (modifier.type !== "proficiency" || !modifier.subType) continue;
    const skill = SKILL_SUBTYPE_TO_NAME[modifier.subType];
    if (skill) skills.add(skill);
  }

  return Array.from(skills);
}

/** True when `modifiers` was present and at least structurally readable (whether or not it actually granted anything) - lets convert.ts tell "genuinely no proficiencies/bonuses" apart from "couldn't read this at all" for its warnings. */
export function hasReadableModifiers(modifiers: DdbModifierGroups | undefined): boolean {
  return !!modifiers && typeof modifiers === "object" && Object.values(modifiers).some(isModifierArray);
}
