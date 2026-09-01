import { CharacterClass } from "@/interfaces/CharacterClass";
import { fullCasterProgression } from "@/interfaces/SpellSlotsProgression";

export const Wizard: CharacterClass = {
    name: "Wizard",
    edition: "2014",
    hitDie: 6,
    proficiencies: {
        armor: [],
        weapons: ["Daggers", "Darts", "Slings", "Quarterstaffs", "Light crossbows"],
        savingThrows: ["intelligence", "wisdom"],
        skills: { choose: 2, from: ["Arcana", "History", "Insight", "Investigation", "Medicine", "Religion"] },
    },
    primaryAbility: "intelligence",
    casterProgression: "full",
    spellcasting: {
        ability: "intelligence",
        preparation: "prepared",
        ritualCasting: true,
        progression: fullCasterProgression,
    },
    subclassLevel: 2,
    features: [
        { name: "Spellcasting", level: 1, description: "As a student of arcane magic, you have a spellbook containing spells that show the first glimmerings of your true power. See the Spells section of this sheet for the spells you know or have prepared, your spell save DC, and your spell attack bonus." },
        { name: "Arcane Recovery", level: 1, description: "You have learned to regain some of your magical energy by studying your spellbook. Once per day when you finish a short rest, you can choose expended spell slots to recover, with a combined level equal to or less than half your wizard level (rounded up), and none of the slots can be 6th level or higher." },
        { name: "Ability Score Improvement", level: 4, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature." },
        { name: "Ability Score Improvement", level: 8, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature." },
        { name: "Ability Score Improvement", level: 12, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature." },
        { name: "Ability Score Improvement", level: 16, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature." },
        { name: "Spell Mastery", level: 18, description: "You have achieved such mastery over certain spells that you can cast them at will. Choose a 1st-level wizard spell and a 2nd-level wizard spell that are in your spellbook. You can cast those spells at their lowest level without expending a spell slot when you have them prepared. If you want to cast either spell at a higher level, you must expend a spell slot as normal." },
        { name: "Ability Score Improvement", level: 19, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature." },
        { name: "Signature Spells", level: 20, description: "You gain mastery over two powerful spells and can cast them with little effort. Choose two 3rd-level wizard spells in your spellbook as your signature spells. You always have these spells prepared, they don't count against the number of spells you have prepared, and you can cast each of them once at 3rd level without expending a spell slot. When you do so, you can't do so again until you finish a short or long rest." },
    ],
};
