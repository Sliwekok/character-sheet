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
    // features text verified against 5etools' class-wizard.json (XPHB source) - https://5e.tools/classes.html#wizard_xphb
    // Corrected from an earlier from-memory pass: Ritual Adept had the prepared-spell condition
    // backwards (you needn't have the spell prepared to ritual-cast it, not the opposite); Arcane
    // Recovery's recharge was reworded to the XPHB "can't do so again until you finish a Long
    // Rest" phrasing rather than 2014's "once per day"; Scholar was an entirely wrong effect (it
    // grants expertise in one proficient Arcana/History/Investigation/Medicine/Nature/Religion
    // skill of your choice, not advantage on all of them, and was missing Medicine from the
    // list); Memorize Spell actually triggers on finishing a Short Rest, not "spending 1 minute"
    // at will; Spell Mastery gained the XPHB "casting time of an action" restriction and its
    // Long Rest spell-swap clause; Signature Spells regained its "expend a spell slot to cast
    // higher" clause; and level 19 is a distinctly-named Epic Boon feature (Boon of Spell Recall
    // recommended), not a fifth Ability Score Improvement - the other four ASI entries were
    // rewritten to the XPHB "gain the Ability Score Improvement feat or another feat" wording.
    features: [
        { name: "Spellcasting", level: 1, description: "As a student of arcane magic, you have a spellbook containing spells that show the first glimmerings of your true power. See the Spells section of this sheet for the spells you have prepared, your spell save DC, and your spell attack bonus." },
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
