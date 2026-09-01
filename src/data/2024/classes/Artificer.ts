import { CharacterClass } from "@/interfaces/CharacterClass";
import { halfCasterProgression } from "@/interfaces/SpellSlotsProgression";

// Artificer's 2024 printing - Eberron: Forge of the Artificer (2023), the class's official 2024-design update.
// Its source book isn't XPHB even in the 2024 case, unlike every other class here -
// worth remembering if you ever add edition-detection logic keyed off source codes.
// casterProgression is bucketed as 'half' for multiclassing purposes (matching the
// PHB multiclassing table), though Artificer's own single-class slot table starts at
// level 1 rather than following the shared half-caster table exactly - worth a
// gut-check against your book if that matters for your build.
export const Artificer: CharacterClass = {
    name: "Artificer",
    edition: "2024",
    hitDie: 8,
    proficiencies: {
        armor: ["Light armor", "Medium armor", "Shields"],
        weapons: ["Simple weapons"],
        tools: ["Thieves' Tools", "Tinker's Tools", "One type of Artisan's Tools of your choice"],
        savingThrows: ["constitution", "intelligence"],
        skills: { choose: 2, from: ["Arcana", "History", "Investigation", "Medicine", "Nature", "Perception", "Sleight of Hand"] },
    },
    multiclassProficiencies: {
        armor: ["Light armor", "Medium armor", "Shields"],
        tools: ["Tinker's Tools"],
        skills: { choose: 1, from: ["Arcana", "History", "Investigation", "Medicine", "Nature", "Perception", "Sleight of Hand"] },
    },
    primaryAbility: "intelligence",
    casterProgression: "half",
    spellcasting: {
        ability: "intelligence",
        preparation: "prepared",
        ritualCasting: true,
        progression: halfCasterProgression,
    },
    subclassLevel: 3,
    // features text pulled and verified against 5etools' class-artificer.json (EFA source) - https://5e.tools/classes.html#artificer_efa
    // Corrected from an earlier from-memory pass, which had wrongly copied the TCE (2014)
    // feature names/levels onto this class instead of EFA's actual redesign (Tinker's Magic
    // instead of Magical Tinkering, Replicate Magic Item instead of Infuse Item, Magic Item
    // Tinker at 6 instead of Tool Expertise, Advanced Artifice at 14, no ASI at 19 - Epic Boon instead).
    features: [
        { name: "Spellcasting", level: 1, description: "You have learned how to channel magical energy through objects.\nTools Required: You produce your Artificer spells through tools. You can use Thieves' Tools, Tinker's Tools, or another kind of Artisan's Tools with which you have proficiency as a Spellcasting Focus, and you must have one of those focuses in hand when you cast an Artificer spell (meaning the spell has an M component when you cast it).\nCantrips: You know two Artificer cantrips of your choice. Whenever you finish a Long Rest, you can replace one of your cantrips from this feature with another Artificer cantrip of your choice. When you reach Artificer levels 10 and 14, you learn another Artificer cantrip of your choice.\nSpell Slots: You regain all expended slots when you finish a Long Rest.\nPrepared Spells of Level 1+: To start, choose two level 1 Artificer spells. The number of spells on your list increases as you gain Artificer levels. Whenever you finish a Long Rest, you can change your list of prepared spells, replacing any of the spells there with other Artificer spells for which you have spell slots.\nSpellcasting Ability: Intelligence is your spellcasting ability for your Artificer spells." },
        { name: "Tinker's Magic", level: 1, description: "You know the Mending cantrip. As a Magic action while holding Tinker's Tools, you can create one item in an unoccupied space within 5 feet of yourself, choosing from a list of mundane adventuring gear (ball bearings, a bedroll, a crowbar, rope, a torch, and the like - see the Player's Handbook for the item's rules). The item lasts until you finish a Long Rest, at which point it vanishes. You can use this feature a number of times equal to your Intelligence modifier (minimum of once), and you regain all expended uses when you finish a Long Rest." },
        { name: "Replicate Magic Item", level: 2, description: "You have learned arcane plans that you use to make magic items.\nPlans Known: When you gain this feature, choose four plans to learn from the Magic Item Plans (Artificer Level 2+) table. Whenever you gain an Artificer level, you can replace one of the plans you know with a new plan for which you qualify. You learn another plan of your choice at certain Artificer levels.\nCreating an Item: When you finish a Long Rest, you can create one or two different magic items (based on plans you know) if you have Tinker's Tools in hand; the number you can have active at once rises as you gain Artificer levels. If a created item requires Attunement, you can attune yourself to it the instant you create it.\nDuration: A magic item created by this feature isn't permanent; when you die, it vanishes after 1d4 days. If you replace a plan you know with a new plan, any magic item created with the replaced plan immediately vanishes.\nSpellcasting Focus: You can use any Wand or Weapon created by this feature as a Spellcasting Focus in lieu of a set of Artisan's Tools." },
        { name: "Ability Score Improvement", level: 4, description: "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify. You gain this feature again at Artificer levels 8, 12, and 16." },
        { name: "Magic Item Tinker", level: 6, description: "Your Replicate Magic Item feature gains the following options.\nCharge Magic Item: As a Bonus Action, you can touch a magic item within 5 feet of yourself that you created with Replicate Magic Item and that uses charges. You expend a level 1+ spell slot and recharge the item; the number of charges regained equals the level of spell slot expended.\nDrain Magic Item: As a Bonus Action, you can touch such an item and cause it to vanish, converting its magical energy into a spell slot - level 1 if the item is Common, level 2 if Uncommon or Rare. Once you use this option, you can't do so again until you finish a Long Rest, and any spell slot created this way vanishes when you finish a Long Rest.\nTransmute Magic Item: As a Magic action, you can touch such an item and transform it into a different magic item based on a plan you know. Once you use this option, you can't do so again until you finish a Long Rest." },
        { name: "Flash of Genius", level: 7, description: "When you or a creature you can see within 30 feet of you fails an ability check or a saving throw, you can take a Reaction to add a bonus to the roll, potentially causing it to succeed. The bonus equals your Intelligence modifier (minimum of +1). You can take this Reaction a number of times equal to your Intelligence modifier (minimum of once). You regain all expended uses when you finish a Long Rest." },
        { name: "Ability Score Improvement", level: 8, description: "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify." },
        { name: "Magic Item Adept", level: 10, description: "You can now attune to up to four magic items at once." },
        { name: "Spell-Storing Item", level: 11, description: "Whenever you finish a Long Rest, you can touch one Simple or Martial weapon or one item that you can use as a Spellcasting Focus, and you store a spell in it, choosing a level 1, 2, or 3 Artificer spell that has a casting time of an action and doesn't require a Material component that is consumed by the spell (you needn't have it prepared). While holding the object, a creature can take a Magic action to produce the spell's effect from it, using your spellcasting ability modifier. If the spell requires Concentration, the creature must concentrate. Once a creature has used the object to produce the spell's effect, the object can't be used this way again until the start of the creature's next turn. The spell stays in the object until it's been used a number of times equal to twice your Intelligence modifier (minimum of twice) or until you use this feature again." },
        { name: "Ability Score Improvement", level: 12, description: "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify." },
        { name: "Advanced Artifice", level: 14, description: "You gain the following benefits.\nMagic Item Savant: You can now attune to up to five magic items at once.\nRefreshed Genius: When you finish a Short Rest, you regain one expended use of your Flash of Genius feature." },
        { name: "Ability Score Improvement", level: 16, description: "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify." },
        { name: "Magic Item Master", level: 18, description: "You can now attune to up to six magic items at once." },
        { name: "Epic Boon", level: 19, description: "You gain an Epic Boon feat or another feat of your choice for which you qualify. Boon of Energy Resistance is recommended." },
        { name: "Soul of Artifice", level: 20, description: "You have developed a mystical connection to your magic items, which you can draw on for aid.\nCheat Death: If you're reduced to 0 hit points but not killed outright, you can disintegrate any number of Uncommon or Rare magic items created by your Replicate Magic Item feature. If you do so, your hit points instead change to a number equal to 20 times the number of magic items disintegrated.\nMagical Guidance: When you finish a Short Rest, you regain all expended uses of your Flash of Genius if you have Attunement to at least one magic item." },
    ],
};
