import { CharacterClass } from "@/interfaces/CharacterClass";
import { halfCasterProgression } from "@/interfaces/SpellSlotsProgression";

export const Ranger: CharacterClass = {
    name: "Ranger",
    edition: "2024",
    hitDie: 10,
    proficiencies: {
        armor: ["Light armor", "Medium armor", "Shields"],
        weapons: ["Simple weapons", "Martial weapons"],
        savingThrows: ["strength", "dexterity"],
        skills: { choose: 3, from: ["Animal Handling", "Athletics", "Insight", "Investigation", "Nature", "Perception", "Stealth", "Survival"] },
    },
    multiclassProficiencies: {
        armor: ["Light armor", "Medium armor", "Shields"],
        weapons: ["Martial weapons"],
        skills: { choose: 1, from: ["Animal Handling", "Athletics", "Insight", "Investigation", "Nature", "Perception", "Stealth", "Survival"] },
    },
    primaryAbility: "dexterity",
    casterProgression: "half",
    spellcasting: {
        ability: "wisdom",
        preparation: "prepared",
        ritualCasting: true,
        progression: halfCasterProgression,
    },
    subclassLevel: 3,
    // weaponMasteryProgression corrected: the previous {1:2, 4:3, 10:4} was copied from
    // Barbarian's numbers and flagged in its own comment as unverified. Re-checked against
    // Roll20's D&D 2024 Compendium ("Ranger Class Features" table) -
    // https://roll20.net/compendium/dnd5e/Classes:Ranger (2024 source) - the table has no
    // "Weapon Mastery" column and the Weapon Mastery feature's text has no level-scaling clause;
    // it's a flat 2 weapons for the whole class, unlike Barbarian/Fighter.
    weaponMasteryProgression: { 1: 2 },
    // features text re-scraped and verified against Roll20's D&D 2024 Compendium ("Ranger
    // Features" table) - https://roll20.net/compendium/dnd5e/Classes:Ranger (2024 source)
    // Corrected from an earlier pass: weaponMasteryProgression (see above comment) and Weapon
    // Mastery's description both falsely implied the weapon count scales with level - it doesn't,
    // so the closing "This number increases as you gain levels in this class." sentence was
    // removed; Spellcasting had been reduced to a stub pointing at "the Spells section of this
    // sheet" instead of the actual rules text (spell slots, prepared spells with the "always
    // prepared" clause and worked example, changing prepared spells, spellcasting ability and
    // focus). Favored Enemy, Deft Explorer, Fighting Style, Ability Score Improvement, Extra
    // Attack, Roving, Expertise, Tireless, Relentless Hunter, Nature's Veil, Precise Hunter, Feral
    // Senses, Epic Boon, and Foe Slayer were already accurate and are unchanged.
    features: [
        { name: "Spellcasting", level: 1, description: "You have learned to channel the magical essence of nature to cast spells. See the Spells section of this sheet for the spells you have prepared, your spell save DC, and your spell attack bonus.\nSpell Slots: You regain all expended spell slots when you finish a Long Rest.\nPrepared Spells of Level 1+: You prepare the list of level 1+ spells that are available for you to cast with this feature. To start, choose two level 1 Ranger spells. The number of spells on your list increases as you gain Ranger levels. Whenever that number increases, choose additional Ranger spells until the number of spells on your list matches your new total. The chosen spells must be of a level for which you have spell slots. For example, if you're a level 5 Ranger, your list of prepared spells can include six Ranger spells of level 1 or 2 in any combination. If another Ranger feature gives you spells that you always have prepared, those spells don't count against the number of spells you can prepare with this feature, but those spells otherwise count as Ranger spells for you.\nChanging Your Prepared Spells: Whenever you finish a Long Rest, you can replace one spell on your list with another Ranger spell for which you have spell slots.\nSpellcasting Ability: Wisdom is your spellcasting ability for your Ranger spells.\nSpellcasting Focus: You can use a Druidic Focus as a Spellcasting Focus for your Ranger spells." },
        { name: "Favored Enemy", level: 1, description: "You always have the Hunter's Mark spell prepared. You can cast it twice without expending a spell slot, and you regain all expended uses when you finish a Long Rest.\nThe number of times you can cast the spell this way increases as you gain levels in this class.", grantedSpells: [{ spellName: "Hunter's Mark", limit: "per long rest, uses scale with level (2+)" }] },
        { name: "Weapon Mastery", level: 1, description: "Your training allows you to use the mastery properties of two kinds of weapons of your choice with which you have proficiency. Whenever you finish a Long Rest, you can change one of your choices." },
        { name: "Deft Explorer", level: 2, description: "Thanks to your travels, you gain the following benefits: you gain Expertise in one skill proficiency of your choice, and you learn two languages of your choice." },
        { name: "Fighting Style", level: 2, description: "You gain a Fighting Style feat of your choice, such as Archery, Defense, Dueling, or Two-Weapon Fighting. Instead of one of those feats, you can choose the Druidic Warrior option: you learn two Druid cantrips of your choice, which count as Ranger spells for you and use Wisdom as their spellcasting ability, and you can replace one of them whenever you gain a Ranger level.", choice: { key: "fightingStyle", prompt: "Choose your Fighting Style", options: [
            { id: "combatFeat", label: "A Fighting Style feat", summary: "Archery, Defense, Dueling, Two-Weapon Fighting, or another Fighting Style feat you qualify for - not modeled mechanically here." },
            { id: "druidicWarrior", label: "Druidic Warrior", summary: "Learn 2 Druid cantrips, castable as Ranger spells using Wisdom.", grantedSpells: [{ choice: { count: 2, spellLevel: 0 }, limit: "at will (cantrip), uses Wisdom" }] },
        ] } },
        { name: "Ability Score Improvement", level: 4, description: "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify. You gain this feature again at Ranger levels 8, 12, and 16." },
        { name: "Extra Attack", level: 5, description: "You can attack twice, instead of once, whenever you take the Attack action on your turn." },
        { name: "Roving", level: 6, description: "Your speed increases by 10 feet while you aren't wearing Heavy armor. You also gain a Climb Speed and a Swim Speed equal to your Speed." },
        { name: "Ability Score Improvement", level: 8, description: "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify." },
        { name: "Expertise", level: 9, description: "Choose two of your skill proficiencies with which you lack Expertise. You gain Expertise in those skills." },
        { name: "Tireless", level: 10, description: "As a Magic action, you can give yourself a number of Temporary Hit Points equal to 1d8 plus your Wisdom modifier (minimum of 1). You can use this action a number of times equal to your Wisdom modifier (minimum of once), and you regain all expended uses when you finish a Long Rest.\nWhenever you finish a Short Rest, your Exhaustion level, if any, decreases by 1." },
        { name: "Ability Score Improvement", level: 12, description: "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify." },
        { name: "Relentless Hunter", level: 13, description: "Taking damage can't break your concentration on the Hunter's Mark spell." },
        { name: "Nature's Veil", level: 14, description: "As a Bonus Action, you can give yourself the Invisible condition until the end of your next turn. You can use this feature a number of times equal to your Wisdom modifier (minimum once), and you regain all expended uses when you finish a Long Rest." },
        { name: "Ability Score Improvement", level: 16, description: "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify." },
        { name: "Precise Hunter", level: 17, description: "You have advantage on attack rolls against the creature currently marked by your Hunter's Mark spell." },
        { name: "Feral Senses", level: 18, description: "Your connection to the forces of nature grants you Blindsight with a range of 30 feet." },
        { name: "Epic Boon", level: 19, description: "You gain an Epic Boon feat or another feat of your choice for which you qualify. Boon of Dimensional Travel is recommended." },
        { name: "Foe Slayer", level: 20, description: "The damage die of your Hunter's Mark spell is a d10 rather than a d6." },
    ],
};
