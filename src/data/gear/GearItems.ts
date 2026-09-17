import { GearItem } from "@/interfaces/GearItem";

/**
 * Starter compendium of mundane (non-magic) adventuring gear - the PHB
 * equipment-table staples every party ends up buying regardless of class
 * or edition (rope, torches, rations, a healer's kit, an over-the-counter
 * potion of healing, ammunition, ...). Edition-agnostic like
 * data/weapons/Weapons.ts and data/armor/Armor.ts - none of this has
 * changed between the 2014 and 2024 rules - and eagerly imported for the
 * same reason those are: this list is small (a couple dozen entries),
 * nowhere near the size of the generated magic item/weapon/armor data
 * that data/magicItems/index.ts has to lazy-load instead.
 *
 * This is what components/character/Shop.tsx's "General Gear" browser
 * searches, filters, and groups by `GearCategory` for fast adding to
 * `Character.inventory`.
 */
export const GEAR_ITEMS: GearItem[] = [
  // ---- Adventuring gear ----
  { name: "Torch", category: "adventuring gear", cost: "1 cp", weight: 1, description: "Burns for 1 hour, providing bright light in a 20-foot radius and dim light for an additional 20 feet." },
  { name: "Lantern, hooded", category: "adventuring gear", cost: "5 gp", weight: 2, description: "Casts bright light in a 30-foot radius and dim light for an additional 30 feet. A hooded lantern burns for 6 hours on a pint of oil." },
  { name: "Lantern, bullseye", category: "adventuring gear", cost: "10 gp", weight: 2, description: "Casts bright light in a 60-foot cone and dim light for an additional 60 feet. It burns for 6 hours on a pint of oil." },
  { name: "Oil (flask)", category: "adventuring gear", cost: "1 sp", weight: 1, description: "Fuel for a lamp or lantern, or usable as an improvised weapon when thrown and lit." },
  { name: "Tinderbox", category: "adventuring gear", cost: "5 sp", weight: 1, description: "Flint, fire steel, and tinder used to kindle a fire. Using it to light a torch or campfire takes an action." },
  { name: "Rope, hempen (50 feet)", category: "adventuring gear", cost: "1 gp", weight: 10, description: "Has 2 hit points and can be burst with a DC 17 Strength check." },
  { name: "Rope, silk (50 feet)", category: "adventuring gear", cost: "10 gp", weight: 5, description: "Has 2 hit points and can be burst with a DC 17 Strength check." },
  { name: "Rations (1 day)", category: "adventuring gear", cost: "5 sp", weight: 2, description: "Dry foods suitable for extended travel, including jerky, dried fruit, hardtack, and nuts." },
  { name: "Waterskin", category: "adventuring gear", cost: "2 sp", weight: 5, description: "Holds up to 4 pints of liquid, full weight given." },
  { name: "Bedroll", category: "adventuring gear", cost: "1 gp", weight: 7 },
  { name: "Blanket", category: "adventuring gear", cost: "5 sp", weight: 3 },
  { name: "Tent, two-person", category: "adventuring gear", cost: "2 gp", weight: 20 },
  { name: "Crowbar", category: "adventuring gear", cost: "2 gp", weight: 5, description: "Using a crowbar grants advantage to Strength checks where the crowbar's leverage can be applied." },
  { name: "Hammer", category: "adventuring gear", cost: "1 gp", weight: 3 },
  { name: "Piton", category: "adventuring gear", cost: "5 cp", weight: 0.25 },
  { name: "Grappling hook", category: "adventuring gear", cost: "2 gp", weight: 4 },
  { name: "Chain (10 feet)", category: "adventuring gear", cost: "5 gp", weight: 10, description: "Has 10 hit points and can be burst with a DC 20 Strength check." },
  { name: "Manacles", category: "adventuring gear", cost: "2 gp", weight: 6, description: "DC 20 Dexterity check to escape without a key; 15 AC, 20 hp." },
  { name: "Shovel", category: "adventuring gear", cost: "2 gp", weight: 5 },
  { name: "Signal whistle", category: "adventuring gear", cost: "5 cp", weight: 0 },
  { name: "Mirror, steel", category: "adventuring gear", cost: "5 gp", weight: 0.5 },
  { name: "Spyglass", category: "adventuring gear", cost: "1000 gp", weight: 1, description: "Objects viewed through it are magnified to twice their size." },
  { name: "Holy water (flask)", category: "adventuring gear", cost: "25 gp", weight: 1, description: "As an action, a creature can throw this flask up to 20 feet; it deals 2d6 radiant damage to a fiend or undead it hits." },
  { name: "Candle", category: "adventuring gear", cost: "1 cp", weight: 0, description: "Burns for 1 hour, shedding dim light in a 5-foot radius." },
  { name: "Chalk (1 piece)", category: "adventuring gear", cost: "1 cp", weight: 0 },
  { name: "Parchment (one sheet)", category: "adventuring gear", cost: "1 sp", weight: 0 },
  { name: "Ink (1 ounce bottle)", category: "adventuring gear", cost: "10 gp", weight: 0 },
  { name: "Ink pen", category: "adventuring gear", cost: "2 cp", weight: 0 },
  { name: "Sealing wax", category: "adventuring gear", cost: "5 sp", weight: 0 },
  { name: "Fishing tackle", category: "adventuring gear", cost: "1 gp", weight: 4 },
  { name: "Net", category: "adventuring gear", cost: "1 gp", weight: 3, description: "A creature hit by a thrown net is restrained until it escapes." },
  { name: "Ladder (10-foot)", category: "adventuring gear", cost: "1 sp", weight: 25 },
  { name: "Magnifying glass", category: "adventuring gear", cost: "100 gp", weight: 0, description: "Grants advantage on any ability check made to appraise or inspect a very fine or minuscule detail." },
  { name: "Hunting trap", category: "adventuring gear", cost: "5 gp", weight: 25, description: "A creature that steps on the trap's trigger plate is caught if it fails a DC 13 Dexterity save, taking 1d4 piercing damage." },
  { name: "Perfume (vial)", category: "adventuring gear", cost: "5 gp", weight: 0 },
  { name: "Soap", category: "adventuring gear", cost: "2 cp", weight: 0 },

  // ---- Tools ----
  { name: "Thieves' tools", category: "tool", cost: "25 gp", weight: 1, description: "Includes a set of lockpicks, small file, mirror, scissors, and pliers. Proficiency lets you add your bonus to checks to disarm traps or open locks." },
  { name: "Herbalism kit", category: "tool", cost: "5 gp", weight: 3, description: "Lets a proficient user identify plants and create antitoxin and potions of healing." },
  { name: "Healer's kit", category: "tool", cost: "5 gp", weight: 3, description: "Has 10 uses. As an action, expend one use to stabilize a creature at 0 hit points without a Wisdom (Medicine) check." },
  { name: "Disguise kit", category: "tool", cost: "25 gp", weight: 3, description: "Grants a bonus to checks made to disguise your appearance when proficient." },
  { name: "Climber's kit", category: "tool", cost: "25 gp", weight: 12, description: "Using it, you can anchor yourself, halting a fall after you fall no more than 25 feet." },
  { name: "Component pouch", category: "tool", cost: "25 gp", weight: 2, description: "A small watertight leather belt pouch that holds all the material components a spellcaster needs, except any that have a specified cost." },
  { name: "Alchemist's supplies", category: "tool", cost: "50 gp", weight: 8 },
  { name: "Navigator's tools", category: "tool", cost: "25 gp", weight: 2 },
  { name: "Poisoner's kit", category: "tool", cost: "50 gp", weight: 2, description: "Includes vials, chemicals, and equipment needed to create and use poisons." },

  // ---- Consumables ----
  { name: "Potion of healing", category: "consumable", cost: "50 gp", weight: 0.5, description: "You regain 2d4 + 2 hit points when you drink this potion. Sold at general/alchemist shops as basic adventuring stock." },
  { name: "Potion of greater healing", category: "consumable", cost: "150 gp", weight: 0.5, description: "You regain 4d4 + 4 hit points when you drink this potion. A stronger healing potion, typically found at established alchemist shops or supplied to experienced adventurers." },
  { name: "Potion of superior healing", category: "consumable", cost: "500 gp", weight: 0.5, description: "You regain 8d4 + 8 hit points when you drink this potion. A rare and powerful healing potion, usually difficult to obtain outside major settlements or specialized alchemists." },
  { name: "Potion of supreme healing", category: "consumable", cost: "5,000 gp", weight: 0.5, description: "You regain 10d4 + 20 hit points when you drink this potion. An exceptionally rare healing potion, generally reserved for powerful adventurers and found in high-level treasure." },  { name: "Acid (vial)", category: "consumable", cost: "25 gp", weight: 1, description: "As an action, you can splash the contents of this vial onto a creature within 5 feet or throw it up to 20 feet, dealing 2d6 acid damage on a hit." },
  { name: "Alchemist's fire (flask)", category: "consumable", cost: "50 gp", weight: 1, description: "A creature hit by a thrown flask takes 1d4 fire damage at the start of each of its turns until it or another creature uses an action to douse the flames." },
  { name: "Antitoxin (vial)", category: "consumable", cost: "50 gp", weight: 0, description: "A creature that drinks this vial gains advantage on saving throws against poison for 1 hour." },
  { name: "Basic poison (vial)", category: "consumable", cost: "100 gp", weight: 0, description: "A creature subjected to this poison must succeed on a DC 10 Constitution save or take 1d4 poison damage, then take that damage again each turn until the poison stops." },

  // ---- Containers ----
  { name: "Backpack", category: "container", cost: "2 gp", weight: 5, description: "Holds 1 cubic foot/30 pounds of gear. A quiver, bedroll, bag, or sack can each be attached to it." },
  { name: "Pouch", category: "container", cost: "5 sp", weight: 1, description: "Holds up to 6 pounds or one-fifth of a cubic foot of gear." },
  { name: "Sack", category: "container", cost: "1 cp", weight: 0.5, description: "Holds up to 30 pounds or 1 cubic foot of gear." },
  { name: "Chest", category: "container", cost: "5 gp", weight: 25, description: "Holds up to 12 cubic feet or 300 pounds of gear." },
  { name: "Bottle, glass", category: "container", cost: "2 gp", weight: 2, description: "Holds up to 1.5 pints of liquid." },
  { name: "Barrel", category: "container", cost: "2 gp", weight: 70, description: "Holds up to 40 cubic feet or 4 cubic feet of liquid." },
  { name: "Basket", category: "container", cost: "4 sp", weight: 2, description: "Holds up to 2 cubic feet or 40 pounds of gear." },

  // ---- Ammunition ----
  { name: "Arrows (20)", category: "ammunition", cost: "1 gp", weight: 1 },
  { name: "Crossbow bolts (20)", category: "ammunition", cost: "1 gp", weight: 1.5 },
  { name: "Sling bullets (20)", category: "ammunition", cost: "4 cp", weight: 1.5 },
  { name: "Blowgun needles (50)", category: "ammunition", cost: "1 gp", weight: 1 },

  // ---- Trade goods ----
  { name: "Cloth (1 sq. yd.)", category: "trade good", cost: "5 sp", weight: 1 },
  { name: "Iron (1 lb.)", category: "trade good", cost: "2 sp", weight: 1 },
  { name: "Copper (1 lb.)", category: "trade good", cost: "5 cp", weight: 1 },
  { name: "Salt (1 lb.)", category: "trade good", cost: "5 sp", weight: 1 },
  { name: "Spices (1 lb.)", category: "trade good", cost: "2 gp", weight: 1 },
];
