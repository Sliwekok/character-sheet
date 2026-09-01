import { CharacterClass } from "@/interfaces/CharacterClass";
import { halfCasterProgression } from "@/interfaces/SpellSlotsProgression";

// weaponMasteryProgression was previously missing entirely. Filled in to match the
// same {1,4,10} breakpoints and counts already sourced from 5etools for Barbarian
// (Fighter alone gets an extra step at 16) - worth a cross-check against your book.
export const Ranger: CharacterClass = {
    name: "Ranger",
    edition: "2024",
    hitDie: 10,
    proficiencies: {
        armor: ["Light armor", "Medium armor", "Shields"],
        weapons: ["Simple weapons", "Martial weapons"],
        savingThrows: ["strength", "dexterity"],
        skills: { choose: 3, from: ["Animal Handling", "Athletics", "Insight", "Investigation", "Nature", "Perception", "Stealth", "Survival"] },
    },
    multiclassProficiencies: {
        armor: ["Light armor", "Medium armor", "Shields"],
        weapons: ["Martial weapons"],
        skills: { choose: 1, from: ["Animal Handling", "Athletics", "Insight", "Investigation", "Nature", "Perception", "Stealth", "Survival"] },
    },
    primaryAbility: "dexterity",
    casterProgression: "half",
    spellcasting: {
        ability: "wisdom",
        preparation: "prepared",
        ritualCasting: true,
        progression: halfCasterProgression,
    },
    subclassLevel: 3,
    weaponMasteryProgression: { 1: 2, 4: 3, 10: 4 },
    // features authored from memory of the 2024 PHB (no web access) - worth a cross-check against your book.
    features: [
        { name: "Spellcasting", level: 1, description: "You have learned to use the magical essence of nature to cast spells, much as a druid does. See the Spells section of this sheet for the spells you have prepared, your spell save DC, and your spell attack bonus." },
        { name: "Favored Enemy", level: 1, description: "You always have the Hunter's Mark spell prepared. You can cast it a number of times equal to your proficiency bonus without expending a spell slot, and you regain all expended uses when you finish a Long Rest." },
        { name: "Weapon Mastery", level: 1, description: "Your training allows you to use the mastery properties of two kinds of weapons of your choice with which you have proficiency. Whenever you finish a Long Rest, you can change one of your choices. This number increases as you gain levels in this class." },
        { name: "Deft Explorer", level: 2, description: "Thanks to your travels, you gain the following benefits: Expertise in one skill proficiency of your choice; you always have the guidance cantrip prepared (it doesn't count against your number of prepared spells); and you learn one language of your choice." },
        { name: "Fighting Style", level: 2, description: "You adopt a particular style of fighting as your specialty, such as Archery, Defense, Druidic Warrior, or Two-Weapon Fighting. You can't take the same Fighting Style option more than once, even if you get to choose again." },
        { name: "Ability Score Improvement", level: 4, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature. At 19th level you can instead take an Epic Boon feat." },
        { name: "Extra Attack", level: 5, description: "You can attack twice, instead of once, whenever you take the Attack action on your turn." },
        { name: "Roving", level: 6, description: "Your speed increases by 10 feet while you aren't wearing Heavy armor. You also gain a Climb Speed and a Swim Speed equal to your Speed." },
        { name: "Ability Score Improvement", level: 8, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature. At 19th level you can instead take an Epic Boon feat." },
        { name: "Tireless", level: 9, description: "As a Bonus Action, you can give yourself a number of Temporary Hit Points equal to 1d8 plus your Wisdom modifier (minimum once per Short or Long Rest). Additionally, when you finish a Short Rest, you can reduce your level of Exhaustion by 1." },
        { name: "Nature's Veil", level: 10, description: "As a Bonus Action, you can expend a use of this feature to magically become Invisible until the start of your next turn. You can use this feature a number of times equal to your Wisdom modifier (minimum once), regaining expended uses on a Long Rest." },
        { name: "Ability Score Improvement", level: 12, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature. At 19th level you can instead take an Epic Boon feat." },
        { name: "Relentless Hunter", level: 13, description: "Being hit by an attack no longer breaks your concentration on the Hunter's Mark spell." },
        { name: "Ability Score Improvement", level: 16, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature. At 19th level you can instead take an Epic Boon feat." },
        { name: "Precise Hunter", level: 17, description: "You have advantage on saving throws against being Charmed or Frightened. Additionally, when you deal damage to a creature you've marked with Hunter's Mark, you can add your Wisdom modifier to that damage roll once per turn." },
        { name: "Feral Senses", level: 18, description: "You gain preternatural senses that help you fight creatures you can't see. When you attack a creature you can't see, your inability to see it doesn't impose disadvantage on your attack rolls against it. You are also aware of the location of any invisible creature within 30 feet of you, provided the creature isn't hidden from you and you aren't Blinded or Deafened." },
        { name: "Ability Score Improvement", level: 19, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature. At 19th level you can instead take an Epic Boon feat." },
        { name: "Foe Slayer", level: 20, description: "Once per turn, when you hit a creature marked by your Hunter's Mark spell, you can maximize your weapon damage dice against that target instead of rolling them." },
    ],
};
