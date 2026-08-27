/**
 * Magic item rarity band, DMG Chapter 7 (2014) / Chapter 7 (2024) - both
 * editions use the same six bands.
 */
export type MagicItemRarity =
  | "common"
  | "uncommon"
  | "rare"
  | "very rare"
  | "legendary"
  | "artifact"
  | "varies";

/**
 * `true` - requires attunement, no restriction beyond that.
 * `false` - doesn't require attunement.
 * A string - requires attunement AND names the restriction verbatim (e.g.
 * "by a Spellcaster", "by a Cleric or Paladin"), matching how the DMG
 * prints these.
 */
export type AttunementRequirement = boolean | string;

/**
 * Category for a magic item that is NEITHER armor nor a weapon. Magic
 * armor and magic weapons are still plain `Armor` / `Weapon` objects (see
 * the magic-item fields added to both interfaces) rather than instances of
 * this type - `MagicItem` exists for everything else a character might
 * carry or attune to.
 */
export type MagicItemCategory =
  | "wondrous item"
  | "ring"
  | "rod"
  | "staff"
  | "wand"
  | "potion"
  | "scroll"
  | "ammunition"
  | "other";

export interface MagicItemCharges {
  max: number;
  /** e.g. "1d6 + 1 charges regained daily at dawn". Freeform, matching how the DMG phrases recharge. */
  rechargeFormula?: string;
}

/**
 * A magic item that isn't armor or a weapon - a wondrous item, ring, rod,
 * staff, wand, potion, scroll, or piece of magic ammunition. Magic-agnostic
 * between editions like Spell/Weapon/Armor, so no `edition` field - the
 * rules for e.g. a Bag of Holding haven't changed between 2014 and 2024.
 */
export interface MagicItem {
  name: string;
  category: MagicItemCategory;
  rarity: MagicItemRarity;
  requiresAttunement: AttunementRequirement;
  description: string;
  charges?: MagicItemCharges;
  /** Set on items a player homebrewed via createCustomMagicItem() rather than official content. */
  isCustom?: boolean;
}

/**
 * Input shape for building one homebrew/custom magic item - see
 * utils/customMagicItems.ts for the factory functions that consume this
 * (and the equivalent inputs for custom magic armor/weapons).
 */
export interface CustomMagicItemInput {
  name: string;
  category: MagicItemCategory;
  rarity: MagicItemRarity;
  requiresAttunement?: AttunementRequirement;
  description: string;
  charges?: MagicItemCharges;
}
