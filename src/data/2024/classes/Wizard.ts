import { CharacterClass } from "@/interfaces/CharacterClass";
import { fullCasterProgression } from "@/interfaces/SpellSlotsProgression";

export const Wizard: CharacterClass = {
    name: "Wizard",
    edition: "2024",
    hitDie: 6,
    proficiencies: {
        armor: [],
        weapons: ["Simple weapons"],
        savingThrows: ["intelligence", "wisdom"],
        skills: { choose: 2, from: ["Arcana", "History", "Insight", "Investigation", "Medicine", "Nature", "Religion"] },
    },
    primaryAbility: "intelligence",
    casterProgression: "full",
    spellcasting: {
        ability: "intelligence",
        preparation: "prepared",
        ritualCasting: true,
        progression: fullCasterProgression,
    },
    subclassLevel: 3,
    // features text re-scraped and verified against Roll20's D&D 2024 Compendium ("Wizard
    // Features" table) - https://roll20.net/compendium/dnd5e/Classes:Wizard (2024 source)
    // Corrected from an earlier pass: Spellcasting had been reduced to a stub pointing at "the
    // Spells section of this sheet" instead of the actual rules text (cantrips gained at 1st/4th/
    // 10th, the spellbook, prepared spells with the "always prepared" clause and worked example,
    // changing prepared spells on a Long Rest, spellcasting ability, and spellcasting focus -
    // which can be an Arcane Focus or the spellbook itself). Ritual Adept, Arcane Recovery,
    // Scholar, Ability Score Improvement, Memorize Spell, Spell Mastery, Epic Boon, and Signature
    // Spells were already accurate and are unchanged.
    features: [
        { name: "Spellcasting", level: 1, description: "As a student of arcane magic, you have learned to cast spells. See the Spells section of this sheet for the spells you have prepared, your spell save DC, and your spell attack bonus.\nCantrips: You know three Wizard cantrips of your choice. Whenever you finish a Long Rest, you can replace one of your cantrips from this feature with another Wizard cantrip of your choice. When you reach Wizard levels 4 and 10, you learn another Wizard cantrip of your choice.\nSpellbook: Your wizardly apprenticeship culminated in the creation of a unique book: your spellbook. It contains the level 1+ spells you know. It starts with six level 1 Wizard spells of your choice. Whenever you gain a Wizard level after 1, add two Wizard spells of your choice to your spellbook, each of a level for which you have spell slots.\nSpell Slots: You regain all expended spell slots when you finish a Long Rest.\nPrepared Spells of Level 1+: You prepare the list of level 1+ spells that are available for you to cast with this feature. To do so, choose four spells from your spellbook. The chosen spells must be of a level for which you have spell slots. The number of spells on your list increases as you gain Wizard levels. Whenever that number increases, choose additional Wizard spells until the number of spells on your list matches your new total, chosen from your spellbook. For example, if you're a level 3 Wizard, your list of prepared spells can include six spells of levels 1 and 2 in any combination, chosen from your spellbook. If another Wizard feature gives you spells that you always have prepared, those spells don't count against the number of spells you can prepare with this feature, but those spells otherwise count as Wizard spells for you.\nChanging Your Prepared Spells: Whenever you finish a Long Rest, you can change your list of prepared spells, replacing any of the spells there with spells from your spellbook.\nSpellcasting Ability: Intelligence is your spellcasting ability for your Wizard spells.\nSpellcasting Focus: You can use an Arcane Focus or your spellbook as a Spellcasting Focus for your Wizard spells." },
        { name: "Ritual Adept", level: 1, description: "You can cast any spell as a Ritual if that spell has the Ritual tag and the spell is in your spellbook. You needn't have the spell prepared, but you must read from the book to cast a spell in this way." },
        { name: "Arcane Recovery", level: 1, description: "You can regain some of your magical energy by studying your spellbook. When you finish a Short Rest, you can choose expended spell slots to recover, with a combined level equal to or less than half your wizard level (rounded up), and none of the slots can be 6th level or higher. Once you use this feature, you can't do so again until you finish a Long Rest." },
        { name: "Scholar", level: 2, description: "While studying magic, you also specialized in another field of study. Choose one of the following skills in which you have proficiency: Arcana, History, Investigation, Medicine, Nature, or Religion. You have expertise in the chosen skill." },
        { name: "Ability Score Improvement", level: 4, description: "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify. You gain this feature again at Wizard levels 8, 12, and 16." },
        { name: "Memorize Spell", level: 5, description: "Whenever you finish a Short Rest, you can study your spellbook and replace one of the wizard spells you have prepared with another spell from your spellbook." },
        { name: "Ability Score Improvement", level: 8, description: "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify." },
        { name: "Ability Score Improvement", level: 12, description: "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify." },
        { name: "Ability Score Improvement", level: 16, description: "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify." },
        { name: "Spell Mastery", level: 18, description: "You have achieved such mastery over certain spells that you can cast them at will. Choose a 1st-level wizard spell and a 2nd-level wizard spell in your spellbook that have a casting time of an action. You always have these spells prepared, and you can cast them at their lowest level without expending a spell slot. To cast either spell at a higher level, you must expend a spell slot.\nWhenever you finish a Long Rest, you can study your spellbook and replace one of these spells with an eligible spell of the same level from the book." },
        { name: "Epic Boon", level: 19, description: "You gain an Epic Boon feat or another feat of your choice for which you qualify. Boon of Spell Recall is recommended." },
        { name: "Signature Spells", level: 20, description: "Choose two 3rd-level wizard spells in your spellbook as your signature spells. You always have these spells prepared, and you can cast each of them once at 3rd level without expending a spell slot. When you do so, you can't cast them in this way again until you finish a Short or Long Rest. To cast either spell at a higher level, you must expend a spell slot." },
    ],
};
