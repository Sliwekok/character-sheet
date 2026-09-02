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
    // features text pulled and verified against 5etools' class-cleric.json (XPHB source) - https://5e.tools/classes.html#cleric_xphb
    // Corrected from an earlier from-memory pass: Thaumaturge's bonus applies to Intelligence
    // (Arcana or Religion) checks, not Religion alone; Channel Divinity's two starting options
    // are the base-class Divine Spark and Turn Undead (not one granted by the subclass), and its
    // uses/regain rules (2 uses, one back on a short rest, all on a long rest, rising to 3 at 6th
    // and 4 at 18th) were filled in; Ability Score Improvement now uses the real 2024 feat
    // wording instead of 2014's "+2/+1+1" text; Sear Undead deals Wisdom-modifier d8s of damage,
    // not damage equal to cleric level; the level 7 Blessed Strikes (Divine Strike/Potent
    // Spellcasting choice) and its level 14 Improved Blessed Strikes upgrade were missing
    // entirely; Divine Intervention's wording (Magic action, no Reaction spells, Material
    // components only) was tightened; and level 19 is Epic Boon (not a fifth Ability Score
    // Improvement) while the real Greater Divine Intervention (Wish, recharging after 2d4 long
    // rests) belongs at level 20, not a fabricated level 17 effect - level 17 is only a subclass
    // feature, omitted here like other subclass placeholders.
    features: [
        { name: "Spellcasting", level: 1, description: "As a conduit for divine power, you can cast cleric spells. See the Spells section of this sheet for the spells you have prepared, your spell save DC, and your spell attack bonus." },
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
