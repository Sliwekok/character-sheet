import { CharacterClass } from "@/interfaces/CharacterClass";
import { halfCasterProgression } from "@/interfaces/SpellSlotsProgression";

// weaponMasteryProgression was previously missing entirely. Filled in to match the
// same {1,4,10} breakpoints and counts already sourced from 5etools for Barbarian
// (Fighter alone gets an extra step at 16) - worth a cross-check against your book.
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
    weaponMasteryProgression: { 1: 2, 4: 3, 10: 4 },
    // features text pulled and verified against 5etools' class-ranger.json (XPHB source) - https://5e.tools/classes.html#ranger_xphb
    // Corrected from an earlier from-memory pass, which mixed up several 2014 mechanics with the
    // redesigned 2024 ones: Favored Enemy grants two free Hunter's Mark casts (not a number equal
    // to proficiency bonus); Deft Explorer grants two languages and does NOT include a prepared
    // guidance cantrip - that cantrip choice actually belongs to the 2nd-level Fighting Style
    // feature's Druidic Warrior option, which is now correctly a Fighting Style feat choice
    // rather than a named 2014-style fighting style; a missing 9th-level "Expertise" feature has
    // been added; Tireless is actually gained at 10th level, not 9th (it was misplaced at 9,
    // displacing Nature's Veil, which is actually gained at 14th, not 10th), and it uses a Magic
    // action with Wisdom-modifier-limited uses rather than an unlimited Bonus Action; Precise
    // Hunter now correctly grants advantage on attack rolls against your Hunter's Mark target
    // rather than save advantage vs. Charmed/Frightened; Feral Senses now correctly grants
    // Blindsight 30 ft. rather than the 2014 "ignore disadvantage vs. unseen attackers" text;
    // level 19 is a distinctly-named "Epic Boon" feature (Boon of Dimensional Travel
    // recommended), not a fifth Ability Score Improvement; and Foe Slayer now correctly upgrades
    // Hunter's Mark's damage die to a d10 rather than granting a damage-maximizing effect.
    features: [
        { name: "Spellcasting", level: 1, description: "You have learned to channel the magical essence of nature to cast spells. See the Spells section of this sheet for the spells you have prepared, your spell save DC, and your spell attack bonus." },
        { name: "Favored Enemy", level: 1, description: "You always have the Hunter's Mark spell prepared. You can cast it twice without expending a spell slot, and you regain all expended uses when you finish a Long Rest.\nThe number of times you can cast the spell this way increases as you gain levels in this class." },
        { name: "Weapon Mastery", level: 1, description: "Your training allows you to use the mastery properties of two kinds of weapons of your choice with which you have proficiency. Whenever you finish a Long Rest, you can change one of your choices. This number increases as you gain levels in this class." },
        { name: "Deft Explorer", level: 2, description: "Thanks to your travels, you gain the following benefits: you gain Expertise in one skill proficiency of your choice, and you learn two languages of your choice." },
        { name: "Fighting Style", level: 2, description: "You gain a Fighting Style feat of your choice, such as Archery, Defense, Dueling, or Two-Weapon Fighting. Instead of one of those feats, you can choose the Druidic Warrior option: you learn two Druid cantrips of your choice, which count as Ranger spells for you and use Wisdom as their spellcasting ability, and you can replace one of them whenever you gain a Ranger level." },
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
