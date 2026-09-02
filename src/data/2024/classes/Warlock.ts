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
    // features text pulled and verified against 5etools' class-warlock.json (XPHB source) - https://5e.tools/classes.html#warlock_xphb
    // Corrected from an earlier from-memory pass: "Pact Boon" no longer exists as a standalone
    // level 3 feature in 2024 - Pact of the Blade/Chain/Tome were folded into the Eldritch
    // Invocations list as prerequisite-free options instead, so the fabricated level 3 entry was
    // removed and Eldritch Invocations' description now reflects that; Magical Cunning's recovery
    // math was wrong (it caps at half your maximum Pact Magic slots, not "combined level <= half
    // your warlock level", and isn't tied to being "part of a Short Rest"); Contact Patron was
    // rewritten to its real 2024 mechanic (always-prepared Contact Other Plane, cast free with an
    // automatic save, once per Long Rest) rather than the old "one-word reply" text; Mystic
    // Arcanum's name dropped the "(Nth level)" suffix XPHB no longer uses; Eldritch Master now
    // correctly ties into Magical Cunning instead of its own "1 minute entreating your patron"
    // text; and level 19 is a genuine "Epic Boon" named feature, not an Ability Score Improvement
    // with an Epic Boon option bolted on - the ASI entries at 4/8/12/16 had that reference removed.
    features: [
        { name: "Eldritch Invocations", level: 1, description: "You have unearthed Eldritch Invocations, fragments of forbidden knowledge that imbue you with an abiding magical ability or other lesson. You gain one invocation of your choice, such as Pact of the Blade, Pact of the Chain, or Pact of the Tome. If an invocation has a prerequisite, you must meet it to learn it, and you can't replace an invocation if it's a prerequisite for another invocation you have. You gain additional invocations as you gain levels in this class, and whenever you gain a level you can replace one you know with another for which you qualify." },
        { name: "Pact Magic", level: 1, description: "Your arcane research and the magic bestowed on you by your patron give you facility with spells. You regain all expended Pact Magic spell slots when you finish a Short or Long Rest, unlike other spellcasters. See the Spells section of this sheet for the spells you have prepared, your spell save DC, and your spell attack bonus." },
        { name: "Magical Cunning", level: 2, description: "You can perform an esoteric rite for 1 minute. At the end of it, you regain expended Pact Magic spell slots, but no more than a number equal to half your maximum (rounded up). Once you use this feature, you can't do so again until you finish a Long Rest." },
        { name: "Ability Score Improvement", level: 4, description: "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify. You gain this feature again at Warlock levels 8, 12, and 16." },
        { name: "Ability Score Improvement", level: 8, description: "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify." },
        { name: "Contact Patron", level: 9, description: "In the past, you usually contacted your patron through intermediaries. Now you can communicate directly: you always have the Contact Other Plane spell prepared, and you can cast it without expending a spell slot to contact your patron, automatically succeeding on the spell's saving throw. Once you cast the spell this way, you can't do so again until you finish a Long Rest." },
        { name: "Mystic Arcanum", level: 11, description: "Your patron grants you a magical secret called an arcanum. Choose one 6th-level Warlock spell as this arcanum. You can cast it once without expending a spell slot, and you must finish a Long Rest before you can cast it this way again. At higher levels you gain another Warlock spell that can be cast this way: a 7th-level spell at 13th level, an 8th-level spell at 15th level, and a 9th-level spell at 17th level. You regain all uses of your Mystic Arcanum when you finish a Long Rest. Whenever you gain a Warlock level, you can replace one of your arcanum spells with another Warlock spell of the same level." },
        { name: "Ability Score Improvement", level: 12, description: "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify." },
        { name: "Mystic Arcanum", level: 13, description: "You gain a 7th-level Warlock spell of your choice for your Mystic Arcanum." },
        { name: "Mystic Arcanum", level: 15, description: "You gain an 8th-level Warlock spell of your choice for your Mystic Arcanum." },
        { name: "Ability Score Improvement", level: 16, description: "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify." },
        { name: "Mystic Arcanum", level: 17, description: "You gain a 9th-level Warlock spell of your choice for your Mystic Arcanum." },
        { name: "Epic Boon", level: 19, description: "You gain an Epic Boon feat or another feat of your choice for which you qualify. Boon of Fate is recommended." },
        { name: "Eldritch Master", level: 20, description: "When you use your Magical Cunning feature, you regain all your expended Pact Magic spell slots." },
    ],
};
