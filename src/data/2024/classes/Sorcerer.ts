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
    // features text re-scraped and verified against Roll20's D&D 2024 Compendium ("Sorcerer
    // Features" table) - https://roll20.net/compendium/dnd5e/Classes:Sorcerer (2024 source)
    // Corrected from an earlier pass: Spellcasting had been reduced to a stub pointing at "the
    // Spells section of this sheet" instead of the actual rules text (cantrips gained at 1st/4th/
    // 10th, spell slots, prepared spells with the "always prepared" clause and worked example, and
    // the level-up-only prepared-spell-swap timing, spellcasting ability, and focus). Innate
    // Sorcery, Font of Magic, Metamagic (both the 2nd-level grant and the 10th/17th-level
    // increases), Ability Score Improvement, Sorcerous Restoration, Sorcery Incarnate, Epic Boon,
    // and Arcane Apotheosis were already accurate and are unchanged.
    features: [
        { name: "Spellcasting", level: 1, description: "Drawing from your innate magic, you can cast spells. See the Spells section of this sheet for the spells you have prepared, your spell save DC, and your spell attack bonus.\nCantrips: You know four Sorcerer cantrips of your choice. Whenever you gain a Sorcerer level, you can replace one of your cantrips from this feature with another Sorcerer cantrip of your choice. When you reach Sorcerer levels 4 and 10, you learn another Sorcerer cantrip of your choice.\nSpell Slots: You regain all expended spell slots when you finish a Long Rest.\nPrepared Spells of Level 1+: You prepare the list of level 1+ spells that are available for you to cast with this feature. To start, choose two level 1 Sorcerer spells. The number of spells on your list increases as you gain Sorcerer levels. Whenever that number increases, choose additional Sorcerer spells until the number of spells on your list matches your new total. The chosen spells must be of a level for which you have spell slots. For example, if you're a level 3 Sorcerer, your list of prepared spells can include six Sorcerer spells of level 1 or 2 in any combination. If another Sorcerer feature gives you spells that you always have prepared, those spells don't count against the number of spells you can prepare with this feature, but those spells otherwise count as Sorcerer spells for you.\nChanging Your Prepared Spells: Whenever you gain a Sorcerer level, you can replace one spell on your list with another Sorcerer spell for which you have spell slots.\nSpellcasting Ability: Charisma is your spellcasting ability for your Sorcerer spells.\nSpellcasting Focus: You can use an Arcane Focus as a Spellcasting Focus for your Sorcerer spells." },
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
