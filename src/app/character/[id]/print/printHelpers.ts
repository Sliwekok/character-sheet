import { AbilityScores, Character } from "@/interfaces/Characters";
import { SkillName, SKILL_ABILITIES } from "@/interfaces/Skill";
import { Spell } from "@/interfaces/Spell";
import { AbilityModifiers } from "@/utils/abilityModifiers";

/** Skills in the same fixed order the official sheet lists them (alphabetical). */
export const SKILL_LIST: SkillName[] = [
  "Acrobatics",
  "Animal Handling",
  "Arcana",
  "Athletics",
  "Deception",
  "History",
  "Insight",
  "Intimidation",
  "Investigation",
  "Medicine",
  "Nature",
  "Perception",
  "Performance",
  "Persuasion",
  "Religion",
  "Sleight of Hand",
  "Stealth",
  "Survival",
];

export const ABILITY_ORDER: (keyof AbilityScores)[] = [
  "strength",
  "dexterity",
  "constitution",
  "intelligence",
  "wisdom",
  "charisma",
];

export const ABILITY_SHORT: Record<keyof AbilityScores, string> = {
  strength: "Strength",
  dexterity: "Dexterity",
  constitution: "Constitution",
  intelligence: "Intelligence",
  wisdom: "Wisdom",
  charisma: "Charisma",
};

export function formatMod(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

export function isProficientInSkill(character: Character, skill: SkillName): boolean {
  return character.skillProficiencies.includes(skill);
}

export function skillModifier(
  character: Character,
  skill: SkillName,
  modifiers: AbilityModifiers,
  proficiencyBonus: number
): number {
  const ability = SKILL_ABILITIES[skill];
  return modifiers[ability] + (isProficientInSkill(character, skill) ? proficiencyBonus : 0);
}

export function isProficientInSave(character: Character, ability: keyof AbilityScores): boolean {
  return character.savingThrowProficiencies.includes(ability);
}

export function saveModifier(
  character: Character,
  ability: keyof AbilityScores,
  modifiers: AbilityModifiers,
  proficiencyBonus: number
): number {
  return modifiers[ability] + (isProficientInSave(character, ability) ? proficiencyBonus : 0);
}

/** e.g. "3d8" for a single-class level-3 Fighter, "3d8 + 2d6" once multiclassed. */
export function hitDiceLabel(character: Character): string {
  return character.classes.map((entry) => `${entry.level}d${entry.class.hitDie}`).join(" + ");
}

export function classAndLevelLabel(character: Character): string {
  return character.classes
    .map((entry) => `${entry.class.name}${entry.subclass ? ` (${entry.subclass.name})` : ""} ${entry.level}`)
    .join(" / ");
}

/** Groups+sorts spellsKnown for the spellcasting sheet's per-level columns (0 = cantrips). */
export function groupSpellsByLevel(spells: Spell[]): Map<number, Spell[]> {
  const groups = new Map<number, Spell[]>();
  for (const spell of spells) {
    const group = groups.get(spell.level) ?? [];
    group.push(spell);
    groups.set(spell.level, group);
  }
  for (const group of groups.values()) group.sort((a, b) => a.name.localeCompare(b.name));
  return groups;
}

/** The class this character casts spells through for spell save DC/attack bonus purposes - the first class entry with a `spellcasting` block. Doesn't account for a subclass-granted override (Eldritch Knight/Arcane Trickster use their base class's ability regardless), matching how those subclasses actually work. */
export function primarySpellcastingEntry(character: Character) {
  return character.classes.find((entry) => entry.class.spellcasting);
}

/** Whether the character casts spells at all - any class/subclass with a non-'none' progression, or any spell already picked. Drives whether the print view includes the spellcasting sheet at all. */
export function isSpellcaster(character: Character): boolean {
  return (
    character.classes.some(
      (entry) => entry.class.casterProgression !== "none" || entry.subclass?.casterProgressionOverride
    ) || character.spellsKnown.length > 0
  );
}
