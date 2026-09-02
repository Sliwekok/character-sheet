import { CharacterClass } from "@/interfaces/CharacterClass";
import { fullCasterProgression } from "@/interfaces/SpellSlotsProgression";

// 2024 unified all casters onto a single 'prepared spells' model, but these three
// classes can only reselect their prepared spells on level-up (not after every long
// rest, unlike Cleric/Druid/Paladin/Ranger/Wizard) - not modeled by ClassSpellcasting
// yet, flagged here in case that distinction matters later.
export const Sorcerer: CharacterClass = {
    name: "Sorcerer",
    edition: "2024",
    hitDie: 6,
    proficiencies: {
        armor: [],
        weapons: ["Simple weapons"],
        savingThrows: ["constitution", "charisma"],
        skills: { choose: 2, from: ["Arcana", "Deception", "Insight", "Intimidation", "Persuasion", "Religion"] },
    },
    primaryAbility: "charisma",
    casterProgression: "full",
    spellcasting: {
        ability: "charisma",
        preparation: "prepared",
        progression: fullCasterProgression,
    },
    subclassLevel: 3,
    // features text pulled and verified against 5etools' class-sorcerer.json (XPHB source) - https://5e.tools/classes.html#sorcerer_xphb
    // Corrected from an earlier from-memory pass: Innate Sorcery had wrongly added a flat +1 to spell
    // attack bonus (the source only raises the spell save DC by 1); the two Metamagic-gain entries at
    // 10th/17th level were renamed "Metamagic (additional option)" and said a single new option instead
    // of the source's two; Sorcerous Restoration was placed at level 10 instead of its actual level 5,
    // and level 7's Sorcery Incarnate feature was missing entirely; every Ability Score Improvement entry
    // used 2014's "+2, or +1/+1 to ability scores" wording instead of 2024's actual "gain the Ability
    // Score Improvement feat or another feat" wording; level 19 was wrongly labeled Ability Score
    // Improvement instead of Epic Boon; and Arcane Apotheosis's text was invented (a "convert Sorcery
    // Points into a 6th-level slot" effect that doesn't exist) instead of the source's actual
    // free-Metamagic-while-Innate-Sorcery-is-active effect.
    features: [
        { name: "Spellcasting", level: 1, description: "An event in your past, or in the life of a parent or ancestor, left an indelible mark on you, infusing you with arcane magic. See the Spells section of this sheet for the spells you have prepared, your spell save DC, and your spell attack bonus." },
        { name: "Innate Sorcery", level: 1, description: "An event in your past left an indelible mark on you, infusing you with simmering magic. As a Bonus Action, you can unleash that magic for 1 minute: your Sorcerer spells' save DC increases by 1, and you have advantage on the attack rolls of Sorcerer spells you cast. You can use this feature twice, regaining all expended uses when you finish a Long Rest." },
        { name: "Font of Magic", level: 2, description: "You tap into a deep wellspring of magic within yourself, represented by Sorcery Points. You have 2 Sorcery Points at 2nd level, gaining more as you reach higher levels (per the Sorcerer table), and you regain all expended points when you finish a Long Rest. As a Bonus Action, you can transform unexpended Sorcery Points into one spell slot of no higher than 5th level, with the cost and the minimum Sorcerer level set by the Sorcerer table; the slot vanishes at the end of a Long Rest. You can also expend a spell slot, no action required, to gain a number of Sorcery Points equal to the slot's level." },
        { name: "Metamagic", level: 2, description: "Because your magic flows from within, you can alter your spells to suit your needs. You gain two Metamagic options of your choice, such as Careful Spell, Distant Spell, Empowered Spell, Extended Spell, Heightened Spell, Quickened Spell, Seeking Spell, Subtle Spell, Transmuted Spell, or Twinned Spell. You can use only one Metamagic option on a spell when you cast it, unless the option says otherwise. Whenever you gain a Sorcerer level, you can replace one of your Metamagic options with one you don't know. You gain two more options at Sorcerer level 10 and two more at Sorcerer level 17." },
        { name: "Ability Score Improvement", level: 4, description: "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify. You gain this feature again at Sorcerer levels 8, 12, and 16." },
        { name: "Sorcerous Restoration", level: 5, description: "When you finish a Short Rest, you can regain expended Sorcery Points, but no more than a number equal to half your Sorcerer level, rounded down. Once you use this feature, you can't do so again until you finish a Long Rest." },
        { name: "Sorcery Incarnate", level: 7, description: "If you have no uses of Innate Sorcery left, you can spend 2 Sorcery Points as part of the Bonus Action to activate it anyway. Additionally, while your Innate Sorcery feature is active, you can use up to two Metamagic options on each spell you cast." },
        { name: "Ability Score Improvement", level: 8, description: "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify." },
        { name: "Metamagic", level: 10, description: "You gain two more Metamagic options of your choice, for a total of four. You can use only one Metamagic option on a spell when you cast it, unless the option says otherwise. Whenever you gain a Sorcerer level, you can replace one of your Metamagic options with one you don't know." },
        { name: "Ability Score Improvement", level: 12, description: "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify." },
        { name: "Ability Score Improvement", level: 16, description: "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify." },
        { name: "Metamagic", level: 17, description: "You gain two more Metamagic options of your choice, for a total of six. You can use only one Metamagic option on a spell when you cast it, unless the option says otherwise. Whenever you gain a Sorcerer level, you can replace one of your Metamagic options with one you don't know." },
        { name: "Epic Boon", level: 19, description: "You gain an Epic Boon feat or another feat of your choice for which you qualify. Boon of Dimensional Travel is recommended." },
        { name: "Arcane Apotheosis", level: 20, description: "While your Innate Sorcery feature is active, you can use one Metamagic option on each of your turns without spending Sorcery Points on it." },
    ],
};
