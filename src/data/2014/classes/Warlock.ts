import { CharacterClass } from "@/interfaces/CharacterClass";
import { pactMagicProgression } from "@/interfaces/SpellSlotsProgression";

export const Warlock: CharacterClass = {
    name: "Warlock",
    edition: "2014",
    hitDie: 8,
    proficiencies: {
        armor: ["Light armor"],
        weapons: ["Simple weapons"],
        savingThrows: ["wisdom", "charisma"],
        skills: { choose: 2, from: ["Arcana", "Deception", "History", "Intimidation", "Investigation", "Nature", "Religion"] },
    },
    multiclassProficiencies: {
        armor: ["Light armor"],
        weapons: ["Simple weapons"],
    },
    primaryAbility: "charisma",
    casterProgression: "pact",
    spellcasting: {
        ability: "charisma",
        preparation: "known",
        pactMagic: pactMagicProgression,
    },
    subclassLevel: 1,
    // features text re-scraped and verified against Roll20's D&D 5th Edition Compendium (Free
    // Basic Rules 2014 source, "Table: The Warlock") - https://roll20.net/compendium/dnd5e/Classes:Warlock
    // Corrected from an earlier pass: Pact Magic had been reduced to a stub pointing at "the
    // Spells section of this sheet" instead of the actual rules text (cantrips known, the
    // all-slots-share-one-level mechanic with a worked example, spells known progression,
    // spellcasting ability, and spellcasting focus); Pact Boon's three options were compressed
    // summaries missing several mechanical details (Pact of the Chain's ritual casting and
    // forgo-an-attack option, Pact of the Blade's proficiency/magical-weapon and 5-foot-tether
    // rules, Pact of the Tome's "don't count against cantrips known" and replacement-book rules)
    // and have been expanded. Otherworldly Patron (folded into no separate entry, matching the
    // existing convention of omitting subclass-choice placeholders), Eldritch Invocations,
    // Ability Score Improvement, Mystic Arcanum, and Eldritch Master were already accurate and are
    // unchanged.
    features: [
        { name: "Pact Magic", level: 1, description: "Your arcane research and the magic bestowed on you by your patron have given you facility with spells.\nCantrips: You know two cantrips of your choice from the warlock spell list. You learn additional warlock cantrips of your choice at higher levels.\nSpell Slots: The Warlock table shows how many spell slots you have. The table also shows what the level of those slots is; all of your spell slots are the same level. To cast one of your warlock spells of 1st level or higher, you must expend a spell slot. You regain all expended spell slots when you finish a short or long rest. For example, when you are 5th level, you have two 3rd-level spell slots. To cast the 1st-level spell thunderwave, you must spend one of those slots, and you cast it as a 3rd-level spell.\nSpells Known of 1st Level and Higher: At 1st level, you know two 1st-level spells of your choice from the warlock spell list. You learn a new warlock spell every time you gain a level from 2 through 9, as well as at level 19. A spell you choose must be of a level no higher than your slot level. Additionally, when you gain a level in this class, you can choose one of the warlock spells you know and replace it with another spell from the warlock spell list, which also must be of a level for which you have spell slots.\nSpellcasting Ability: Charisma is your spellcasting ability for your warlock spells, so you use your Charisma whenever a spell refers to your spellcasting ability. In addition, you use your Charisma modifier when setting the saving throw DC for a warlock spell you cast and when making an attack roll with one.\nSpellcasting Focus: You can use an arcane focus as a spellcasting focus for your warlock spells." },
        { name: "Eldritch Invocations", level: 2, description: "In your study of occult lore, you have unearthed eldritch invocations, fragments of forbidden knowledge that imbue you with an abiding magical ability. You gain two eldritch invocations of your choice (such as Agonizing Blast, Devil's Sight, or Mask of Many Faces); some require you to be a specific level or have a specific pact boon before you can learn them. You gain additional invocations as you gain levels in this class, and can swap one out for another whenever you gain a level." },
        { name: "Pact Boon", level: 3, description: "Your otherworldly patron bestows a gift upon you for your loyal service. You gain one of the following features of your choice.\nPact of the Chain: You learn the find familiar spell and can cast it as a ritual; the spell doesn't count against your number of spells known. You can choose one of the normal forms for your familiar or one of the following special forms: imp, pseudodragon, quasit, or sprite. Additionally, when you take the Attack action, you can forgo one of your own attacks to allow your familiar to make one attack of its own with its reaction.\nPact of the Blade: You can use your action to create a pact weapon in your empty hand. You can choose the form that this melee weapon takes each time you create it, and you are proficient with it while you wield it. This weapon counts as magical for the purpose of overcoming resistance and immunity to nonmagical attacks and damage. Your pact weapon disappears if it is more than 5 feet away from you for 1 minute or more, if you use this feature again, if you dismiss it, or if you die. You can instead transform a magic weapon into your pact weapon through a special 1-hour ritual.\nPact of the Tome: Your patron gives you a grimoire called a Book of Shadows. Choose three cantrips from any class's spell list. While the book is on your person, you can cast those cantrips at will, and they don't count against your number of cantrips known. If you lose your Book of Shadows, you can perform a 1-hour ceremony to receive a replacement from your patron." },
        { name: "Ability Score Improvement", level: 4, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature." },
        { name: "Ability Score Improvement", level: 8, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature." },
        { name: "Mystic Arcanum (6th level)", level: 11, description: "Your patron bestows upon you a magical secret called an arcanum. Choose one 6th-level spell from the warlock spell list as this arcanum. You can cast the chosen spell once without expending a spell slot, and must finish a long rest before you can do so again." },
        { name: "Ability Score Improvement", level: 12, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature." },
        { name: "Mystic Arcanum (7th level)", level: 13, description: "You learn an additional Mystic Arcanum: choose one 7th-level spell from the warlock spell list. You can cast it once without expending a spell slot, regaining the ability after a long rest." },
        { name: "Mystic Arcanum (8th level)", level: 15, description: "You learn an additional Mystic Arcanum: choose one 8th-level spell from the warlock spell list. You can cast it once without expending a spell slot, regaining the ability after a long rest." },
        { name: "Ability Score Improvement", level: 16, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature." },
        { name: "Mystic Arcanum (9th level)", level: 17, description: "You learn an additional Mystic Arcanum: choose one 9th-level spell from the warlock spell list. You can cast it once without expending a spell slot, regaining the ability after a long rest." },
        { name: "Ability Score Improvement", level: 19, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature." },
        { name: "Eldritch Master", level: 20, description: "You can draw on your inner reserve of mystical power while entreating your patron to regain expended spell slots. You can spend 1 minute entreating your patron for aid to regain all expended spell slots from your Pact Magic feature. Once you regain spell slots with this feature, you must finish a long rest before you can do so again." },
    ],
};
