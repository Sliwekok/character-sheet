import { CharacterClass } from "@/interfaces/CharacterClass";
import { halfCasterProgression } from "@/interfaces/SpellSlotsProgression";

// weaponMasteryProgression was previously missing entirely. Filled in to match the
// same {1,4,10} breakpoints and counts already sourced from 5etools for Barbarian
// (Fighter alone gets an extra step at 16) - worth a cross-check against your book.
export const Paladin: CharacterClass = {
    name: "Paladin",
    edition: "2024",
    hitDie: 10,
    proficiencies: {
        armor: ["Light armor", "Medium armor", "Heavy armor", "Shields"],
        weapons: ["Simple weapons", "Martial weapons"],
        savingThrows: ["wisdom", "charisma"],
        skills: { choose: 2, from: ["Athletics", "Insight", "Intimidation", "Medicine", "Persuasion", "Religion"] },
    },
    multiclassProficiencies: {
        armor: ["Light armor", "Medium armor", "Shields"],
        weapons: ["Martial weapons"],
    },
    primaryAbility: "strength",
    casterProgression: "half",
    spellcasting: {
        ability: "charisma",
        preparation: "prepared",
        progression: halfCasterProgression,
    },
    subclassLevel: 3,
    weaponMasteryProgression: { 1: 2, 4: 3, 10: 4 },
    // features authored from memory of the 2024 PHB (no web access) - worth a cross-check against your book.
    features: [
        { name: "Lay on Hands", level: 1, description: "Your blessed touch can heal wounds. You have a pool of healing power that replenishes when you take a Long Rest, with a number of hit points equal to your paladin level × 5. As an action, you can touch a creature and draw power from the pool to restore hit points, up to the maximum remaining. You can also expend 5 hit points from the pool to cure the target of one disease or neutralize one poison, instead of restoring hit points." },
        { name: "Spellcasting", level: 1, description: "You have learned to draw on divine magic through meditation and prayer to cast spells as a cleric does. See the Spells section of this sheet for the spells you have prepared, your spell save DC, and your spell attack bonus." },
        { name: "Weapon Mastery", level: 1, description: "Your training allows you to use the mastery properties of two kinds of weapons of your choice with which you have proficiency. Whenever you finish a Long Rest, you can change one of your choices. This number increases as you gain levels in this class." },
        { name: "Fighting Style", level: 2, description: "You adopt a particular style of fighting as your specialty, such as Defense, Dueling, Great Weapon Fighting, or Protection. You can't take the same Fighting Style option more than once, even if you get to choose again." },
        { name: "Divine Smite", level: 2, description: "When you hit a creature with a melee weapon or Unarmed Strike attack, you can expend one spell slot to deal radiant damage to the target, in addition to the attack's damage. The extra damage is 2d8 for a 1st-level slot, plus 1d8 for each spell level higher than 1st, to a maximum of 5d8. The damage increases by 1d8 if the target is an undead or a fiend." },
        { name: "Ability Score Improvement", level: 4, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature. At 19th level you can instead take an Epic Boon feat." },
        { name: "Extra Attack", level: 5, description: "You can attack twice, instead of once, whenever you take the Attack action on your turn." },
        { name: "Faithful Steed", level: 5, description: "You can cast the find steed spell without expending a spell slot, once per Long Rest, or via a spell slot for additional uses." },
        { name: "Aura of Protection", level: 6, description: "Whenever you or a friendly creature within 10 feet of you must make a saving throw, that creature gains a bonus equal to your Charisma modifier (minimum +1). You must be conscious to grant this bonus. The range increases to 30 feet at 18th level." },
        { name: "Ability Score Improvement", level: 8, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature. At 19th level you can instead take an Epic Boon feat." },
        { name: "Abjure Foes", level: 9, description: "As a Bonus Action, you can present your Holy Symbol and speak a prayer of denunciation, using your Channel Divinity, and frighten one creature you can see within 60 feet of you that has a challenge rating or level equal to or less than your paladin level, unless it succeeds on a Wisdom saving throw." },
        { name: "Aura of Courage", level: 10, description: "You and friendly creatures within 10 feet of you can't be frightened while you are conscious. The range increases to 30 feet at 18th level." },
        { name: "Ability Score Improvement", level: 12, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature. At 19th level you can instead take an Epic Boon feat." },
        { name: "Restoring Touch", level: 14, description: "You can use your Lay on Hands to also end one of the following conditions on the target for every 5 hit points you expend: Blinded, Charmed, Deafened, Frightened, Paralyzed, or Stunned." },
        { name: "Ability Score Improvement", level: 16, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature. At 19th level you can instead take an Epic Boon feat." },
        { name: "Aura Expansion", level: 18, description: "The range of your Aura of Protection and Aura of Courage increases to 30 feet." },
        { name: "Ability Score Improvement", level: 19, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature. At 19th level you can instead take an Epic Boon feat." },
    ],
};
