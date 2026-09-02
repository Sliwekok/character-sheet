import { CharacterClass } from "@/interfaces/CharacterClass";
import { fullCasterProgression } from "@/interfaces/SpellSlotsProgression";

export const Cleric: CharacterClass = {
    name: "Cleric",
    edition: "2014",
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
    subclassLevel: 1,
    // features text verified against 5etools' class-cleric.json (PHB source) - https://5e.tools/classes.html#cleric_phb
    // Already accurate: no corrections needed (Channel Divinity, Destroy Undead thresholds,
    // Divine Intervention wording, and the Ability Score Improvement levels all match source).
    features: [
        { name: "Spellcasting", level: 1, description: "As a conduit for divine power, you can cast cleric spells. See the Spells section of this sheet for the spells you know or have prepared, your spell save DC, and your spell attack bonus." },
        { name: "Channel Divinity (1/rest)", level: 2, description: "You gain the ability to channel divine energy directly from your deity, using it to fuel magical effects. Every cleric has the Turn Undead Channel Divinity option: as an action, you present your holy symbol and each undead creature that can see or hear you within 30 feet must make a Wisdom saving throw or be turned for 1 minute or until it takes damage. Your Divine Domain grants you a second Channel Divinity option of its own. You can use your Channel Divinity once per short or long rest, increasing to twice at 6th level and three times at 18th level; you must finish a rest to regain expended uses." },
        { name: "Ability Score Improvement", level: 4, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature." },
        { name: "Destroy Undead (CR 1/2)", level: 5, description: "When an undead fails its saving throw against your Turn Undead feature, it is instantly destroyed if its challenge rating is at or below the threshold shown here: CR 1/2 at 5th level, CR 1 at 8th, CR 2 at 11th, CR 3 at 14th, and CR 4 at 17th." },
        { name: "Channel Divinity (2/rest)", level: 6, description: "You can use your Channel Divinity twice between rests, and your Divine Domain's 2nd Channel Divinity feature (if any) becomes available." },
        { name: "Ability Score Improvement", level: 8, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature." },
        { name: "Destroy Undead (CR 1)", level: 8, description: "The challenge rating threshold for your Destroy Undead feature rises to CR 1." },
        { name: "Divine Intervention", level: 10, description: "You can call on your deity to intervene on your behalf when your need is great. Imploring your deity's aid requires you to use your action. Describe the assistance you seek, and roll percentile dice. If you roll a number equal to or lower than your cleric level, your deity intervenes (the DM chooses the nature of the intervention; the effect of any cleric spell or cleric domain spell would be appropriate). If your deity intervenes, you can't use this feature again for 7 days; otherwise, you can use it again after a long rest. At 20th level, your call for intervention succeeds automatically, no roll required." },
        { name: "Destroy Undead (CR 2)", level: 11, description: "The challenge rating threshold for your Destroy Undead feature rises to CR 2." },
        { name: "Ability Score Improvement", level: 12, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature." },
        { name: "Destroy Undead (CR 3)", level: 14, description: "The challenge rating threshold for your Destroy Undead feature rises to CR 3." },
        { name: "Ability Score Improvement", level: 16, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature." },
        { name: "Destroy Undead (CR 4)", level: 17, description: "The challenge rating threshold for your Destroy Undead feature rises to CR 4." },
        { name: "Channel Divinity (3/rest)", level: 18, description: "You can use your Channel Divinity three times between rests. You must finish a short or long rest to regain expended uses." },
        { name: "Ability Score Improvement", level: 19, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature." },
        { name: "Divine Intervention Improvement", level: 20, description: "Your call for intervention from your deity succeeds automatically, no roll required." },
    ],
};
