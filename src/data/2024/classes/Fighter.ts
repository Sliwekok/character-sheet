import { CharacterClass } from "@/interfaces/CharacterClass";

// weaponMasteryProgression sourced directly from 5etools' class table data (not
// hand-recalled) - still worth a quick cross-check against your book.
export const Fighter: CharacterClass = {
    name: "Fighter",
    edition: "2024",
    hitDie: 10,
    proficiencies: {
        armor: ["Light armor", "Medium armor", "Heavy armor", "Shields"],
        weapons: ["Simple weapons", "Martial weapons"],
        savingThrows: ["strength", "constitution"],
        skills: { choose: 2, from: [
            "Acrobatics",
            "Animal Handling",
            "Athletics",
            "History",
            "Insight",
            "Intimidation",
            "Persuasion",
            "Perception",
            "Survival",
        ] },
    },
    multiclassProficiencies: {
        armor: ["Light armor", "Medium armor", "Shields"],
        weapons: ["Martial weapons"],
    },
    primaryAbility: "strength",
    casterProgression: "none",
    subclassLevel: 3,
    weaponMasteryProgression: { 1: 3, 4: 4, 10: 5, 16: 6 },
    // features authored from memory of the 2024 PHB (no web access) - worth a cross-check against your book.
    features: [
        { name: "Fighting Style", level: 1, description: "You adopt a particular style of fighting as your specialty, choosing from options such as Archery, Blind Fighting, Defense, Dueling, Great Weapon Fighting, Interception, Protection, Thrown Weapon Fighting, Two-Weapon Fighting, or Unarmed Fighting. You can't take the same Fighting Style option more than once, even if you get to choose again." },
        { name: "Second Wind", level: 1, description: "You have a limited well of stamina you can draw on to protect yourself from harm. On your turn, you can use a Bonus Action to regain hit points equal to 1d10 plus your fighter level. You can use this feature twice, and you regain one expended use when you finish a Short Rest and all expended uses when you finish a Long Rest." },
        { name: "Weapon Mastery", level: 1, description: "Your training allows you to use the mastery properties of three kinds of weapons of your choice with which you have proficiency. Whenever you finish a Long Rest, you can practice with weapons and change one of your choices. When you reach certain Fighter levels, you gain the ability to use the mastery property of more kinds of weapons, as shown in the Weapon Mastery column of the class table." },
        { name: "Action Surge (one use)", level: 2, description: "You can push yourself beyond your normal limits for a moment. On your turn, you can take one additional action, except the Magic action. Once you use this feature, you must finish a Short or Long Rest before you can use it again. Starting at 17th level, you can use it twice before a rest, but only once on the same turn." },
        { name: "Tactical Mind", level: 2, description: "You have a knack for spotting the tactical dimensions of a task. When you fail an ability check, you can expend a use of your Second Wind (no action required) to add 1d10 to the roll, potentially turning it into a success. If it remains a failure, the use of Second Wind isn't expended." },
        { name: "Ability Score Improvement", level: 4, description: "When you reach 4th level, and again at 6th, 8th, 12th, 14th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature. At 19th level you can instead take an Epic Boon feat." },
        { name: "Extra Attack", level: 5, description: "You can attack twice, instead of once, whenever you take the Attack action on your turn." },
        { name: "Tactical Shift", level: 5, description: "Whenever you activate your Second Wind with a bonus action, you can move up to half your speed without provoking Opportunity Attacks, either before or after using Second Wind." },
        { name: "Ability Score Improvement", level: 6, description: "When you reach 4th level, and again at 6th, 8th, 12th, 14th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature. At 19th level you can instead take an Epic Boon feat." },
        { name: "Ability Score Improvement", level: 8, description: "When you reach 4th level, and again at 6th, 8th, 12th, 14th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature. At 19th level you can instead take an Epic Boon feat." },
        { name: "Indomitable (one use)", level: 9, description: "You can reroll a saving throw that you fail, and must use the new roll. You can use this feature twice between Long Rests starting at 13th level and three times starting at 17th level." },
        { name: "Extra Attack (2)", level: 11, description: "You can attack three times, instead of twice, whenever you take the Attack action on your turn." },
        { name: "Ability Score Improvement", level: 12, description: "When you reach 4th level, and again at 6th, 8th, 12th, 14th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature. At 19th level you can instead take an Epic Boon feat." },
        { name: "Indomitable (two uses)", level: 13, description: "You can use your Indomitable feature twice between Long Rests." },
        { name: "Ability Score Improvement", level: 14, description: "When you reach 4th level, and again at 6th, 8th, 12th, 14th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature. At 19th level you can instead take an Epic Boon feat." },
        { name: "Ability Score Improvement", level: 16, description: "When you reach 4th level, and again at 6th, 8th, 12th, 14th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature. At 19th level you can instead take an Epic Boon feat." },
        { name: "Action Surge (two uses)", level: 17, description: "You can use Action Surge twice before a rest, but only once on the same turn." },
        { name: "Indomitable (three uses)", level: 17, description: "You can use your Indomitable feature three times between Long Rests." },
        { name: "Ability Score Improvement", level: 19, description: "When you reach 4th level, and again at 6th, 8th, 12th, 14th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature. At 19th level you can instead take an Epic Boon feat." },
        { name: "Extra Attack (3)", level: 20, description: "You can attack four times, instead of three, whenever you take the Attack action on your turn." },
    ],
};
