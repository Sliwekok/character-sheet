export type WeaponCategory = "simple" | "martial";
export type WeaponRange = "melee" | "ranged";

export type WeaponProperty =
  | "ammunition"
  | "finesse"
  | "heavy"
  | "light"
  | "loading"
  | "range"
  | "reach"
  | "thrown"
  | "two-handed"
  | "versatile";

/**
 * 2024 Player's Handbook weapon mastery properties. A weapon always
 * "carries" one of these, but whether a character can actually apply it
 * depends on their class's `weaponMasteryProgression`
 * (see CharacterClass.ts) - under the 2014 rules this field is simply
 * unused.
 */
export type WeaponMasteryProperty =
  | "Cleave"
  | "Graze"
  | "Nick"
  | "Push"
  | "Sap"
  | "Slow"
  | "Topple"
  | "Vex";

export interface Weapon {
  name: string;
  category: WeaponCategory;
  type: WeaponRange;
  damage: { dice: string; type: string };
  /** Present only when the weapon has the `versatile` property. */
  versatileDamage?: string;
  properties: WeaponProperty[];
  weight: number;
  cost?: string;
  mastery?: WeaponMasteryProperty;
}
