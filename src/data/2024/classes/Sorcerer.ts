import { CharacterClass } from "@/interfaces/CharacterClass";
import { fullCasterProgression } from "@/interfaces/SpellSlotsProgression";

// 2024 unified all casters onto a single 'prepared spells' model, but these three
// classes can only reselect their prepared spells on level-up (not after every long
// rest, unlike Cleric/Druid/Paladin/Ranger/Wizard) - not modeled by ClassSpellcasting
// yet, flagged here in case that distinction matters later.
export const Sorcerer: CharacterClass = {
    name: "Sorcerer",
    edition: "2024",
    hitDie: 6,
    proficiencies: {
        armor: [],
        weapons: ["Simple weapons"],
        savingThrows: ["constitution", "charisma"],
        skills: { choose: 2, from: ["Arcana", "Deception", "Insight", "Intimidation", "Persuasion", "Religion"] },
    },
    primaryAbility: "charisma",
    casterProgression: "full",
    spellcasting: {
        ability: "charisma",
        preparation: "prepared",
        progression: fullCasterProgression,
    },
    subclassLevel: 3,
    // features authored from memory of the 2024 PHB (no web access) - worth a cross-check against your book.
    features: [
        { name: "Spellcasting", level: 1, description: "An event in your past, or in the life of a parent or ancestor, left an indelible mark on you, infusing you with arcane magic. See the Spells section of this sheet for the spells you have prepared, your spell save DC, and your spell attack bonus." },
        { name: "Innate Sorcery", level: 1, description: "An arcane spark ignites within you, granting you the following benefits for 1 minute, usable twice per Long Rest as a Bonus Action: your spell save DC and spell attack bonus each increase by 1, and you have advantage on the attack rolls of Sorcerer spells you cast." },
        { name: "Font of Magic", level: 2, description: "You tap into a deep wellspring of magic within yourself, represented by Sorcery Points equal to your sorcerer level. You can spend these points to fuel various magical effects. You can transform unexpended sorcery points into one spell slot as a Bonus Action, or transform a spell slot you haven't used into a number of sorcery points equal to the slot's level (once per turn each)." },
        { name: "Metamagic", level: 3, description: "You gain the ability to twist your spells to suit your needs. You gain two Metamagic options of your choice, such as Careful Spell, Distant Spell, Empowered Spell, Extended Spell, Heightened Spell, Quickened Spell, Subtle Spell, or Twinned Spell. You can use only one Metamagic option on a spell when you cast it, unless the option says otherwise. You gain one additional Metamagic option at 10th level and again at 17th level." },
        { name: "Ability Score Improvement", level: 4, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature. At 19th level you can instead take an Epic Boon feat." },
        { name: "Ability Score Improvement", level: 8, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature. At 19th level you can instead take an Epic Boon feat." },
        { name: "Metamagic (additional option)", level: 10, description: "You gain one additional Metamagic option of your choice." },
        { name: "Sorcerous Restoration", level: 10, description: "You regain 4 expended sorcery points whenever you finish a Short Rest." },
        { name: "Ability Score Improvement", level: 12, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature. At 19th level you can instead take an Epic Boon feat." },
        { name: "Ability Score Improvement", level: 16, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature. At 19th level you can instead take an Epic Boon feat." },
        { name: "Metamagic (additional option)", level: 17, description: "You gain one additional Metamagic option of your choice, for a total of four." },
        { name: "Ability Score Improvement", level: 19, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature. At 19th level you can instead take an Epic Boon feat." },
        { name: "Arcane Apotheosis", level: 20, description: "You can convert Sorcery Points into a spell slot of any level up to 6th (rather than the normal maximum of 5th)." },
    ],
};
