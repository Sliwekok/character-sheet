import { CharacterClass } from "@/interfaces/CharacterClass";
import { fullCasterProgression } from "@/interfaces/SpellSlotsProgression";

export const Sorcerer: CharacterClass = {
    name: "Sorcerer",
    edition: "2014",
    hitDie: 6,
    proficiencies: {
        armor: [],
        weapons: ["Daggers", "Darts", "Slings", "Quarterstaffs", "Light crossbows"],
        savingThrows: ["constitution", "charisma"],
        skills: { choose: 2, from: ["Arcana", "Deception", "Insight", "Intimidation", "Persuasion", "Religion"] },
    },
    primaryAbility: "charisma",
    casterProgression: "full",
    spellcasting: {
        ability: "charisma",
        preparation: "known",
        progression: fullCasterProgression,
    },
    subclassLevel: 1,
    // features text pulled and verified against 5etools' class-sorcerer.json (PHB source) - https://5e.tools/classes.html#sorcerer_phb
    // Corrected from an earlier from-memory pass: Spellcasting was reduced to flavor text only and was
    // missing its actual cantrip/spells-known progression and spellcasting-ability mechanics; the two
    // Metamagic-gain entries at 10th/17th level were renamed "Metamagic (additional option)" with invented
    // text instead of matching the source's plain "Metamagic" name and exact wording.
    features: [
        { name: "Spellcasting", level: 1, description: "An event in your past, or in the life of a parent or ancestor, left an indelible mark on you, infusing you with arcane magic. This font of magic, whatever its origin, fuels your spells.\nAt 1st level, you know four cantrips of your choice from the sorcerer spell list, learning additional cantrips at 4th and 10th levels. You have spell slots for casting sorcerer spells of 1st level and higher, determined by the Sorcerer table, regaining all expended slots after a long rest.\nYou know two 1st-level spells of your choice from the sorcerer spell list. You learn an additional sorcerer spell at each level except 12th, 14th, 16th, 18th, 19th, and 20th, and each spell must be of a level for which you have spell slots. Additionally, when you gain a level in this class, you can choose one sorcerer spell you know and replace it with another spell from the sorcerer spell list of a level for which you have spell slots.\nCharisma is your spellcasting ability for your sorcerer spells, since the power of your magic relies on your ability to project your will into the world. You use your Charisma modifier when setting the saving throw DC for a sorcerer spell you cast and when making an attack roll with one. You can use an arcane focus as a spellcasting focus for your sorcerer spells." },
        { name: "Font of Magic", level: 2, description: "At 2nd level, you tap into a deep wellspring of magic within yourself. This wellspring is represented by sorcery points, which allow you to create a variety of magical effects.\nYou have 2 sorcery points, gaining one additional point every time you level up, to a maximum of 20 at level 20. You can never have more sorcery points than shown on the Sorcerer table for your level, and you regain all spent sorcery points when you finish a long rest.\nYou can transform unexpended sorcery points into one spell slot as a bonus action on your turn. The created spell slots vanish at the end of a long rest. Creating a 1st-level slot costs 2 points; 2nd-level costs 3 points; 3rd-level costs 5 points; 4th-level costs 6 points; 5th-level costs 7 points. You can create spell slots no higher in level than 5th.\nAs a bonus action on your turn, you can expend one spell slot and gain a number of sorcery points equal to the slot's level." },
        { name: "Metamagic", level: 3, description: "At 3rd level, you gain the ability to twist your spells to suit your needs. You gain two of the following Metamagic options of your choice. You gain another one at 10th and 17th level. You can use only one Metamagic option on a spell when you cast it, unless otherwise noted." },
        { name: "Ability Score Improvement", level: 4, description: "When you reach 4th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1. As normal, you can't increase an ability score above 20 using this feature. If your DM allows the use of feats, you may instead take a feat." },
        { name: "Ability Score Improvement", level: 8, description: "When you reach 8th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1. As normal, you can't increase an ability score above 20 using this feature. If your DM allows the use of feats, you may instead take a feat." },
        { name: "Metamagic", level: 10, description: "At 10th level, you learn an additional metamagic option." },
        { name: "Ability Score Improvement", level: 12, description: "When you reach 12th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1. As normal, you can't increase an ability score above 20 using this feature. If your DM allows the use of feats, you may instead take a feat." },
        { name: "Ability Score Improvement", level: 16, description: "When you reach 16th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1. As normal, you can't increase an ability score above 20 using this feature. If your DM allows the use of feats, you may instead take a feat." },
        { name: "Metamagic", level: 17, description: "At 17th level, you learn an additional metamagic option." },
        { name: "Ability Score Improvement", level: 19, description: "When you reach 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1. As normal, you can't increase an ability score above 20 using this feature. If your DM allows the use of feats, you may instead take a feat." },
        { name: "Sorcerous Restoration", level: 20, description: "At 20th level, you regain 4 expended sorcery points whenever you finish a short rest." },
    ],
};
