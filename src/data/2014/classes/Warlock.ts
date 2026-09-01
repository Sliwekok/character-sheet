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
    features: [
        { name: "Pact Magic", level: 1, description: "Your arcane research and the magic bestowed on you by your patron have given you facility with spells. You regain all expended Pact Magic spell slots when you finish a short or long rest, unlike other spellcasters. See the Spells section of this sheet for the spells you know, your spell save DC, and your spell attack bonus." },
        { name: "Eldritch Invocations", level: 2, description: "In your study of occult lore, you have unearthed eldritch invocations, fragments of forbidden knowledge that imbue you with an abiding magical ability. You gain two eldritch invocations of your choice (such as Agonizing Blast, Devil's Sight, or Mask of Many Faces); some require you to be a specific level or have a specific pact boon before you can learn them. You gain additional invocations as you gain levels in this class, and can swap one out for another whenever you gain a level." },
        { name: "Pact Boon", level: 3, description: "Your otherworldly patron bestows a gift upon you for your loyal service. You gain one of the following features of your choice: Pact of the Chain (learn the find familiar spell and can choose an imp, pseudodragon, quasit, or sprite as your familiar), Pact of the Blade (conjure a pact weapon in your hand as an action), or Pact of the Tome (obtain a Book of Shadows granting three cantrips of your choice from any class's spell list)." },
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
