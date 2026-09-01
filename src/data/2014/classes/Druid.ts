import { CharacterClass } from "@/interfaces/CharacterClass";
import { fullCasterProgression } from "@/interfaces/SpellSlotsProgression";

export const Druid: CharacterClass = {
    name: "Druid",
    edition: "2014",
    hitDie: 8,
    proficiencies: {
        armor: ["Light armor", "Medium armor", "Shield"],
        weapons: [
            "Clubs",
            "Daggers",
            "Darts",
            "Javelins",
            "Maces",
            "Quarterstaffs",
            "Scimitars",
            "Sickles",
            "Slings",
            "Spears",
        ],
        tools: ["Herbalism kit"],
        savingThrows: ["intelligence", "wisdom"],
        skills: { choose: 2, from: ["Arcana", "Animal Handling", "Insight", "Medicine", "Nature", "Perception", "Religion", "Survival"] },
    },
    multiclassProficiencies: {
        armor: ["Light armor", "Medium armor", "Shield"],
    },
    primaryAbility: "wisdom",
    casterProgression: "full",
    spellcasting: {
        ability: "wisdom",
        preparation: "prepared",
        ritualCasting: true,
        progression: fullCasterProgression,
    },
    subclassLevel: 2,
    features: [
        { name: "Druidic", level: 1, description: "You know Druidic, the secret language of druids. You can speak the language and use it to leave hidden messages. You and others who know this language automatically spot such a message. Others spot the message's presence with a successful DC 15 Wisdom (Perception) check but can't decipher it without magic. In addition, you can add the Druidic script to any spell you cast that has a visible physical effect that you can control - the spell's effect isn't changed, but you can incorporate the language into it." },
        { name: "Spellcasting", level: 1, description: "Drawing on the divine essence of nature itself, you can cast spells to shape that essence to your will. See the Spells section of this sheet for the spells you know or have prepared, your spell save DC, and your spell attack bonus." },
        { name: "Wild Shape", level: 2, description: "You can use your action to magically assume the shape of a beast that you have seen before. You can use this feature twice, regaining expended uses when you finish a short or long rest. Your druid level determines the beasts you can transform into, as shown in the Beast Shapes table (initially limited to a challenge rating of 1/4 with no swimming or flying speed). You can stay in a beast shape for a number of hours equal to half your druid level (rounded down), or until you drop to 0 hit points or die." },
        { name: "Wild Shape Improvement (swimming)", level: 4, description: "You can transform into a beast with a challenge rating as high as 1/2, and you can now transform into a beast with a swimming speed." },
        { name: "Ability Score Improvement", level: 4, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature." },
        { name: "Wild Shape Improvement (flying)", level: 8, description: "You can transform into a beast with a challenge rating as high as 1, and you can now transform into a beast with a flying speed." },
        { name: "Ability Score Improvement", level: 8, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature." },
        { name: "Ability Score Improvement", level: 12, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature." },
        { name: "Ability Score Improvement", level: 16, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature." },
        { name: "Timeless Body", level: 18, description: "The primal magic that you wield causes you to age more slowly. For every 10 years that pass, your body ages only 1 year." },
        { name: "Beast Spells", level: 18, description: "You can cast many of your druid spells in any shape you assume using Wild Shape. You can perform the somatic and verbal components of a druid spell while in a beast shape, but you aren't able to provide material components." },
        { name: "Ability Score Improvement", level: 19, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature." },
        { name: "Archdruid", level: 20, description: "You can use Wild Shape an unlimited number of times. Additionally, you can ignore the verbal and somatic components of your druid spells, as well as any material components that lack a cost and aren't consumed by a spell." },
    ],
};
