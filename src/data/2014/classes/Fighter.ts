import { CharacterClass } from "@/interfaces/CharacterClass";

export const Fighter: CharacterClass = {
    name: "Fighter",
    edition: "2014",
    hitDie: 10,
    proficiencies: {
        armor: ["Light armor", "Medium armor", "Heavy armor", "Shields"],
        weapons: ["Simple weapons", "Martial weapons"],
        savingThrows: ["strength", "constitution"],
        skills: { choose: 2, from: ["Acrobatics", "Animal Handling", "Athletics", "History", "Insight", "Intimidation", "Perception", "Survival"] },
    },
    multiclassProficiencies: {
        armor: ["Light armor", "Medium armor", "Shields"],
        weapons: ["Simple weapons", "Martial weapons"],
    },
    primaryAbility: "strength",
    casterProgression: "none",
    subclassLevel: 3,
    features: [
        { name: "Fighting Style", level: 1, description: "You adopt a particular style of fighting as your specialty, choosing from options such as Archery, Defense, Dueling, Great Weapon Fighting, Protection, or Two-Weapon Fighting. You can't take the same Fighting Style option more than once, even if you get to choose again from a different class feature." },
        { name: "Second Wind", level: 1, description: "You have a limited well of stamina that you can draw on to protect yourself from harm. On your turn, you can use a bonus action to regain hit points equal to 1d10 + your fighter level. Once you use this feature, you must finish a short or long rest before you can use it again." },
        { name: "Action Surge (one use)", level: 2, description: "You can push yourself beyond your normal limits for a moment. On your turn, you can take one additional action on top of your regular action and a possible bonus action. Once you use this feature, you must finish a short or long rest before you can use it again. Starting at 17th level, you can use it twice before a rest, but only once on the same turn." },
        { name: "Ability Score Improvement", level: 4, description: "When you reach 4th level, and again at 6th, 8th, 12th, 14th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature." },
        { name: "Extra Attack", level: 5, description: "You can attack twice, instead of once, whenever you take the Attack action on your turn." },
        { name: "Ability Score Improvement", level: 6, description: "When you reach 4th level, and again at 6th, 8th, 12th, 14th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature." },
        { name: "Ability Score Improvement", level: 8, description: "When you reach 4th level, and again at 6th, 8th, 12th, 14th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature." },
        { name: "Indomitable (one use)", level: 9, description: "You can reroll a saving throw that you fail. If you do so, you must use the new roll, and you can't use this feature again until you finish a long rest. You can use it twice between long rests starting at 13th level and three times starting at 17th level." },
        { name: "Extra Attack (2)", level: 11, description: "You can attack three times, instead of twice, whenever you take the Attack action on your turn." },
        { name: "Ability Score Improvement", level: 12, description: "When you reach 4th level, and again at 6th, 8th, 12th, 14th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature." },
        { name: "Indomitable (two uses)", level: 13, description: "You can use your Indomitable feature twice between long rests." },
        { name: "Ability Score Improvement", level: 14, description: "When you reach 4th level, and again at 6th, 8th, 12th, 14th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature." },
        { name: "Ability Score Improvement", level: 16, description: "When you reach 4th level, and again at 6th, 8th, 12th, 14th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature." },
        { name: "Action Surge (two uses)", level: 17, description: "You can use Action Surge twice before a rest, but only once on the same turn." },
        { name: "Indomitable (three uses)", level: 17, description: "You can use your Indomitable feature three times between long rests." },
        { name: "Ability Score Improvement", level: 19, description: "When you reach 4th level, and again at 6th, 8th, 12th, 14th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature." },
        { name: "Extra Attack (3)", level: 20, description: "You can attack four times, instead of three, whenever you take the Attack action on your turn." },
    ],
};
