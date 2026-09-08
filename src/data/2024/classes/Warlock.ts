import { CharacterClass } from "@/interfaces/CharacterClass";
import { pactMagicProgression } from "@/interfaces/SpellSlotsProgression";

// 2024 unified all casters onto a single 'prepared spells' model, but these three
// classes can only reselect their prepared spells on level-up (not after every long
// rest, unlike Cleric/Druid/Paladin/Ranger/Wizard) - not modeled by ClassSpellcasting
// yet, flagged here in case that distinction matters later.
// subclassLevel moved from 1 (2014) to 3 in the 2024 revision, sourced directly from
// 5etools' class data (classFeature 'Warlock Subclass|Warlock|XPHB|3').
export const Warlock: CharacterClass = {
    name: "Warlock",
    edition: "2024",
    hitDie: 8,
    proficiencies: {
        armor: ["Light armor"],
        weapons: ["Simple weapons"],
        savingThrows: ["wisdom", "charisma"],
        skills: { choose: 2, from: ["Arcana", "Deception", "History", "Intimidation", "Investigation", "Nature", "Religion"] },
    },
    multiclassProficiencies: {
        armor: ["Light armor"],
    },
    primaryAbility: "charisma",
    casterProgression: "pact",
    spellcasting: {
        ability: "charisma",
        preparation: "prepared",
        pactMagic: pactMagicProgression,
    },
    subclassLevel: 3,
    // features text re-scraped and verified against Roll20's D&D 2024 Compendium ("Warlock
    // Features" table) - https://roll20.net/compendium/dnd5e/Classes:Warlock (2024 source)
    // Corrected from an earlier pass: Pact Magic had been reduced to a stub pointing at "the
    // Spells section of this sheet" instead of the actual rules text (cantrips gained at 1st/4th/
    // 10th, the all-slots-share-one-level mechanic with a worked example, prepared spells with the
    // "always prepared" clause, changing prepared spells on level-up, spellcasting ability and
    // focus). Eldritch Invocations, Magical Cunning, Ability Score Improvement, Contact Patron,
    // Mystic Arcanum, Epic Boon, and Eldritch Master were already accurate and are unchanged.
    features: [
        { name: "Eldritch Invocations", level: 1, description: "You have unearthed Eldritch Invocations, fragments of forbidden knowledge that imbue you with an abiding magical ability or other lesson. You gain one invocation of your choice, such as Pact of the Blade, Pact of the Chain, or Pact of the Tome. If an invocation has a prerequisite, you must meet it to learn it, and you can't replace an invocation if it's a prerequisite for another invocation you have. You gain additional invocations as you gain levels in this class, and whenever you gain a level you can replace one you know with another for which you qualify." },
        { name: "Pact Magic", level: 1, description: "Through occult ceremony, you have formed a pact with a mysterious entity to gain magical powers. See the Spells section of this sheet for the spells you have prepared, your spell save DC, and your spell attack bonus.\nCantrips: You know two Warlock cantrips of your choice. Whenever you gain a Warlock level, you can replace one of your cantrips from this feature with another Warlock cantrip of your choice. When you reach Warlock levels 4 and 10, you learn another Warlock cantrip of your choice.\nSpell Slots: The Warlock table shows how many spell slots you have to cast your Warlock spells of levels 1-5. The table also shows the level of those slots, all of which are the same level. You regain all expended Pact Magic spell slots when you finish a Short or Long Rest. For example, when you're a level 5 Warlock, you have two level 3 spell slots. To cast the level 1 spell Witch Bolt, you must spend one of those slots, and you cast it as a level 3 spell.\nPrepared Spells of Level 1+: You prepare the list of level 1+ spells that are available for you to cast with this feature. To start, choose two level 1 Warlock spells. The number of spells on your list increases as you gain Warlock levels. Whenever that number increases, choose additional Warlock spells until the number of spells on your list matches your new total. The chosen spells must be of a level no higher than your slot level. If another Warlock feature gives you spells that you always have prepared, those spells don't count against the number of spells you can prepare with this feature, but those spells otherwise count as Warlock spells for you.\nChanging Your Prepared Spells: Whenever you gain a Warlock level, you can replace one spell on your list with another Warlock spell of an eligible level.\nSpellcasting Ability: Charisma is the spellcasting ability for your Warlock spells.\nSpellcasting Focus: You can use an Arcane Focus as a Spellcasting Focus for your Warlock spells." },
        { name: "Magical Cunning", level: 2, description: "You can perform an esoteric rite for 1 minute. At the end of it, you regain expended Pact Magic spell slots, but no more than a number equal to half your maximum (rounded up). Once you use this feature, you can't do so again until you finish a Long Rest." },
        { name: "Ability Score Improvement", level: 4, description: "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify. You gain this feature again at Warlock levels 8, 12, and 16." },
        { name: "Ability Score Improvement", level: 8, description: "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify." },
        { name: "Contact Patron", level: 9, description: "In the past, you usually contacted your patron through intermediaries. Now you can communicate directly: you always have the Contact Other Plane spell prepared, and you can cast it without expending a spell slot to contact your patron, automatically succeeding on the spell's saving throw. Once you cast the spell this way, you can't do so again until you finish a Long Rest.", grantedSpells: [{ spellName: "Contact Other Plane", limit: "once per long rest (auto-succeeds its save)" }] },
        { name: "Mystic Arcanum", level: 11, description: "Your patron grants you a magical secret called an arcanum. Choose one 6th-level Warlock spell as this arcanum. You can cast it once without expending a spell slot, and you must finish a Long Rest before you can cast it this way again. At higher levels you gain another Warlock spell that can be cast this way: a 7th-level spell at 13th level, an 8th-level spell at 15th level, and a 9th-level spell at 17th level. You regain all uses of your Mystic Arcanum when you finish a Long Rest. Whenever you gain a Warlock level, you can replace one of your arcanum spells with another Warlock spell of the same level.", grantedSpells: [{ choice: { count: 1, spellLevel: 6 }, limit: "once per long rest" }] },
        { name: "Ability Score Improvement", level: 12, description: "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify." },
        { name: "Mystic Arcanum", level: 13, description: "You gain a 7th-level Warlock spell of your choice for your Mystic Arcanum.", grantedSpells: [{ choice: { count: 1, spellLevel: 7 }, limit: "once per long rest" }] },
        { name: "Mystic Arcanum", level: 15, description: "You gain an 8th-level Warlock spell of your choice for your Mystic Arcanum.", grantedSpells: [{ choice: { count: 1, spellLevel: 8 }, limit: "once per long rest" }] },
        { name: "Ability Score Improvement", level: 16, description: "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify." },
        { name: "Mystic Arcanum", level: 17, description: "You gain a 9th-level Warlock spell of your choice for your Mystic Arcanum.", grantedSpells: [{ choice: { count: 1, spellLevel: 9 }, limit: "once per long rest" }] },
        { name: "Epic Boon", level: 19, description: "You gain an Epic Boon feat or another feat of your choice for which you qualify. Boon of Fate is recommended." },
        { name: "Eldritch Master", level: 20, description: "When you use your Magical Cunning feature, you regain all your expended Pact Magic spell slots." },
    ],
};
