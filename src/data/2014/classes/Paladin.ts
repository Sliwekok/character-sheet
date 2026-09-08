import { CharacterClass } from "@/interfaces/CharacterClass";
import { halfCasterProgression } from "@/interfaces/SpellSlotsProgression";

export const Paladin: CharacterClass = {
    name: "Paladin",
    edition: "2014",
    hitDie: 10,
    proficiencies: {
        armor: ["Light armor", "Medium armor", "Heavy armor", "Shields"],
        weapons: ["Simple weapons", "Martial weapons"],
        savingThrows: ["wisdom", "charisma"],
        skills: { choose: 2, from: ["Athletics", "Insight", "Intimidation", "Medicine", "Persuasion", "Religion"] },
    },
    multiclassProficiencies: {
        armor: ["Light armor", "Medium armor", "Shields"],
        weapons: ["Simple weapons", "Martial weapons"],
    },
    primaryAbility: "strength",
    casterProgression: "half",
    spellcasting: {
        ability: "charisma",
        preparation: "prepared",
        progression: halfCasterProgression,
    },
    subclassLevel: 3,
    // features text re-scraped and verified against Roll20's D&D 5th Edition Compendium (Free
    // Basic Rules 2014 source, "Table: The Paladin") - https://roll20.net/compendium/dnd5e/Classes:Paladin
    // Corrected from an earlier pass: Spellcasting had been reduced to a stub pointing at "the
    // Spells section of this sheet" instead of the actual rules text (spell slot/preparation
    // rules including the Charisma-modifier-plus-half-paladin-level formula, spellcasting
    // ability, and spellcasting focus) - Channel Divinity, Lay on Hands, Divine Smite's 6d8 cap,
    // and Divine Sense's duration/consecrated-object detection were already accurate and are
    // unchanged.
    features: [
        { name: "Divine Sense", level: 1, description: "The presence of strong evil registers on your senses like a noxious odor, and powerful good rings like heavenly music in your ears. As an action, you can open your awareness to detect such forces. Until the end of your next turn, you know the location of any celestial, fiend, or undead within 60 feet of you that isn't behind total cover. You know the type (celestial, fiend, or undead) of any being whose presence you sense, but not its identity. Within the same radius, you also detect the presence of any place or object that has been consecrated or desecrated, as with the hallow spell.\nYou can use this feature a number of times equal to 1 + your Charisma modifier, and you regain all expended uses when you finish a long rest." },
        { name: "Lay on Hands", level: 1, description: "Your blessed touch can heal wounds. You have a pool of healing power that replenishes when you take a long rest, with a number of hit points equal to your paladin level × 5. As an action, you can touch a creature and draw power from the pool to restore a number of hit points to that creature, up to the maximum amount remaining in your pool. You can also expend 5 hit points from your pool of healing to cure the target of one disease or neutralize one poison affecting it, instead of restoring hit points. This feature has no effect on undead and constructs." },
        { name: "Fighting Style", level: 2, description: "You adopt a particular style of fighting as your specialty, such as Defense, Dueling, Great Weapon Fighting, or Protection. You can't take the same Fighting Style option more than once, even if you get to choose again from a different class feature." },
        { name: "Spellcasting", level: 2, description: "By 2nd level, you have learned to draw on divine magic through meditation and prayer to cast spells as a cleric does.\nPreparing and Casting Spells: The Paladin table shows how many spell slots you have to cast your spells. To cast one of your paladin spells of 1st level or higher, you must expend a slot of the spell's level or higher. You regain all expended spell slots when you finish a long rest. You prepare the list of paladin spells that are available for you to cast, choosing from the paladin spell list. When you do so, choose a number of paladin spells equal to your Charisma modifier + half your paladin level, rounded down (minimum of one spell). The spells must be of a level for which you have spell slots. For example, if you are a 5th-level paladin, you have four 1st-level and two 2nd-level spell slots. With a Charisma of 14, your list of prepared spells can include four spells of 1st or 2nd level, in any combination. If you prepare the 1st-level spell Cure Wounds, you can cast it using a 1st-level or a 2nd-level slot. Casting the spell doesn't remove it from your list of prepared spells. You can change your list of prepared spells when you finish a long rest. Preparing a new list of paladin spells requires time spent in prayer and meditation: at least 1 minute per spell level for each spell on your list.\nSpellcasting Ability: Charisma is your spellcasting ability for your paladin spells, since their power derives from the strength of your convictions. You use your Charisma whenever a spell refers to your spellcasting ability. In addition, you use your Charisma modifier when setting the saving throw DC for a paladin spell you cast and when making an attack roll with one.\nSpellcasting Focus: You can use a holy symbol as a spellcasting focus for your paladin spells." },
        { name: "Divine Smite", level: 2, description: "When you hit a creature with a melee weapon attack, you can expend one spell slot to deal radiant damage to the target, in addition to the weapon's damage. The extra damage is 2d8 for a 1st-level spell slot, plus 1d8 for each spell level higher than 1st, to a maximum of 5d8. The damage increases by 1d8 if the target is an undead or a fiend, to a maximum of 6d8." },
        { name: "Channel Divinity", level: 3, description: "Your oath allows you to channel divine energy to fuel magical effects. Each Channel Divinity option provided by your oath explains how to use it.\nWhen you use your Channel Divinity, you choose which option to use. You must then finish a short or long rest to use your Channel Divinity again.\nSome Channel Divinity effects require saving throws. When you use such an effect from this class, the DC equals your paladin spell save DC." },
        { name: "Divine Health", level: 3, description: "The divine magic flowing through you makes you immune to disease." },
        { name: "Ability Score Improvement", level: 4, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature." },
        { name: "Extra Attack", level: 5, description: "You can attack twice, instead of once, whenever you take the Attack action on your turn." },
        { name: "Aura of Protection", level: 6, description: "Whenever you or a friendly creature within 10 feet of you must make a saving throw, the creature gains a bonus to the saving throw equal to your Charisma modifier (with a minimum bonus of +1). You must be conscious to grant this bonus. At 18th level, the range of this aura increases to 30 feet." },
        { name: "Ability Score Improvement", level: 8, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature." },
        { name: "Aura of Courage", level: 10, description: "You and friendly creatures within 10 feet of you can't be frightened while you are conscious. At 18th level, the range of this aura increases to 30 feet." },
        { name: "Improved Divine Smite", level: 11, description: "Whenever you hit a creature with a melee weapon, the creature takes an extra 1d8 radiant damage. If you also use your Divine Smite with an attack, you add this damage to the extra damage of your Divine Smite." },
        { name: "Ability Score Improvement", level: 12, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature." },
        { name: "Cleansing Touch", level: 14, description: "You can use your action to end one spell on yourself or on one willing creature that you touch. You can use this feature a number of times equal to your Charisma modifier (a minimum of once), and you regain expended uses when you finish a long rest." },
        { name: "Ability Score Improvement", level: 16, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature." },
        { name: "Aura Improvements", level: 18, description: "The range of your Aura of Protection and Aura of Courage increases to 30 feet." },
        { name: "Ability Score Improvement", level: 19, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature." },
    ],
};
