import { CharacterClass } from "@/interfaces/CharacterClass";
import { pactMagicProgression } from "@/interfaces/SpellSlotsProgression";

// 2024 unified all casters onto a single 'prepared spells' model, but these three
// classes can only reselect their prepared spells on level-up (not after every long
// rest, unlike Cleric/Druid/Paladin/Ranger/Wizard) - not modeled by ClassSpellcasting
// yet, flagged here in case that distinction matters later.
// subclassLevel moved from 1 (2014) to 3 in the 2024 revision, sourced directly from
// 5etools' class data (classFeature 'Warlock Subclass|Warlock|XPHB|3').
export const Warlock: CharacterClass = {
    name: "Warlock",
    edition: "2024",
    hitDie: 8,
    proficiencies: {
        armor: ["Light armor"],
        weapons: ["Simple weapons"],
        savingThrows: ["wisdom", "charisma"],
        skills: { choose: 2, from: ["Arcana", "Deception", "History", "Intimidation", "Investigation", "Nature", "Religion"] },
    },
    multiclassProficiencies: {
        armor: ["Light armor"],
    },
    primaryAbility: "charisma",
    casterProgression: "pact",
    spellcasting: {
        ability: "charisma",
        preparation: "prepared",
        pactMagic: pactMagicProgression,
    },
    subclassLevel: 3,
    // features authored from memory of the 2024 PHB (no web access) - worth a cross-check against your book.
    features: [
        { name: "Eldritch Invocations", level: 1, description: "In your study of occult lore, you have unearthed eldritch invocations, fragments of forbidden knowledge that imbue you with an abiding magical ability. You gain one eldritch invocation of your choice; some require a specific level or Pact Boon before you can learn them. You gain additional invocations as you gain levels in this class, and can swap one out for another whenever you gain a level." },
        { name: "Pact Magic", level: 1, description: "Your arcane research and the magic bestowed on you by your patron give you facility with spells. You regain all expended Pact Magic spell slots when you finish a Short or Long Rest, unlike other spellcasters. See the Spells section of this sheet for the spells you have prepared, your spell save DC, and your spell attack bonus." },
        { name: "Magical Cunning", level: 2, description: "You can perform a special ritual to regain some of your magical energy. As part of a Short Rest, you can spend 1 minute focusing your mind to regain expended Pact Magic spell slots that have a combined level equal to or less than half your warlock level (rounded up). Once you use this feature, you can't use it again until you finish a Long Rest." },
        { name: "Pact Boon", level: 3, description: "Your otherworldly patron bestows a gift upon you for your loyal service. You gain one of the following features of your choice: Pact of the Blade (conjure a pact weapon in your hand as a Bonus Action), Pact of the Chain (learn find familiar and can choose an imp, pseudodragon, quasit, or sprite), or Pact of the Tome (obtain a Book of Shadows granting three cantrips of your choice from any class's spell list)." },
        { name: "Ability Score Improvement", level: 4, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature. At 19th level you can instead take an Epic Boon feat." },
        { name: "Ability Score Improvement", level: 8, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature. At 19th level you can instead take an Epic Boon feat." },
        { name: "Contact Patron", level: 9, description: "As an action, you can send a brief telepathic message to your patron and receive a truthful, if cryptic, one-word reply. Once you use this feature, you can't use it again until you finish a Long Rest." },
        { name: "Mystic Arcanum (6th level)", level: 11, description: "Your patron bestows upon you a magical secret called an arcanum. Choose one 6th-level spell from the warlock spell list as this arcanum. You can cast the chosen spell once without expending a spell slot, and must finish a Long Rest before you can do so again." },
        { name: "Ability Score Improvement", level: 12, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature. At 19th level you can instead take an Epic Boon feat." },
        { name: "Mystic Arcanum (7th level)", level: 13, description: "You learn an additional Mystic Arcanum: choose one 7th-level spell from the warlock spell list. You can cast it once without expending a spell slot, regaining the ability after a Long Rest." },
        { name: "Mystic Arcanum (8th level)", level: 15, description: "You learn an additional Mystic Arcanum: choose one 8th-level spell from the warlock spell list. You can cast it once without expending a spell slot, regaining the ability after a Long Rest." },
        { name: "Ability Score Improvement", level: 16, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature. At 19th level you can instead take an Epic Boon feat." },
        { name: "Mystic Arcanum (9th level)", level: 17, description: "You learn an additional Mystic Arcanum: choose one 9th-level spell from the warlock spell list. You can cast it once without expending a spell slot, regaining the ability after a Long Rest." },
        { name: "Ability Score Improvement", level: 19, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature. At 19th level you can instead take an Epic Boon feat." },
        { name: "Eldritch Master", level: 20, description: "You can spend 1 minute entreating your patron for aid to regain all your expended Pact Magic spell slots. Once you regain spell slots with this feature, you must finish a Long Rest before you can do so again." },
    ],
};
