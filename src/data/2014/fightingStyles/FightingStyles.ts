import { FeatureChoiceOption } from "@/interfaces/CharacterClass";

/**
 * The six 2014 (PHB) Fighting Style options, verified against 5etools'
 * class-fighter.json (PHB source). Every class that grants "Fighting Style"
 * (Fighter, Paladin, Ranger) picks from a SUBSET of these - see
 * FIGHTER_FIGHTING_STYLES/PALADIN_FIGHTING_STYLES/RANGER_FIGHTING_STYLES
 * below, which match each class's own flavor text rather than repeating
 * this full list on every class.
 *
 * `fightingStyleEffect` is only set on the styles this app actually folds
 * into a real stat - see that interface's header comment
 * (interfaces/CharacterClass.ts) for which ones, and why the rest (Great
 * Weapon Fighting's reroll, Protection's reaction) stay descriptive-only.
 */
export const FIGHTING_STYLES_2014: FeatureChoiceOption[] = [
  {
    id: "archery",
    label: "Archery",
    summary: "You gain a +2 bonus to attack rolls you make with ranged weapons.",
    fightingStyleEffect: { styleName: "Archery", rangedAttackRollBonus: 2 },
  },
  {
    id: "defense",
    label: "Defense",
    summary: "While you are wearing armor, you gain a +1 bonus to AC.",
    fightingStyleEffect: { styleName: "Defense", armorClassBonusWhileArmored: 1 },
  },
  {
    id: "dueling",
    label: "Dueling",
    summary: "When you are wielding a melee weapon in one hand and no other weapons, you gain a +2 bonus to damage rolls with that weapon.",
    fightingStyleEffect: { styleName: "Dueling", meleeOneHandedDamageBonus: 2 },
  },
  {
    id: "greatWeaponFighting",
    label: "Great Weapon Fighting",
    summary:
      "When you roll a 1 or 2 on a damage die for an attack you make with a melee weapon that you are wielding with two hands, you can reroll the die and must use the new roll, even if the new roll is a 1 or a 2. The weapon must have the two-handed or versatile property for you to gain this benefit. Not modeled mechanically here (dice-reroll effect).",
  },
  {
    id: "protection",
    label: "Protection",
    summary:
      "When a creature you can see attacks a target other than you that is within 5 feet of you, you can use your reaction to impose disadvantage on the attack roll. You must be wielding a shield. Not modeled mechanically here (reaction).",
  },
  {
    id: "twoWeaponFighting",
    label: "Two-Weapon Fighting",
    summary:
      "When you engage in two-weapon fighting, you can add your ability modifier to the damage of the second attack. Not modeled mechanically here (off-hand attack bonus).",
  },
];

function stylesByIds(ids: string[]): FeatureChoiceOption[] {
  return ids.map((id) => FIGHTING_STYLES_2014.find((style) => style.id === id)!);
}

/** Fighter (2014): "such as Archery, Defense, Dueling, Great Weapon Fighting, Protection, or Two-Weapon Fighting" - all six. */
export const FIGHTER_FIGHTING_STYLES_2014 = FIGHTING_STYLES_2014;

/** Paladin (2014): "such as Defense, Dueling, Great Weapon Fighting, or Protection". */
export const PALADIN_FIGHTING_STYLES_2014 = stylesByIds(["defense", "dueling", "greatWeaponFighting", "protection"]);

/** Ranger (2014): "such as Archery, Defense, Dueling, or Two-Weapon Fighting". */
export const RANGER_FIGHTING_STYLES_2014 = stylesByIds(["archery", "defense", "dueling", "twoWeaponFighting"]);
