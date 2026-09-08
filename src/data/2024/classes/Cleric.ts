import { CharacterClass } from "@/interfaces/CharacterClass";
import { fullCasterProgression } from "@/interfaces/SpellSlotsProgression";

export const Cleric: CharacterClass = {
    name: "Cleric",
    edition: "2024",
    hitDie: 8,
    proficiencies: {
        armor: ["Light armor", "Medium armor", "Shields"],
        weapons: ["Simple weapons"],
        savingThrows: ["wisdom", "charisma"],
        skills: { choose: 2, from: ["History", "Insight", "Medicine", "Persuasion", "Religion"] },
    },
    multiclassProficiencies: {
        armor: ["Light armor", "Medium armor", "Shields"],
    },
    primaryAbility: "wisdom",
    casterProgression: "full",
    spellcasting: {
        ability: "wisdom",
        preparation: "prepared",
        ritualCasting: true,
        progression: fullCasterProgression,
    },
    subclassLevel: 3,
    // features text re-scraped and verified against Roll20's D&D 2024 Compendium (Free Rules
    // 2024 source, "Cleric Features" table) - https://roll20.net/compendium/dnd5e/Classes:Cleric
    // Corrected from an earlier pass: Spellcasting had been reduced to a two-sentence stub
    // pointing at "the Spells section of this sheet" instead of the actual rules text (cantrip
    // progression at levels 4/10, the level-1-spells-known/Prepared Spells table progression,
    // changing prepared spells on a Long Rest, spellcasting ability, and spellcasting focus) -
    // the rest of the table (Divine Order, Channel Divinity's two starting options and their
    // uses/regain rules, Sear Undead, Blessed Strikes/Improved Blessed Strikes, Divine
    // Intervention, Epic Boon, Greater Divine Intervention) was already accurate and is unchanged.
    features: [
        { name: "Spellcasting", level: 1, description: "You have learned to cast spells through prayer and meditation. See the rules on spellcasting for how you use those rules with Cleric spells, which appear on the Cleric spell list in this class's description.\nCantrips: You know three cantrips of your choice from the Cleric spell list. Guidance, Sacred Flame, and Thaumaturgy are recommended. Whenever you gain a Cleric level, you can replace one of your cantrips with another cantrip of your choice from the Cleric spell list. When you reach Cleric levels 4 and 10, you learn another cantrip of your choice from the Cleric spell list, as shown in the Cantrips column of the Cleric Features table.\nSpell Slots: The Cleric Features table shows how many spell slots you have to cast your level 1+ spells. You regain all expended slots when you finish a Long Rest.\nPrepared Spells of Level 1+: You prepare the list of level 1+ spells that are available for you to cast with this feature. To start, choose four level 1 spells from the Cleric spell list. Bless, Cure Wounds, Guiding Bolt, and Shield of Faith are recommended. The number of spells on your list increases as you gain Cleric levels, as shown in the Prepared Spells column of the Cleric Features table. Whenever that number increases, choose additional spells from the Cleric spell list until the number of spells on your list matches the number on the table. The chosen spells must be of a level for which you have spell slots. For example, if you're a level 3 Cleric, your list of prepared spells can include six spells of levels 1 and 2 in any combination. If another Cleric feature gives you spells that you always have prepared, those spells don't count against the number of spells you can prepare with this feature, but those spells otherwise count as Cleric spells for you.\nChanging Your Prepared Spells: Whenever you finish a Long Rest, you can change your list of prepared spells, replacing any of the spells there with other Cleric spells for which you have spell slots.\nSpellcasting Ability: Wisdom is your spellcasting ability for your Cleric spells.\nSpellcasting Focus: You can use a Holy Symbol as a Spellcasting Focus for your Cleric spells." },
        { name: "Divine Order", level: 1, description: "You have dedicated yourself to one of the following sacred roles of your choice.\nProtector: you gain proficiency with Martial weapons and training with Heavy armor.\nThaumaturge: you learn one extra cantrip from the cleric spell list, and you gain a bonus to your Intelligence (Arcana or Religion) checks equal to your Wisdom modifier (minimum +1)." },
        { name: "Channel Divinity", level: 2, description: "You can channel divine energy directly from the Outer Planes to fuel magical effects. You start with two such effects, each usable as a Magic action.\nDivine Spark: you point your holy symbol at a creature within 30 feet and roll 1d8 + your Wisdom modifier, either restoring that many hit points to it or forcing a Constitution saving throw for that much Necrotic or Radiant damage (your choice), half as much on a success. You roll an additional d8 at 7th level (2d8), 13th level (3d8), and 18th level (4d8).\nTurn Undead: each undead of your choice within 30 feet must succeed on a Wisdom saving throw or gain the Frightened and Incapacitated conditions for 1 minute, trying to move as far from you as it can; the effect ends early if the creature takes any damage, if you're Incapacitated, or if you die.\nYou can use this Channel Divinity twice, regaining one expended use when you finish a short rest and all expended uses when you finish a long rest. Your uses increase to three at 6th level and four at 18th level." },
        { name: "Ability Score Improvement", level: 4, description: "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify. You gain this feature again at Cleric levels 8, 12, and 16." },
        { name: "Sear Undead", level: 5, description: "Whenever you use your Turn Undead Channel Divinity option, you can roll a number of d8s equal to your Wisdom modifier (minimum of 1d8) and add the rolls together. Each undead that fails its saving throw against that use of Turn Undead takes Radiant damage equal to the total. This damage doesn't end the turned effect." },
        { name: "Blessed Strikes", level: 7, description: "Divine power infuses you in battle. Choose one of the following options.\nDivine Strike: once on each of your turns when you hit a creature with an attack roll using a weapon, you can cause the target to take an extra 1d8 Necrotic or Radiant damage (your choice).\nPotent Spellcasting: you add your Wisdom modifier to the damage you deal with any cleric cantrip." },
        { name: "Ability Score Improvement", level: 8, description: "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify." },
        { name: "Divine Intervention", level: 10, description: "You can call on your deity or pantheon to intervene on your behalf. As a Magic action, choose any cleric spell of level 5 or lower that doesn't require a Reaction to cast; as part of the same action, you cast that spell without expending a spell slot or needing Material components. You can't use this feature again until you finish a long rest." },
        { name: "Ability Score Improvement", level: 12, description: "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify." },
        { name: "Improved Blessed Strikes", level: 14, description: "The option you chose for Blessed Strikes grows more powerful.\nDivine Strike: the extra damage increases to 2d8.\nPotent Spellcasting: when you cast a cleric cantrip and deal damage to a creature with it, you can give vitality to yourself or another creature within 60 feet of yourself, granting temporary hit points equal to twice your Wisdom modifier." },
        { name: "Ability Score Improvement", level: 16, description: "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify." },
        { name: "Epic Boon", level: 19, description: "You gain an Epic Boon feat or another feat of your choice for which you qualify. Boon of Fate is recommended." },
        { name: "Greater Divine Intervention", level: 20, description: "You can call on even more powerful divine intervention. When you use your Divine Intervention feature, you can choose Wish when you select a spell. If you do so, you can't use Divine Intervention again until you finish 2d4 long rests." },
    ],
};
