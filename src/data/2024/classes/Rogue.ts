import { CharacterClass } from "@/interfaces/CharacterClass";

// weaponMasteryProgression was previously missing entirely. Filled in to match the
// same {1,4,10} breakpoints and counts already sourced from 5etools for Barbarian
// (Fighter alone gets an extra step at 16) - worth a cross-check against your book.
export const Rogue: CharacterClass = {
    name: "Rogue",
    edition: "2024",
    hitDie: 8,
    proficiencies: {
        armor: ["Light armor"],
        weapons: ["Simple weapons", "Martial weapons that have the type=martial weapon property"],
        tools: ["Thieves' Tools"],
        savingThrows: ["dexterity", "intelligence"],
        skills: { choose: 4, from: [
            "Acrobatics",
            "Athletics",
            "Deception",
            "Insight",
            "Intimidation",
            "Investigation",
            "Perception",
            "Persuasion",
            "Sleight of Hand",
            "Stealth",
        ] },
    },
    multiclassProficiencies: {
        armor: ["Light armor"],
        tools: ["Thieves' Tools"],
        skills: { choose: 1, from: [
            "Acrobatics",
            "Athletics",
            "Deception",
            "Insight",
            "Intimidation",
            "Investigation",
            "Perception",
            "Persuasion",
            "Sleight of Hand",
            "Stealth",
        ] },
    },
    primaryAbility: "dexterity",
    casterProgression: "none",
    subclassLevel: 3,
    weaponMasteryProgression: { 1: 2, 4: 3, 10: 4 },
    // features text pulled and verified against 5etools' class-rogue.json (XPHB source) - https://5e.tools/classes.html#rogue_xphb
    // Corrected from an earlier from-memory pass, which had reused 2014 PHB wording throughout and
    // missed the 2024 redesign: Expertise and its level-6 repeat no longer offer thieves' tools as an
    // alternative (skills only); Sneak Attack's no-advantage condition is now "an ally within 5 feet
    // of the target" rather than "another enemy"; Thieves' Cant was reworked to grant Thieves' Cant
    // plus one extra language, dropping the old "four times longer"/secret-signs text; Evasion now
    // explicitly can't be used while Incapacitated; Slippery Mind grants Wisdom AND Charisma save
    // proficiency, not Wisdom alone; Stroke of Luck was generalized to "turn any failed d20 Test into
    // a 20" instead of the old separate miss-to-hit/ability-check wording; and the base "Cunning
    // Strike" feature at level 5 (introducing the Sneak-Attack-die-for-effect mechanic that Improved
    // Cunning Strike and Devious Strikes build on) was missing entirely - Improved Cunning Strike had
    // wrongly been given Cunning Strike's own description. Ability Score Improvement entries were
    // rewritten to the actual 2024 "gain the Ability Score Improvement feat or another feat" phrasing
    // (not the 2014 +2/+1 wording), and level 19 is Epic Boon, not a sixth Ability Score Improvement.
    features: [
        { name: "Expertise", level: 1, description: "You gain Expertise in two of your skill proficiencies of your choice. Sleight of Hand and Stealth are recommended if you have proficiency in them. At 6th level, you gain Expertise in two more of your skill proficiencies of your choice." },
        { name: "Sneak Attack", level: 1, description: "You know how to strike subtly and exploit a foe's distraction. Once per turn, you can deal an extra 1d6 damage to one creature you hit with an attack roll if you have advantage on the roll and the attack uses a Finesse or a Ranged weapon. You don't need advantage on the attack roll if at least one of your allies is within 5 feet of the target, that ally isn't Incapacitated, and you don't have disadvantage on the attack roll. The extra damage increases as you gain levels in this class (2d6 at 3rd level, up to 10d6 at 19th level, increasing every two levels)." },
        { name: "Thieves' Cant", level: 1, description: "You picked up various languages in the communities where you plied your roguish talents. You know Thieves' Cant and one other language of your choice." },
        { name: "Weapon Mastery", level: 1, description: "Your training allows you to use the mastery properties of two kinds of weapons of your choice with which you have proficiency. Whenever you finish a Long Rest, you can change the kinds of weapons you chose. This number increases as you gain levels in this class." },
        { name: "Cunning Action", level: 2, description: "Your quick thinking and agility allow you to move and act quickly. You can take a Bonus Action on each of your turns to take the Dash, Disengage, or Hide action." },
        { name: "Steady Aim", level: 3, description: "As a Bonus Action, you give yourself advantage on your next attack roll on the current turn, provided you haven't moved this turn, and your speed is 0 until the end of the turn." },
        { name: "Ability Score Improvement", level: 4, description: "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify. You gain this feature again at Rogue levels 8, 10, 12, and 16." },
        { name: "Cunning Strike", level: 5, description: "You've developed cunning ways to use your Sneak Attack. When you deal Sneak Attack damage, you can forgo one or more of the Sneak Attack's damage dice to add a Cunning Strike effect, such as poisoning the target, tripping it prone, or withdrawing from combat without provoking an opportunity attack. Any required saving throw DC equals 8 plus your Dexterity modifier and proficiency bonus." },
        { name: "Uncanny Dodge", level: 5, description: "When an attacker that you can see hits you with an attack, you can use your reaction to halve the attack's damage against you (round down)." },
        { name: "Expertise", level: 6, description: "You gain Expertise in two more of your skill proficiencies of your choice." },
        { name: "Evasion", level: 7, description: "You can nimbly dodge out of the way of certain area effects. When you are subjected to an effect that allows you to make a Dexterity saving throw to take only half damage, you instead take no damage if you succeed, and only half damage if you fail. You can't use this feature if you have the Incapacitated condition." },
        { name: "Reliable Talent", level: 7, description: "Whenever you make an ability check using one of your skill or tool proficiencies, you can treat a d20 roll of 9 or lower as a 10." },
        { name: "Ability Score Improvement", level: 8, description: "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify." },
        { name: "Ability Score Improvement", level: 10, description: "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify." },
        { name: "Improved Cunning Strike", level: 11, description: "You can use up to two Cunning Strike effects when you deal Sneak Attack damage, paying the die cost for each effect." },
        { name: "Ability Score Improvement", level: 12, description: "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify." },
        { name: "Devious Strikes", level: 14, description: "You've practiced new, deadlier ways to use your Sneak Attack. New Cunning Strike options become available to you, including dazing the target, knocking it unconscious, or blinding it, at the cost of forgoing more Sneak Attack dice." },
        { name: "Slippery Mind", level: 15, description: "Your cunning mind is exceptionally difficult to control. You gain proficiency in Wisdom and Charisma saving throws." },
        { name: "Ability Score Improvement", level: 16, description: "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify." },
        { name: "Elusive", level: 18, description: "You are so evasive that attackers rarely gain the upper hand against you. No attack roll can have advantage against you unless you have the Incapacitated condition." },
        { name: "Epic Boon", level: 19, description: "You gain an Epic Boon feat or another feat of your choice for which you qualify." },
        { name: "Stroke of Luck", level: 20, description: "You have a marvelous knack for succeeding when you need to. If you fail a d20 Test - an ability check, attack roll, or saving throw - you can turn the roll into a 20. Once you use this feature, you can't use it again until you finish a Short or Long Rest." },
    ],
};
