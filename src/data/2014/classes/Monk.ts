import { CharacterClass } from "@/interfaces/CharacterClass";

export const Monk: CharacterClass = {
    name: "Monk",
    edition: "2014",
    hitDie: 8,
    proficiencies: {
        armor: [],
        weapons: ["Simple weapons", "Shortswords"],
        tools: ["Any one type of artisan's tools or any one musical instrument of your choice"],
        savingThrows: ["strength", "dexterity"],
        skills: { choose: 2, from: ["Acrobatics", "Athletics", "History", "Insight", "Religion", "Stealth"] },
    },
    multiclassProficiencies: {
        weapons: ["Simple weapons", "Shortswords"],
    },
    primaryAbility: "dexterity",
    casterProgression: "none",
    subclassLevel: 3,
    // features verified against 5etools' class-monk.json (PHB source) - already accurate;
    // no corrections needed.
    features: [
        { name: "Unarmored Defense", level: 1, description: "While you are wearing no armor and not wielding a shield, your Armor Class equals 10 + your Dexterity modifier + your Wisdom modifier." },
        { name: "Martial Arts", level: 1, description: "Your practice of martial arts gives you mastery of combat styles that use unarmed strikes and monk weapons (shortswords and simple melee weapons that don't have the two-handed or heavy property). You gain the following benefits while unarmed or wielding only monk weapons and not wearing armor or wielding a shield: you can use Dexterity instead of Strength for the attack and damage rolls of your unarmed strikes and monk weapons; you can roll a d4 in place of the normal damage of your unarmed strike or monk weapon (this die changes as you gain monk levels, per the Martial Arts column of the Monk table: d4 at 1st, d6 at 5th, d8 at 11th, d10 at 17th); and when you use the Attack action with an unarmed strike or monk weapon, you can make one unarmed strike as a bonus action." },
        { name: "Ki", level: 2, description: "You have a number of ki points equal to your monk level, which fuel various ki features. You regain all expended ki points when you finish a short or long rest. You can spend 1 ki point to use Flurry of Blows (make two unarmed strikes as a bonus action), Patient Defense (take the Dodge action as a bonus action), or Step of the Wind (take the Disengage or Dash action as a bonus action, and your jump distance is doubled for the turn)." },
        { name: "Unarmored Movement", level: 2, description: "Your speed increases by 10 feet while you are not wearing armor or wielding a shield. This bonus increases as you gain monk levels (to +15 ft at 6th, +20 ft at 10th, +25 ft at 14th, +30 ft at 18th). At 9th level, you gain the ability to move along vertical surfaces and across liquids on your turn without falling during the move." },
        { name: "Deflect Missiles", level: 3, description: "You can use your reaction to deflect or catch a missile when you are hit by a ranged weapon attack. When you do so, the damage you take from the attack is reduced by 1d10 + your Dexterity modifier + your monk level. If you reduce the damage to 0, you can catch the missile if it is small enough for you to hold in one hand and you have at least one hand free, and can then spend 1 ki point to make a ranged attack with the weapon or piece of ammunition, as part of the same reaction." },
        { name: "Slow Fall", level: 4, description: "You can use your reaction when you fall to reduce any falling damage you take by an amount equal to five times your monk level." },
        { name: "Ability Score Improvement", level: 4, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature." },
        { name: "Extra Attack", level: 5, description: "You can attack twice, instead of once, whenever you take the Attack action on your turn." },
        { name: "Stunning Strike", level: 5, description: "When you hit another creature with a melee weapon attack, you can spend 1 ki point to attempt a stunning strike. The target must succeed on a Constitution saving throw or be stunned until the end of your next turn." },
        { name: "Ki-Empowered Strikes", level: 6, description: "Your unarmed strikes count as magical for the purpose of overcoming resistance and immunity to nonmagical attacks and damage." },
        { name: "Evasion", level: 7, description: "When you are subjected to an effect that allows you to make a Dexterity saving throw to take only half damage, you instead take no damage if you succeed on the saving throw, and only half damage if you fail." },
        { name: "Stillness of Mind", level: 7, description: "You can use your action to end one effect on yourself that is causing you to be charmed or frightened." },
        { name: "Ability Score Improvement", level: 8, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature." },
        { name: "Purity of Body", level: 10, description: "Your mastery of the ki flowing through you makes you immune to disease and poison." },
        { name: "Ability Score Improvement", level: 12, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature." },
        { name: "Tongue of the Sun and Moon", level: 13, description: "You learn to touch the ki of other minds so that you understand all spoken languages, and any creature that can understand a language can understand what you say." },
        { name: "Diamond Soul", level: 14, description: "Your mastery of ki grants you proficiency in all saving throws. Additionally, whenever you make a saving throw and fail, you can spend 1 ki point to reroll it and take the second result." },
        { name: "Timeless Body", level: 15, description: "Your ki sustains you so that you suffer none of the frailty of old age, and you can't be aged magically. You can still die of old age, however. In addition, you no longer need food or water." },
        { name: "Ability Score Improvement", level: 16, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature." },
        { name: "Empty Body", level: 18, description: "You can spend 4 ki points to become invisible for 1 minute, as well as have resistance to all damage but force damage during that time. Additionally, you can spend 8 ki points to cast astral projection, without expending a material component." },
        { name: "Ability Score Improvement", level: 19, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature." },
        { name: "Perfect Self", level: 20, description: "When you roll initiative and have no ki points remaining, you regain 4 ki points." },
    ],
};
