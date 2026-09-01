import { CharacterClass } from "@/interfaces/CharacterClass";
import { halfCasterProgression } from "@/interfaces/SpellSlotsProgression";

export const Ranger: CharacterClass = {
    name: "Ranger",
    edition: "2014",
    hitDie: 10,
    proficiencies: {
        armor: ["Light armor", "Medium armor", "Shields"],
        weapons: ["Simple weapons", "Martial weapons"],
        savingThrows: ["strength", "dexterity"],
        skills: { choose: 3, from: ["Animal Handling", "Athletics", "Insight", "Investigation", "Nature", "Perception", "Stealth", "Survival"] },
    },
    multiclassProficiencies: {
        armor: ["Light armor", "Medium armor", "Shields"],
        weapons: ["Simple weapons", "Martial weapons"],
        skills: { choose: 1, from: ["Animal Handling", "Athletics", "Insight", "Investigation", "Nature", "Perception", "Stealth", "Survival"] },
    },
    primaryAbility: "dexterity",
    casterProgression: "half",
    spellcasting: {
        ability: "wisdom",
        preparation: "known",
        progression: halfCasterProgression,
    },
    subclassLevel: 3,
    features: [
        { name: "Favored Enemy", level: 1, description: "You have significant experience studying, tracking, hunting, and even talking to a certain type of enemy. Choose a type of favored enemy: aberrations, beasts, celestials, constructs, dragons, elementals, fey, fiends, giants, monstrosities, oozes, plants, undead, or two races of humanoid. You have advantage on Wisdom (Survival) checks to track your favored enemies, as well as on Intelligence checks to recall information about them. You also learn one language of your choice spoken by your favored enemy, if it speaks one at all. You choose one additional favored enemy, as well as an associated language, at 6th and 14th level." },
        { name: "Natural Explorer", level: 1, description: "You are particularly familiar with one type of natural environment and are adept at traveling and surviving in such regions. Choose a favored terrain type; while traveling for an hour or more in it you gain a suite of benefits (difficult terrain doesn't slow your group's travel, your group can't become lost except by magical means, you remain alert to danger even while doing other tasks, you can move stealthily at a normal pace when alone, you find twice as much food when foraging, and you learn the number of creatures, their sizes, and the direction they moved if you are tracking others). You choose an additional favored terrain at 6th and 10th level." },
        { name: "Fighting Style", level: 2, description: "You adopt a particular style of fighting as your specialty, such as Archery, Defense, Dueling, or Two-Weapon Fighting. You can't take the same Fighting Style option more than once, even if you get to choose again from a different class feature." },
        { name: "Spellcasting", level: 2, description: "You have learned to use the magical essence of nature to cast spells, much as a druid does. See the Spells section of this sheet for the spells you know, your spell save DC, and your spell attack bonus." },
        { name: "Primeval Awareness", level: 3, description: "You can use your action and expend one spell slot to focus your awareness on the region around you. For 1 minute per level of the spell slot you expend, you can sense whether aberrations, celestials, dragons, elementals, fey, fiends, and undead are present within 1 mile of you (or 6 miles if you are in your favored terrain). This feature doesn't reveal the creatures' location or numbers." },
        { name: "Ability Score Improvement", level: 4, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature." },
        { name: "Extra Attack", level: 5, description: "You can attack twice, instead of once, whenever you take the Attack action on your turn." },
        { name: "Favored Enemy Improvement", level: 6, description: "You choose an additional favored enemy and an associated language." },
        { name: "Natural Explorer Improvement", level: 6, description: "You choose an additional favored terrain." },
        { name: "Land's Stride", level: 8, description: "Moving through nonmagical difficult terrain costs you no extra movement, and you can pass through nonmagical plants without being slowed by them and without taking damage from them if they have thorns, spines, or a similar hazard. You also have advantage on saving throws against plants that are magically created or manipulated to impede movement." },
        { name: "Ability Score Improvement", level: 8, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature." },
        { name: "Hide in Plain Sight", level: 10, description: "You can spend 1 minute creating camouflage for yourself using natural materials. Once you are camouflaged, you can try to hide by pressing yourself up against a solid surface, remaining still, and not moving or taking actions. Until you move or take an action, you gain a +10 bonus to Dexterity (Stealth) checks." },
        { name: "Ability Score Improvement", level: 12, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature." },
        { name: "Vanish", level: 14, description: "You can use the Hide action as a bonus action on your turn. Also, you can't be tracked by nonmagical means, unless you choose to leave a trail." },
        { name: "Favored Enemy Improvement", level: 14, description: "You choose an additional favored enemy and an associated language, for a total of three favored enemies." },
        { name: "Ability Score Improvement", level: 16, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature." },
        { name: "Feral Senses", level: 18, description: "You gain preternatural senses that help you fight creatures you can't see. When you attack a creature you can't see, your inability to see it doesn't impose disadvantage on your attack rolls against it. You are also aware of the location of any invisible creature within 30 feet of you, provided that the creature isn't hidden from you and you aren't blinded or deafened." },
        { name: "Ability Score Improvement", level: 19, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature." },
        { name: "Foe Slayer", level: 20, description: "Once per turn, you can add your Wisdom modifier to the attack roll or the damage roll of an attack you make against one of your favored enemies. You can choose to use this feature before or after the roll, but before any effects of the roll are applied." },
    ],
};
