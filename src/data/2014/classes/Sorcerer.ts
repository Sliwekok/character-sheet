import { CharacterClass } from "@/interfaces/CharacterClass";
import { fullCasterProgression } from "@/interfaces/SpellSlotsProgression";

export const Sorcerer: CharacterClass = {
    name: "Sorcerer",
    edition: "2014",
    hitDie: 6,
    proficiencies: {
        armor: [],
        weapons: ["Daggers", "Darts", "Slings", "Quarterstaffs", "Light crossbows"],
        savingThrows: ["constitution", "charisma"],
        skills: { choose: 2, from: ["Arcana", "Deception", "Insight", "Intimidation", "Persuasion", "Religion"] },
    },
    primaryAbility: "charisma",
    casterProgression: "full",
    spellcasting: {
        ability: "charisma",
        preparation: "known",
        progression: fullCasterProgression,
    },
    subclassLevel: 1,
    features: [
        { name: "Spellcasting", level: 1, description: "An event in your past, or in the life of a parent or ancestor, left an indelible mark on you, infusing you with arcane magic. See the Spells section of this sheet for the spells you know, your spell save DC, and your spell attack bonus." },
        { name: "Font of Magic", level: 2, description: "You tap into a deep wellspring of magic within yourself, represented by sorcery points, equal to your sorcerer level. You can spend these points to fuel various magical effects. You can transform unexpended sorcery points into one spell slot as a bonus action, or transform a spell slot you have not used into a number of sorcery points equal to the slot's level (both once per turn)." },
        { name: "Metamagic", level: 3, description: "You gain the ability to twist your spells to suit your needs. You gain two Metamagic options of your choice, such as Careful Spell, Distant Spell, Empowered Spell, Extended Spell, Heightened Spell, Quickened Spell, Subtle Spell, or Twinned Spell. You can use only one Metamagic option on a spell when you cast it, unless the option says otherwise. You gain one additional Metamagic option at 10th level and again at 17th level." },
        { name: "Ability Score Improvement", level: 4, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature." },
        { name: "Ability Score Improvement", level: 8, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature." },
        { name: "Metamagic (additional option)", level: 10, description: "You gain one additional Metamagic option of your choice." },
        { name: "Ability Score Improvement", level: 12, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature." },
        { name: "Ability Score Improvement", level: 16, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature." },
        { name: "Metamagic (additional option)", level: 17, description: "You gain one additional Metamagic option of your choice, for a total of four." },
        { name: "Ability Score Improvement", level: 19, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature." },
        { name: "Sorcerous Restoration", level: 20, description: "You regain 4 expended sorcery points whenever you finish a short rest." },
    ],
};
