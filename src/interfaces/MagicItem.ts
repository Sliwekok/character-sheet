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
 * Flat mechanical bonuses a non-armor/non-weapon magic item grants while
 * it's carried - the MagicItem-side equivalent of `Weapon.bonus`/
 * `Armor.bonus`. All optional and all default to "no effect", matching how
 * most magic items (a Deck of Many Things, a Bag of Holding, a potion) are
 * pure flavor/utility with nothing here to set. Only fill in a field when
 * the item's own rules text grants that exact thing - e.g. a Ring of
 * Protection sets `armorClass: 1`, "+1 Ammunition" sets `attackRolls: 1` and
 * `damageRolls: 1`; most items set none of these.
 *
 * Deliberately narrow: this project doesn't track attunement slots (the
 * 3-item cap) or per-item conditions like "only while wearing no armor" (see
 * Bracers of Defense, left without a bonus here for exactly that reason) -
 * every item in `Character.magicItems` is treated as active and its
 * bonuses always apply, the same simplification `requiresAttunement`
 * already lives with (recorded, not enforced). See
 * utils/calculateArmorClass.ts and utils/attackCalculations.ts for where
 * these are actually added up.
 */
export interface MagicItemBonuses {
  /** Flat bonus to Armor Class, e.g. Ring of Protection, Cloak of Protection. */
  armorClass?: number;
  /** Flat bonus to weapon attack rolls (not spell attack rolls - there's no hook for those yet). */
  attackRolls?: number;
  /** Flat bonus to weapon damage rolls. */
  damageRolls?: number;
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
  /** See MagicItemBonuses - unset for the (large majority of) items that don't mechanically affect AC or weapon attack/damage rolls. */
  bonuses?: MagicItemBonuses;
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
  bonuses?: MagicItemBonuses;
}
