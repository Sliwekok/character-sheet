import { CharacterClass } from "@/interfaces/CharacterClass";
import { fullCasterProgression } from "@/interfaces/SpellSlotsProgression";

export const Wizard: CharacterClass = {
    name: "Wizard",
    edition: "2014",
    hitDie: 6,
    proficiencies: {
        armor: [],
        weapons: ["Daggers", "Darts", "Slings", "Quarterstaffs", "Light crossbows"],
        savingThrows: ["intelligence", "wisdom"],
        skills: { choose: 2, from: ["Arcana", "History", "Insight", "Investigation", "Medicine", "Religion"] },
    },
    primaryAbility: "intelligence",
    casterProgression: "full",
    spellcasting: {
        ability: "intelligence",
        preparation: "prepared",
        ritualCasting: true,
        progression: fullCasterProgression,
    },
    subclassLevel: 2,
    // features text re-scraped and verified against Roll20's D&D 5th Edition Compendium (Free
    // Basic Rules 2014 source, "Table: The Wizard") - https://roll20.net/compendium/dnd5e/Classes:Wizard
    // Corrected from an earlier pass: Spellcasting had been reduced to a stub pointing at "the
    // Spells section of this sheet" instead of the actual rules text (cantrips, spellbook, the
    // Intelligence-modifier-plus-wizard-level prepared-spells formula with a worked example,
    // spellcasting ability, ritual casting, spellcasting focus, and learning new spells on
    // level-up). Arcane Recovery, Ability Score Improvement, Spell Mastery, and Signature Spells
    // were already accurate and are unchanged.
    features: [
        { name: "Spellcasting", level: 1, description: "As a student of arcane magic, you have a spellbook containing spells that show the first glimmerings of your true power.\nCantrips: At 1st level, you know three cantrips of your choice from the wizard spell list. You learn additional wizard cantrips of your choice at higher levels.\nSpellbook: At 1st level, you have a spellbook containing six 1st-level wizard spells of your choice. Your spellbook is the repository of the wizard spells you know, except your cantrips, which are fixed in your mind.\nPreparing and Casting Spells: The Wizard table shows how many spell slots you have to cast your spells of 1st level and higher. To cast one of these spells, you must expend a slot of the spell's level or higher. You regain all expended spell slots when you finish a long rest. You prepare the list of wizard spells that are available for you to cast, choosing a number of wizard spells from your spellbook equal to your Intelligence modifier + your wizard level (minimum of one spell). The spells must be of a level for which you have spell slots. For example, if you're a 3rd-level wizard, you have four 1st-level and two 2nd-level spell slots. With an Intelligence of 16, your list of prepared spells can include six spells of 1st or 2nd level, in any combination, chosen from your spellbook. If you prepare the 1st-level spell Magic Missile, you can cast it using a 1st-level or a 2nd-level slot. Casting the spell doesn't remove it from your list of prepared spells. You can change your list of prepared spells when you finish a long rest.\nSpellcasting Ability: Intelligence is your spellcasting ability for your wizard spells, since you learn your spells through dedicated study and memorization. You use your Intelligence whenever a spell refers to your spellcasting ability. In addition, you use your Intelligence modifier when setting the saving throw DC for a wizard spell you cast and when making an attack roll with one.\nRitual Casting: You can cast a wizard spell as a ritual if that spell has the ritual tag and you have the spell in your spellbook. You don't need to have the spell prepared.\nSpellcasting Focus: You can use an arcane focus as a spellcasting focus for your wizard spells.\nLearning Spells of 1st Level and Higher: Each time you gain a wizard level, you can add two wizard spells of your choice to your spellbook for free. Each of these spells must be of a level for which you have spell slots." },
        { name: "Arcane Recovery", level: 1, description: "You have learned to regain some of your magical energy by studying your spellbook. Once per day when you finish a short rest, you can choose expended spell slots to recover, with a combined level equal to or less than half your wizard level (rounded up), and none of the slots can be 6th level or higher." },
        { name: "Ability Score Improvement", level: 4, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature." },
        { name: "Ability Score Improvement", level: 8, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature." },
        { name: "Ability Score Improvement", level: 12, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature." },
        { name: "Ability Score Improvement", level: 16, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature." },
        { name: "Spell Mastery", level: 18, description: "You have achieved such mastery over certain spells that you can cast them at will. Choose a 1st-level wizard spell and a 2nd-level wizard spell that are in your spellbook. You can cast those spells at their lowest level without expending a spell slot when you have them prepared. If you want to cast either spell at a higher level, you must expend a spell slot as normal.\nBy spending 8 hours in study, you can exchange one or both of the spells you chose for different spells of the same levels." },
        { name: "Ability Score Improvement", level: 19, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature." },
        { name: "Signature Spells", level: 20, description: "You gain mastery over two powerful spells and can cast them with little effort. Choose two 3rd-level wizard spells in your spellbook as your signature spells. You always have these spells prepared, they don't count against the number of spells you have prepared, and you can cast each of them once at 3rd level without expending a spell slot. When you do so, you can't do so again until you finish a short or long rest. If you want to cast either spell at a higher level, you must expend a spell slot as normal." },
    ],
};
