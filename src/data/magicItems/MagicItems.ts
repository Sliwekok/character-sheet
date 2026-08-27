import { MagicItem } from "@/interfaces/MagicItem";

/**
 * A starter set of iconic DMG magic items that are NOT armor or a weapon
 * (see data/weapons/Weapons.ts / data/armor/Armor.ts + utils/customMagicItems.ts
 * enchantWeapon/enchantArmor for magic weapons and armor instead - e.g. a
 * "+1 Longsword" or "Flame Tongue" is built by enchanting a WEAPONS entry,
 * not listed here).
 *
 * Edition-agnostic like Weapons/Armor/Spells - the DMG magic item rules
 * haven't changed between 2014 and 2024, so this single list is shared by
 * both rulesets (see data/index.ts).
 *
 * This is a representative sample (~25 items), not the full DMG - by
 * design, this same shape is exactly what a player-facing "add a custom
 * magic item" form would produce via createCustomMagicItem() in
 * utils/customMagicItems.ts, so hand-authoring the complete DMG catalog
 * here isn't a prerequisite for that feature to work.
 */
export const MAGIC_ITEMS: MagicItem[] = [
    // ---- Common ----
    {
        name: "Potion of Healing",
        category: "potion",
        rarity: "common",
        requiresAttunement: false,
        description: "You regain 2d4 + 2 hit points when you drink this potion. The potion's red liquid glimmers when agitated.",
    },
    {
        name: "Potion of Climbing",
        category: "potion",
        rarity: "common",
        requiresAttunement: false,
        description: "When you drink this potion, you gain a climbing speed equal to your walking speed for 1 hour, and you have advantage on Strength (Athletics) checks made to climb.",
    },
    {
        name: "Cloak of Billowing",
        category: "wondrous item",
        rarity: "common",
        requiresAttunement: false,
        description: "While wearing this cloak, you can use a bonus action to make it billow dramatically.",
    },

    // ---- Uncommon ----
    {
        name: "Bag of Holding",
        category: "wondrous item",
        rarity: "uncommon",
        requiresAttunement: false,
        description: "This bag has an interior space considerably larger than its outside dimensions, holding up to 500 pounds, not exceeding a volume of 64 cubic feet. Placing a breathing creature inside, or overloading it, ruins the bag and its contents.",
    },
    {
        name: "Cloak of Protection",
        category: "wondrous item",
        rarity: "uncommon",
        requiresAttunement: true,
        description: "You gain a +1 bonus to AC and saving throws while you wear this cloak.",
    },
    {
        name: "Boots of Elvenkind",
        category: "wondrous item",
        rarity: "uncommon",
        requiresAttunement: false,
        description: "While you wear these boots, your steps make no sound, regardless of the surface you are moving across. You also have advantage on Dexterity (Stealth) checks that rely on moving silently.",
    },
    {
        name: "Cloak of Elvenkind",
        category: "wondrous item",
        rarity: "uncommon",
        requiresAttunement: true,
        description: "While you wear this cloak with its hood up, Wisdom (Perception) checks made to see you have disadvantage, and you have advantage on Dexterity (Stealth) checks made to hide, as the cloak's color shifts to camouflage you.",
    },
    {
        name: "Gauntlets of Ogre Power",
        category: "wondrous item",
        rarity: "uncommon",
        requiresAttunement: true,
        description: "Your Strength score is 19 while you wear these gauntlets. They have no effect on you if your Strength is already 19 or higher.",
    },
    {
        name: "Headband of Intellect",
        category: "wondrous item",
        rarity: "uncommon",
        requiresAttunement: true,
        description: "Your Intelligence score is 19 while you wear this headband. It has no effect on you if your Intelligence is already 19 or higher.",
    },
    {
        name: "Rod of the Pact Keeper +1",
        category: "rod",
        rarity: "uncommon",
        requiresAttunement: "by a Warlock",
        description: "While holding this rod, you gain a +1 bonus to spell attack rolls and to the saving throw DCs of your spells, and you regain one expended spell slot as an action once per day.",
    },
    {
        name: "Wand of Magic Missiles",
        category: "wand",
        rarity: "uncommon",
        requiresAttunement: false,
        charges: { max: 7, rechargeFormula: "1d6 + 1 charges regained daily at dawn" },
        description: "While holding this wand, you can use an action to expend 1 or more of its charges to cast the Magic Missile spell, using your spell save DC. Expending 2 charges casts it as a 2nd-level spell, 3 charges as a 3rd-level spell.",
    },
    {
        name: "Wand of the War Mage +1",
        category: "wand",
        rarity: "uncommon",
        requiresAttunement: "by a Spellcaster",
        description: "While holding this wand, you gain a +1 bonus to spell attack rolls, and your spells ignore half and three-quarters cover.",
    },
    {
        name: "Immovable Rod",
        category: "rod",
        rarity: "uncommon",
        requiresAttunement: false,
        description: "This flat iron rod has a button on one end. You can use an action to press the button, which causes the rod to become magically fixed in place - up to 8,000 pounds of force is needed to move it. Pressing the button again releases it.",
    },
    {
        name: "Rope of Climbing",
        category: "wondrous item",
        rarity: "uncommon",
        requiresAttunement: false,
        description: "This 60-foot length of silk rope weighs 3 pounds and can bear up to 3,000 pounds. On command, it animates, moving, coiling, uncoiling, knotting, or securing itself as you direct.",
    },
    {
        name: "Winged Boots",
        category: "wondrous item",
        rarity: "uncommon",
        requiresAttunement: true,
        description: "While wearing these boots, you have a flying speed equal to your walking speed, usable for up to 4 hours (in increments you choose) per day.",
    },
    {
        name: "Horn of Blasting",
        category: "wondrous item",
        rarity: "uncommon",
        requiresAttunement: false,
        description: "You can use an action to blow this horn, which produces a strong, thunderous sound audible up to 600 feet away. Each creature in a 30-foot cone must make a Constitution save or take 5d6 thunder damage (half on success), and unsecured objects hit take the same and are pushed away.",
    },
    {
        name: "Sending Stones",
        category: "wondrous item",
        rarity: "uncommon",
        requiresAttunement: false,
        description: "Sending stones come in linked pairs, created together. Without attunement, either bearer can cast the Sending spell at will, reaching only the bearer of the other stone in the pair, so long as both are on the same plane of existence.",
    },
    {
        name: "Driftglobe",
        category: "wondrous item",
        rarity: "uncommon",
        requiresAttunement: false,
        description: "This 6-inch-diameter glass sphere weighs 1 pound. You can use an action to command it to shed light (as the Light or Daylight spell) or to float and hover, staying within 30 feet of you unless commanded to stay in place.",
    },

    // ---- Rare ----
    {
        name: "Ring of Protection",
        category: "ring",
        rarity: "rare",
        requiresAttunement: true,
        description: "You gain a +1 bonus to AC and saving throws while wearing this ring.",
    },
    {
        name: "Ring of Spell Storing",
        category: "ring",
        rarity: "rare",
        requiresAttunement: true,
        charges: { max: 5, rechargeFormula: "spell levels stored, refilled by a spellcaster casting into the ring" },
        description: "This ring stores spells cast into it, up to a combined total of 5 levels, which the wearer can then cast from the ring, using the original caster's spellcasting ability and save DC.",
    },
    {
        name: "Amulet of Health",
        category: "wondrous item",
        rarity: "rare",
        requiresAttunement: true,
        description: "Your Constitution score is 19 while you wear this amulet. It has no effect on you if your Constitution is already 19 or higher.",
    },
    {
        name: "Cloak of Displacement",
        category: "wondrous item",
        rarity: "rare",
        requiresAttunement: true,
        description: "While wearing this cloak, you appear to be standing in a place near your actual location, causing any creature to have disadvantage on attack rolls against you. If you take damage, this property is negated until the start of your next turn.",
    },
    {
        name: "Boots of Speed",
        category: "wondrous item",
        rarity: "rare",
        requiresAttunement: true,
        description: "While you wear these boots, you can use a bonus action to click the boots' heels together, doubling your walking speed and imposing the same effects on you as the Haste spell, except it doesn't affect your AC, for up to 10 minutes total per day.",
    },
    {
        name: "Bracers of Defense",
        category: "wondrous item",
        rarity: "rare",
        requiresAttunement: true,
        description: "While wearing these bracers, you gain a +2 bonus to AC if you are wearing no armor and using no shield.",
    },
    {
        name: "Portable Hole",
        category: "wondrous item",
        rarity: "rare",
        requiresAttunement: false,
        description: "This circle of black cloth, 6 feet in diameter, can be spread on any flat surface to create an extradimensional hole 10 feet deep, holding up to 64 cubic feet of material. Removing it closes the hole, and anything inside remains.",
    },
    {
        name: "Necklace of Fireballs",
        category: "wondrous item",
        rarity: "rare",
        requiresAttunement: false,
        charges: { max: 6, rechargeFormula: "one-time consumable beads, not rechargeable" },
        description: "This necklace has 1d6 + 3 beads. You can use an action to detach and throw one, exploding as a 3rd-level Fireball (higher-level effects for larger beads on the same necklace, per the full table).",
    },
    {
        name: "Robe of Eyes",
        category: "wondrous item",
        rarity: "rare",
        requiresAttunement: true,
        description: "While wearing this robe, you gain Truesight with a radius of 120 feet, but you have disadvantage on Wisdom (Perception) checks that rely on hearing, and you're vulnerable to bright light's effects on visibility.",
    },
    {
        name: "Ioun Stone of Protection",
        category: "wondrous item",
        rarity: "rare",
        requiresAttunement: true,
        description: "This pale blue rhomboid orbits your head. You gain a +1 bonus to AC. If it's destroyed or you dismiss it, the bonus ends.",
    },
    {
        name: "Staff of Healing",
        category: "staff",
        rarity: "rare",
        requiresAttunement: "by a Bard, Cleric, or Druid",
        charges: { max: 10, rechargeFormula: "1d6 + 4 charges regained daily at dawn" },
        description: "While holding this staff, you can expend charges to cast Cure Wounds (1 charge per spell level, up to 4th), Lesser Restoration (2 charges), or Mass Cure Wounds (5 charges) without a spell slot.",
    },

    // ---- Very rare ----
    {
        name: "Manual of Bodily Health",
        category: "wondrous item",
        rarity: "very rare",
        requiresAttunement: false,
        description: "A reader who spends 48 hours over no more than 6 days studying this tome and succeeds on a DC 15 Intelligence save gains 2 points of Constitution, and their maximum for that score increases by 2. The manual then loses its magic (a new one can't be read for benefit for 100 years).",
    },
    {
        name: "Tome of Leadership and Influence",
        category: "wondrous item",
        rarity: "very rare",
        requiresAttunement: false,
        description: "A reader who spends 48 hours over no more than 6 days studying this tome and succeeds on a DC 15 Intelligence save gains 2 points of Charisma, and their maximum for that score increases by 2. The tome then loses its magic (a new one can't be read for benefit for 100 years).",
    },

    // ---- Legendary ----
    {
        name: "Deck of Many Things",
        category: "wondrous item",
        rarity: "legendary",
        requiresAttunement: false,
        description: "Usually found in a box or pouch, this deck contains a number of cards made of ivory or vellum. Before drawing a card, a creature may be required to declare how many cards they'll draw. Each card, once drawn, has a wildly powerful and often unpredictable effect on the drawer - full effects per the DMG's Deck of Many Things table.",
    },
];
