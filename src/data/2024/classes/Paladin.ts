import { CharacterClass } from "@/interfaces/CharacterClass";
import { halfCasterProgression } from "@/interfaces/SpellSlotsProgression";

export const Paladin: CharacterClass = {
    name: "Paladin",
    edition: "2024",
    hitDie: 10,
    proficiencies: {
        armor: ["Light armor", "Medium armor", "Heavy armor", "Shields"],
        weapons: ["Simple weapons", "Martial weapons"],
        savingThrows: ["wisdom", "charisma"],
        skills: { choose: 2, from: ["Athletics", "Insight", "Intimidation", "Medicine", "Persuasion", "Religion"] },
    },
    multiclassProficiencies: {
        armor: ["Light armor", "Medium armor", "Shields"],
        weapons: ["Martial weapons"],
    },
    primaryAbility: "strength",
    casterProgression: "half",
    spellcasting: {
        ability: "charisma",
        preparation: "prepared",
        progression: halfCasterProgression,
    },
    subclassLevel: 3,
    // weaponMasteryProgression corrected: the previous {1:2, 4:3, 10:4} was copied from
    // Barbarian's numbers and flagged in its own comment as unverified. Re-checked against
    // Roll20's D&D 2024 Compendium ("Paladin Features" table) -
    // https://roll20.net/compendium/dnd5e/Classes:Paladin - Paladin's Weapon Mastery does not
    // have a level-scaling table column or an "at higher levels" clause; it's a flat 2 weapons
    // for the whole class, unlike Barbarian/Fighter.
    weaponMasteryProgression: { 1: 2 },
    // features text re-scraped and verified against Roll20's D&D 2024 Compendium ("Paladin
    // Features" table) - https://roll20.net/compendium/dnd5e/Classes:Paladin (2024 source)
    // Corrected from an earlier pass: weaponMasteryProgression (see above comment) and Weapon
    // Mastery's description both falsely implied the weapon count scales with level - it doesn't,
    // so the closing "This number increases as you gain levels in this class." sentence was
    // removed; Spellcasting was missing the "always prepared spells don't count against your
    // total" clause and the worked example showing how many spells a 5th-level paladin prepares.
    // Everything else (Lay on Hands, Fighting Style, Paladin's Smite, Channel Divinity, Divine
    // Sense, Ability Score Improvement, Extra Attack, Faithful Steed, Aura of Protection, Abjure
    // Foes, Aura of Courage, Radiant Strikes, Restoring Touch, Aura Expansion, Epic Boon) was
    // already accurate and is unchanged.
    features: [
        { name: "Lay on Hands", level: 1, description: "Your blessed touch can heal wounds. You have a pool of healing power that replenishes when you finish a Long Rest, with a number of hit points equal to five times your paladin level. As a Bonus Action, you can touch a creature (which could be yourself) and draw power from the pool of healing to restore a number of hit points to that creature, up to the maximum amount remaining in the pool. You can also expend 5 hit points from the pool of healing power to remove the Poisoned condition from the creature; those points don't also restore hit points to the creature." },
        { name: "Spellcasting", level: 1, description: "You have learned to cast spells through prayer and meditation. See the Spells section of this sheet for the spells you have prepared, your spell save DC, and your spell attack bonus.\nSpell Slots: You regain all expended spell slots when you finish a Long Rest.\nPrepared Spells of Level 1+: You prepare the list of level 1+ spells that are available for you to cast with this feature. To start, choose two level 1 paladin spells; Heroism and Searing Smite are recommended. The number of spells on your list increases as you gain paladin levels. The chosen spells must be of a level for which you have spell slots. If another paladin feature gives you spells that you always have prepared, those spells don't count against the number of spells you can prepare with this feature, but those spells otherwise count as paladin spells for you. For example, if you're a level 5 paladin, your list of prepared spells can include six paladin spells of level 1 or 2 in any combination.\nChanging Your Prepared Spells: Whenever you finish a Long Rest, you can replace one spell on your list with another paladin spell for which you have spell slots.\nSpellcasting Ability: Charisma is your spellcasting ability for your paladin spells.\nSpellcasting Focus: You can use a holy symbol as a spellcasting focus for your paladin spells." },
        { name: "Weapon Mastery", level: 1, description: "Your training with weapons allows you to use the mastery properties of two kinds of weapons of your choice with which you have proficiency. Whenever you finish a Long Rest, you can change the kinds of weapons you chose." },
        { name: "Fighting Style", level: 2, description: "You gain a Fighting Style feat of your choice. Instead of choosing one of those feats, you can choose the Blessed Warrior feat." },
        { name: "Paladin's Smite", level: 2, description: "You always have the Divine Smite spell prepared. In addition, you can cast it without expending a spell slot, but you must finish a Long Rest before you can cast it in this way again." },
        { name: "Channel Divinity", level: 3, description: "You can channel divine energy directly from the Outer Planes, using it to fuel magical effects. You start with one such effect: Divine Sense. Other paladin features give additional Channel Divinity effect options. Each time you use this class's Channel Divinity, you choose which effect from this class to create.\nYou can use this class's Channel Divinity twice. You regain one of its expended uses when you finish a Short Rest, and you regain all expended uses when you finish a Long Rest. You gain an additional use when you reach paladin level 11.\nIf a Channel Divinity effect requires a saving throw, the DC equals the spell save DC from this class's Spellcasting feature." },
        { name: "Divine Sense", level: 3, description: "As a Bonus Action, you can open your awareness to detect Celestials, Fiends, and Undead. For the next 10 minutes or until you are Incapacitated, you know the location of any creature of those types within 60 feet of yourself, and you know its creature type. Within the same radius, you also detect the presence of any place or object that has been consecrated or desecrated, as with the hallow spell." },
        { name: "Ability Score Improvement", level: 4, description: "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify. You gain this feature again at Paladin levels 8, 12, and 16." },
        { name: "Extra Attack", level: 5, description: "You can attack twice, instead of once, whenever you take the Attack action on your turn." },
        { name: "Faithful Steed", level: 5, description: "You can call on the aid of an otherworldly steed. You always have the Find Steed spell prepared. You can also cast the spell once without expending a spell slot, and you regain the ability to do so when you finish a Long Rest." },
        { name: "Aura of Protection", level: 6, description: "You radiate a protective aura in a 10-foot Emanation that originates from you. The aura is inactive while you are Incapacitated. You and your allies in the aura gain a bonus to saving throws equal to your Charisma modifier (minimum bonus of +1). If another paladin is present, a creature can benefit from only one Aura of Protection at a time; the creature chooses which aura while in them." },
        { name: "Ability Score Improvement", level: 8, description: "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify." },
        { name: "Abjure Foes", level: 9, description: "As a Magic action, you can expend one use of this class's Channel Divinity to overwhelm foes with awe. As you present your holy symbol or weapon, you can target a number of creatures equal to your Charisma modifier (minimum of one creature) that you can see within 60 feet of yourself. Each target must succeed on a Wisdom saving throw or be Frightened for 1 minute or until it takes any damage. While Frightened in this way, a target can do only one of the following on its turns: move, take an action, or take a Bonus Action." },
        { name: "Aura of Courage", level: 10, description: "You and your allies have immunity to the Frightened condition while in your Aura of Protection. If a Frightened ally enters the aura, that condition has no effect on that ally while there." },
        { name: "Radiant Strikes", level: 11, description: "Your strikes now carry supernatural power. When you hit a target with an attack roll using a melee weapon or an Unarmed Strike, the target takes an extra 1d8 radiant damage." },
        { name: "Ability Score Improvement", level: 12, description: "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify." },
        { name: "Restoring Touch", level: 14, description: "When you use your Lay on Hands on a creature, you can also remove one or more of the following conditions from the creature: Blinded, Charmed, Deafened, Frightened, Paralyzed, or Stunned. You must expend 5 hit points from the healing pool of Lay on Hands for each of these conditions you remove; those points don't also restore hit points to the creature." },
        { name: "Ability Score Improvement", level: 16, description: "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify." },
        { name: "Aura Expansion", level: 18, description: "Your Aura of Protection is now a 30-foot Emanation." },
        { name: "Epic Boon", level: 19, description: "You gain an Epic Boon feat or another feat of your choice for which you qualify. Boon of Truesight is recommended." },
    ],
};
