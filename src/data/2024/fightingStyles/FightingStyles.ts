import { Feat } from "@/interfaces/Feat";
import { FeatureChoiceOption, FightingStyleEffect } from "@/interfaces/CharacterClass";
import { FEATS_2024 } from "@/data/2024/feats/Feats";

/** Stable option ids, keyed by the feat's exact name in FEATS_2024. */
const ID_BY_FEAT_NAME: Record<string, string> = {
  Archery: "archery",
  "Blind Fighting": "blindFighting",
  Defense: "defense",
  Dueling: "dueling",
  "Great Weapon Fighting": "greatWeaponFighting",
  Interception: "interception",
  Protection: "protection",
  "Thrown Weapon Fighting": "thrownWeaponFighting",
  "Two-Weapon Fighting": "twoWeaponFighting",
  "Unarmed Fighting": "unarmedFighting",
};

/**
 * The mechanically-tracked benefit for each 2024 Fighting Style feat that
 * has one - see `FightingStyleEffect`'s header comment
 * (interfaces/CharacterClass.ts) for which ones stay descriptive-only.
 */
const EFFECT_BY_FEAT_NAME: Record<string, FightingStyleEffect> = {
  Archery: { styleName: "Archery", rangedAttackRollBonus: 2 },
  Defense: { styleName: "Defense", armorClassBonusWhileArmored: 1 },
  Dueling: { styleName: "Dueling", meleeOneHandedDamageBonus: 2 },
  "Thrown Weapon Fighting": { styleName: "Thrown Weapon Fighting", thrownWeaponDamageBonus: 2 },
};

function toOption(feat: Feat): FeatureChoiceOption {
  return {
    id: ID_BY_FEAT_NAME[feat.name] ?? feat.name,
    label: feat.name,
    summary: feat.description,
    fightingStyleEffect: EFFECT_BY_FEAT_NAME[feat.name],
  };
}

/**
 * The ten "combat" Fighting Style feats any Fighter/Paladin/Ranger's
 * "Fighting Style" feature can pick from in 2024 - i.e. every `category:
 * "fighting-style"` feat in FEATS_2024 EXCEPT the two class-restricted
 * spell-granting alternatives (Blessed Warrior, Druidic Warrior), which
 * each class's own feature offers as a separate, explicitly-named option
 * instead (see PALADIN_FIGHTING_STYLES_2024/RANGER_FIGHTING_STYLES_2024
 * below) since - unlike the ten here - they're gated to one specific class.
 */
export const COMBAT_FIGHTING_STYLES_2024: FeatureChoiceOption[] = Object.keys(ID_BY_FEAT_NAME)
  .map((name) => FEATS_2024.find((feat) => feat.category === "fighting-style" && feat.name === name))
  .filter((feat): feat is Feat => Boolean(feat))
  .map(toOption);

const BLESSED_WARRIOR_FEAT = FEATS_2024.find((feat) => feat.name === "Blessed Warrior");
const DRUIDIC_WARRIOR_FEAT = FEATS_2024.find((feat) => feat.name === "Druidic Warrior");

/** Fighter (2024): "You have honed your martial prowess and gain a Fighting Style feat of your choice." - any of the ten combat styles. */
export const FIGHTER_FIGHTING_STYLES_2024 = COMBAT_FIGHTING_STYLES_2024;

/** Paladin (2024): any combat style, or the Charisma-based Blessed Warrior cantrips instead. */
export const PALADIN_FIGHTING_STYLES_2024: FeatureChoiceOption[] = [
  ...COMBAT_FIGHTING_STYLES_2024,
  ...(BLESSED_WARRIOR_FEAT
    ? [
        {
          id: "blessedWarrior",
          label: "Blessed Warrior",
          summary: BLESSED_WARRIOR_FEAT.description,
          grantedSpells: [{ choice: { count: 2, spellLevel: 0 }, limit: "at will (cantrip), uses Charisma" }],
        },
      ]
    : []),
];

/** Ranger (2024): any combat style, or the Wisdom-based Druidic Warrior cantrips instead. */
export const RANGER_FIGHTING_STYLES_2024: FeatureChoiceOption[] = [
  ...COMBAT_FIGHTING_STYLES_2024,
  ...(DRUIDIC_WARRIOR_FEAT
    ? [
        {
          id: "druidicWarrior",
          label: "Druidic Warrior",
          summary: DRUIDIC_WARRIOR_FEAT.description,
          grantedSpells: [{ choice: { count: 2, spellLevel: 0 }, limit: "at will (cantrip), uses Wisdom" }],
        },
      ]
    : []),
];
