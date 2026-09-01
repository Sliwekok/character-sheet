import { CharacterClass } from "@/interfaces/CharacterClass";
import { fullCasterProgression } from "@/interfaces/SpellSlotsProgression";

// 2024 unified all casters onto a single 'prepared spells' model, but these three
// classes can only reselect their prepared spells on level-up (not after every long
// rest, unlike Cleric/Druid/Paladin/Ranger/Wizard) - not modeled by ClassSpellcasting
// yet, flagged here in case that distinction matters later.
export const Bard: CharacterClass = {
    name: "Bard",
    edition: "2024",
    hitDie: 8,
    proficiencies: {
        armor: ["Light armor"],
        weapons: ["Simple weapons"],
        tools: ["Choose three Musical Instruments"],
        savingThrows: ["dexterity", "charisma"],
        // Fixed: see the identical fix + comment in 2014/classes/Bard.ts -
        // this was `{ choose: 1, from: [] }`, an unsatisfiable empty pool.
        skills: { choose: 3, from: [
            "Athletics",
            "Acrobatics",
            "Sleight of Hand",
            "Stealth",
            "Arcana",
            "History",
            "Investigation",
            "Nature",
            "Religion",
            "Animal Handling",
            "Insight",
            "Medicine",
            "Perception",
            "Survival",
            "Deception",
            "Intimidation",
            "Performance",
            "Persuasion",
        ] },
    },
    multiclassProficiencies: {
        armor: ["Light armor"],
        tools: ["Choose one Musical Instrument"],
        skills: { choose: 1, from: [
            "Athletics",
            "Acrobatics",
            "Sleight of Hand",
            "Stealth",
            "Arcana",
            "History",
            "Investigation",
            "Nature",
            "Religion",
            "Animal Handling",
            "Insight",
            "Medicine",
            "Perception",
            "Survival",
            "Deception",
            "Intimidation",
            "Performance",
            "Persuasion",
        ] },
    },
    primaryAbility: "charisma",
    casterProgression: "full",
    spellcasting: {
        ability: "charisma",
        preparation: "prepared",
        ritualCasting: true,
        progression: fullCasterProgression,
    },
    subclassLevel: 3,
    // features authored from memory of the 2024 PHB (no web access) - worth a cross-check against your book.
    features: [
        { name: "Bardic Inspiration (d6)", level: 1, description: "You can inspire others through stirring words or music. As a Bonus Action, choose one creature other than yourself within 60 feet who can see or hear you and give it a Bardic Inspiration die, a d6. Once within the next hour, the creature can roll the die and add the number rolled to one ability check, attack roll, or saving throw it makes, after seeing the roll but before its result is applied. Once the die is rolled it's lost. You can use this feature a number of times equal to your Charisma modifier (minimum once), regaining all uses on a long rest." },
        { name: "Spellcasting", level: 1, description: "You have learned to untangle and reshape the fabric of reality in harmony with your wishes and music. See the Spells section of this sheet for the spells you know, your spell save DC, and your spell attack bonus." },
        { name: "Expertise", level: 2, description: "Choose two of your skill proficiencies. Your proficiency bonus is doubled for any ability check you make with either chosen proficiency. At 9th level, you can choose two more skill proficiencies to gain this benefit." },
        { name: "Jack of All Trades", level: 2, description: "You can add half your proficiency bonus, rounded down, to any ability check you make that doesn't already include your proficiency bonus." },
        { name: "Ability Score Improvement", level: 4, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature. At 19th level you can instead take an Epic Boon feat." },
        { name: "Bardic Inspiration (d8)", level: 5, description: "Your Bardic Inspiration die changes to a d8." },
        { name: "Font of Inspiration", level: 5, description: "You regain all of your expended uses of Bardic Inspiration when you finish a short or long rest." },
        { name: "Ability Score Improvement", level: 8, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature. At 19th level you can instead take an Epic Boon feat." },
        { name: "Expertise", level: 9, description: "You choose two more of your skill proficiencies to gain the Expertise benefit (doubled proficiency bonus)." },
        { name: "Bardic Inspiration (d10)", level: 10, description: "Your Bardic Inspiration die changes to a d10." },
        { name: "Magical Secrets", level: 10, description: "You have plundered magical knowledge from a wide spectrum of disciplines. Choose two spells from any class's spell list; each must be of a level you can cast. The chosen spells count as bard spells for you. You learn two additional spells from any class at 14th and 18th level." },
        { name: "Ability Score Improvement", level: 12, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature. At 19th level you can instead take an Epic Boon feat." },
        { name: "Magical Secrets", level: 14, description: "You learn two additional spells from any class, as described at 10th level." },
        { name: "Bardic Inspiration (d12)", level: 15, description: "Your Bardic Inspiration die changes to a d12." },
        { name: "Ability Score Improvement", level: 16, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature. At 19th level you can instead take an Epic Boon feat." },
        { name: "Magical Secrets", level: 18, description: "You learn two additional spells from any class, as described at 10th level." },
        { name: "Ability Score Improvement", level: 19, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature. At 19th level you can instead take an Epic Boon feat." },
        { name: "Superior Inspiration", level: 20, description: "When you roll Initiative and have no uses of Bardic Inspiration left, you regain one use." },
    ],
};
