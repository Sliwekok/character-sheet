/**
 * Category for a mundane (non-magic) item a character might carry -
 * general adventuring gear, a tool proficiency's kit, a one-shot
 * consumable, a container, ammunition, or a trade good. Kept separate
 * from `MagicItemCategory` (interfaces/MagicItem.ts) since these items
 * have no rarity, attunement, or charges - they're just equipment,
 * bought or found, that commonly stacks by quantity (see
 * `InventoryEntry` in Characters.ts).
 */
export type GearCategory =
  | "adventuring gear"
  | "tool"
  | "consumable"
  | "container"
  | "ammunition"
  | "trade good";

/**
 * A mundane item - a coil of rope, a torch, a healer's kit, a potion of
 * healing bought over the counter at the general store, a day's rations,
 * and so on. Distinct from `MagicItem` (no rarity/attunement/charges) and
 * from `Weapon`/`Armor` (no combat stats) - this covers everything else a
 * character's pack might hold.
 *
 * See data/gear/GearItems.ts for the starter compendium (the Shop's
 * "General Gear" browser - components/character/Shop.tsx - searches and
 * groups this list) and `Character.inventory` for how carried gear is
 * actually stored, as `{ item, quantity }` stacks.
 */
export interface GearItem {
  name: string;
  category: GearCategory;
  /** PHB-style cost string, e.g. "1 gp", "5 sp" - freeform like Weapon.cost/Armor.cost. */
  cost?: string;
  /** Weight in pounds, per unit. */
  weight?: number;
  description?: string;
  /** Set on gear a player homebrewed rather than picked from the compendium. */
  isCustom?: boolean;
}

/** Input shape for homebrewing one custom piece of gear - mirrors CustomMagicItemInput (interfaces/MagicItem.ts). */
export interface CustomGearItemInput {
  name: string;
  category: GearCategory;
  cost?: string;
  weight?: number;
  description?: string;
}
