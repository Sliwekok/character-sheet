import { Armor } from "@/interfaces/Armor";
import { Weapon, WeaponCategory, WeaponRange, WeaponProperty, WeaponMasteryProperty } from "@/interfaces/Weapon";
import { ArmorCategory } from "@/interfaces/Armor";
import { AttunementRequirement, CustomMagicItemInput, MagicItem, MagicItemRarity } from "@/interfaces/MagicItem";

/**
 * Two ways to get a custom magic weapon or armor, matching the two ways
 * players actually do this at the table:
 *
 * 1. Enchant something that already exists - `enchantWeapon`/`enchantArmor`
 *    take a base item (from data/weapons/Weapons.ts, data/armor/Armor.ts,
 *    or any other Weapon/Armor) and layer magic properties on top. This is
 *    the common case: "my Longsword is now a +1 Longsword".
 * 2. Homebrew something from scratch - `createCustomWeapon`/
 *    `createCustomArmor` build a whole new item, mundane stats and magic
 *    properties together, for a table that wants an original magic item
 *    with no mundane equivalent.
 *
 * Both paths produce a plain `Weapon`/`Armor` (tagged `isCustom: true`),
 * not a separate type, so they drop straight into
 * `Character.weapons`/`equippedArmor`/`shield` with no other plumbing.
 * `createCustomMagicItem` covers everything that isn't armor or a weapon -
 * wondrous items, rings, rods, staves, wands, potions, scrolls - producing
 * a `MagicItem` for `Character.magicItems`.
 *
 * None of this has a UI yet (see the newCharacter stub) - these are the
 * functions a future "add a magic item" form would call.
 */

export interface EnchantmentInput {
  /** Defaults to `${base.name} +${bonus}` when `bonus` is set, otherwise the base item's own name unchanged. */
  nameOverride?: string;
  bonus?: number;
  rarity: MagicItemRarity;
  requiresAttunement?: AttunementRequirement;
  magicDescription: string;
}

function resolveName(baseName: string, input: EnchantmentInput): string {
  if (input.nameOverride) return input.nameOverride;
  if (input.bonus) return `${baseName} +${input.bonus}`;
  return baseName;
}

/** Layer magic properties onto an existing weapon (mundane or otherwise) to produce a new, distinct magic weapon. */
export function enchantWeapon(base: Weapon, input: EnchantmentInput): Weapon {
  return {
    ...base,
    name: resolveName(base.name, input),
    bonus: input.bonus,
    rarity: input.rarity,
    requiresAttunement: input.requiresAttunement ?? false,
    magicDescription: input.magicDescription,
    isCustom: true,
  };
}

/** Layer magic properties onto an existing armor (mundane or otherwise) to produce a new, distinct magic armor. Shields count as armor here too. */
export function enchantArmor(base: Armor, input: EnchantmentInput): Armor {
  return {
    ...base,
    name: resolveName(base.name, input),
    bonus: input.bonus,
    rarity: input.rarity,
    requiresAttunement: input.requiresAttunement ?? false,
    magicDescription: input.magicDescription,
    isCustom: true,
  };
}

export interface CustomWeaponInput {
  name: string;
  category: WeaponCategory;
  type: WeaponRange;
  damage: { dice: string; type: string };
  versatileDamage?: string;
  properties?: WeaponProperty[];
  weight?: number;
  cost?: string;
  mastery?: WeaponMasteryProperty;
  bonus?: number;
  rarity: MagicItemRarity;
  requiresAttunement?: AttunementRequirement;
  magicDescription: string;
}

/** Homebrew an entirely new magic weapon, with no mundane base item required. */
export function createCustomWeapon(input: CustomWeaponInput): Weapon {
  return {
    name: input.name,
    category: input.category,
    type: input.type,
    damage: input.damage,
    versatileDamage: input.versatileDamage,
    properties: input.properties ?? [],
    weight: input.weight ?? 0,
    cost: input.cost,
    mastery: input.mastery,
    bonus: input.bonus,
    rarity: input.rarity,
    requiresAttunement: input.requiresAttunement ?? false,
    magicDescription: input.magicDescription,
    isCustom: true,
  };
}

export interface CustomArmorInput {
  name: string;
  category: ArmorCategory;
  baseAC: number;
  dexterityModifier?: { enabled: boolean; max?: number };
  stealthDisadvantage?: boolean;
  strengthRequirement?: number;
  material?: string;
  weight?: number;
  cost?: string;
  bonus?: number;
  rarity: MagicItemRarity;
  requiresAttunement?: AttunementRequirement;
  magicDescription: string;
}

/** Homebrew an entirely new magic armor (or shield, via `category: "shield"`), with no mundane base item required. */
export function createCustomArmor(input: CustomArmorInput): Armor {
  return {
    name: input.name,
    category: input.category,
    baseAC: input.baseAC,
    dexterityModifier: input.dexterityModifier,
    stealthDisadvantage: input.stealthDisadvantage,
    strengthRequirement: input.strengthRequirement,
    material: input.material,
    weight: input.weight,
    cost: input.cost,
    bonus: input.bonus,
    rarity: input.rarity,
    requiresAttunement: input.requiresAttunement ?? false,
    magicDescription: input.magicDescription,
    isCustom: true,
  };
}

/** Homebrew a magic item that isn't armor or a weapon - a wondrous item, ring, rod, staff, wand, potion, or scroll. */
export function createCustomMagicItem(input: CustomMagicItemInput): MagicItem {
  return {
    name: input.name,
    category: input.category,
    rarity: input.rarity,
    requiresAttunement: input.requiresAttunement ?? false,
    description: input.description,
    charges: input.charges,
    isCustom: true,
  };
}
