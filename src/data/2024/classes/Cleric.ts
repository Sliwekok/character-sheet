import { CharacterClass } from "@/interfaces/CharacterClass";
import { fullCasterProgression } from "@/interfaces/SpellSlotsProgression";

export const Cleric: CharacterClass = {
    name: "Cleric",
    edition: "2024",
    hitDie: 8,
    proficiencies: {
        armor: ["Light armor", "Medium armor", "Shields"],
        weapons: ["Simple weapons"],
        savingThrows: ["wisdom", "charisma"],
        skills: { choose: 2, from: ["History", "Insight", "Medicine", "Persuasion", "Religion"] },
    },
    multiclassProficiencies: {
        armor: ["Light armor", "Medium armor", "Shields"],
    },
    primaryAbility: "wisdom",
    casterProgression: "full",
    spellcasting: {
        ability: "wisdom",
        preparation: "prepared",
        ritualCasting: true,
        progression: fullCasterProgression,
    },
    subclassLevel: 3,
    // features authored from memory of the 2024 PHB (no web access) - worth a cross-check against your book.
    features: [
        { name: "Spellcasting", level: 1, description: "As a conduit for divine power, you can cast cleric spells. See the Spells section of this sheet for the spells you have prepared, your spell save DC, and your spell attack bonus." },
        { name: "Divine Order", level: 1, description: "You have dedicated yourself to one of the following sacred roles of your choice. Protector: you gain proficiency with Martial weapons and training with Heavy armor. Thaumaturge: you learn one extra cantrip from the cleric spell list, and you add your Wisdom modifier (minimum +1) to the check you make to recall lore with an Intelligence (Religion) check." },
        { name: "Channel Divinity (2/rest)", level: 2, description: "You gain the ability to channel divine energy directly from your deity, using it to fuel magical effects. Every cleric has the Turn Undead Channel Divinity option, and your Divine Domain grants another. You can use your Channel Divinity twice, regaining all expended uses when you finish a short or long rest; the number of uses increases as you gain levels in this class." },
        { name: "Ability Score Improvement", level: 4, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature. At 19th level you can instead take an Epic Boon feat." },
        { name: "Sear Undead", level: 5, description: "When you use your Turn Undead Channel Divinity option, any undead creature that fails its saving throw takes Radiant damage equal to your cleric level, in addition to being turned." },
        { name: "Ability Score Improvement", level: 8, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature. At 19th level you can instead take an Epic Boon feat." },
        { name: "Divine Intervention", level: 10, description: "You can call on your deity to intervene on your behalf when your need is great. As an action, choose the effect of any cleric spell of level 5 or lower; you cast that spell without expending a spell slot or needing the components. Once you use this feature, you can't use it again until you finish a long rest." },
        { name: "Ability Score Improvement", level: 12, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature. At 19th level you can instead take an Epic Boon feat." },
        { name: "Ability Score Improvement", level: 16, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature. At 19th level you can instead take an Epic Boon feat." },
        { name: "Greater Divine Intervention", level: 17, description: "You can now choose the effect of any cleric spell when you use Divine Intervention, including one of 6th level or higher if you can cast it." },
        { name: "Ability Score Improvement", level: 19, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature. At 19th level you can instead take an Epic Boon feat." },
        { name: "Improved Divine Intervention", level: 20, description: "You can use your Divine Intervention feature twice, and you regain one expended use whenever you finish a short rest." },
    ],
};
