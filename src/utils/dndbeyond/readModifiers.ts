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

/** Every modifier across every group in `modifiers`, flattened - or `[]` if `modifiers` is missing/an unexpected shape. */
function allModifiers(modifiers: DdbModifierGroups | undefined): DdbGrantedModifier[] {
  if (!modifiers || typeof modifiers !== "object") return [];

  return Object.values(modifiers)
    .filter(isModifierArray)
    .flat();
}

/**
 * Flat ability-score bonuses granted outside the character's base `stats`
 * (e.g. a feat's Ability Score Improvement, a magic item's set-value bonus)
 * - keyed by ability, summed if more than one source grants the same
 * ability.
 *
 * NOT currently called by convert.ts. This app tracks the 2024 background
 * allocation and each earned Ability Score Improvement as their own
 * bookkeeping, separate from the final ability scores, so a later edit can
 * subtract exactly what was added before re-adding it (see
 * utils/characterDraft.ts) - and this function has no way to tell which
 * ability bonus came from the background vs. which specific class-level
 * ASI slot vs. a magic item, so using its (summed, unattributed) result to
 * fill in either bookkeeping field risks recording a bonus that doesn't
 * match what's baked into the final ability scores. That mismatch is
 * exactly what let re-editing a previously-imported character double-apply
 * the bonus and come out overpowered - see convert.ts's ability-score
 * section and this folder's README. Left here (rather than deleted) in
 * case a future change finds a reliable way to attribute these to a
 * specific slot; don't wire it back into convert.ts's final ability scores
 * without also populating the matching bookkeeping field with the exact
 * same amount.
 */
export function readAbilityScoreBonuses(modifiers: DdbModifierGroups | undefined): Partial<AbilityScores> {
  const bonuses: Partial<AbilityScores> = {};

  for (const modifier of allModifiers(modifiers)) {
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

/** True when `modifiers` was present and at least structurally readable (whether or not it actually granted anything) - lets convert.ts tell "genuinely no proficiencies" apart from "couldn't read this at all" for its warnings. */
export function hasReadableModifiers(modifiers: DdbModifierGroups | undefined): boolean {
  return !!modifiers && typeof modifiers === "object" && Object.values(modifiers).some(isModifierArray);
}
