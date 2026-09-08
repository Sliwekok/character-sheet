import { CharacterClass } from "@/interfaces/CharacterClass";

export const Rogue: CharacterClass = {
    name: "Rogue",
    edition: "2024",
    hitDie: 8,
    proficiencies: {
        armor: ["Light armor"],
        // Fixed: this read "Martial weapons that have the type=martial weapon property" - a
        // garbled placeholder. Per Roll20's D&D 2024 Compendium ("Weapon Proficiencies" row,
        // https://roll20.net/compendium/dnd5e/Classes:Rogue, 2024 source), it's Martial weapons
        // that have the Finesse or Light property.
        weapons: ["Simple weapons", "Martial weapons that have the Finesse or Light property"],
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
    // weaponMasteryProgression corrected: the previous {1:2, 4:3, 10:4} was copied from
    // Barbarian's numbers and flagged in its own comment as unverified. Re-checked against
    // Roll20's D&D 2024 Compendium ("Rogue Features" table) -
    // https://roll20.net/compendium/dnd5e/Classes:Rogue (2024 source) - the table has no "Weapon
    // Mastery" column (only Sneak Attack) and the Weapon Mastery feature's text has no
    // level-scaling clause; it's a flat 2 weapons for the whole class, unlike Barbarian/Fighter.
    weaponMasteryProgression: { 1: 2 },
    // features text re-scraped and verified against Roll20's D&D 2024 Compendium ("Rogue
    // Features" table) - https://roll20.net/compendium/dnd5e/Classes:Rogue (2024 source)
    // Corrected from an earlier pass: the weapons proficiency string (see comment above) and
    // weaponMasteryProgression/Weapon Mastery's description (see comment above) were both wrong;
    // Sneak Attack was missing the "extra damage's type is the same as the weapon's type" clause;
    // Cunning Strike and Devious Strikes had been compressed into vague summaries instead of
    // listing their actual named effects and Sneak-Attack-die costs (Poison/Trip/Withdraw at 5th,
    // Daze/Knock Out/Obscure at 14th); and Epic Boon was missing its recommended boon. Expertise,
    // Thieves' Cant, Cunning Action, Rogue Subclass/Steady Aim, Ability Score Improvement,
    // Uncanny Dodge, Evasion, Reliable Talent, Improved Cunning Strike, Slippery Mind, Elusive,
    // and Stroke of Luck were already accurate and are unchanged.
    features: [
        { name: "Expertise", level: 1, description: "You gain Expertise in two of your skill proficiencies of your choice. Sleight of Hand and Stealth are recommended if you have proficiency in them. At 6th level, you gain Expertise in two more of your skill proficiencies of your choice." },
        { name: "Sneak Attack", level: 1, description: "You know how to strike subtly and exploit a foe's distraction. Once per turn, you can deal an extra 1d6 damage to one creature you hit with an attack roll if you have advantage on the roll and the attack uses a Finesse or a Ranged weapon. The extra damage's type is the same as the weapon's type. You don't need advantage on the attack roll if at least one of your allies is within 5 feet of the target, that ally isn't Incapacitated, and you don't have disadvantage on the attack roll. The extra damage increases as you gain levels in this class (2d6 at 3rd level, up to 10d6 at 19th level, increasing every two levels)." },
        { name: "Thieves' Cant", level: 1, description: "You picked up various languages in the communities where you plied your roguish talents. You know Thieves' Cant and one other language of your choice." },
        { name: "Weapon Mastery", level: 1, description: "Your training allows you to use the mastery properties of two kinds of weapons of your choice with which you have proficiency. Whenever you finish a Long Rest, you can change one of your choices." },
        { name: "Cunning Action", level: 2, description: "Your quick thinking and agility allow you to move and act quickly. You can take a Bonus Action on each of your turns to take the Dash, Disengage, or Hide action." },
        { name: "Steady Aim", level: 3, description: "As a Bonus Action, you give yourself advantage on your next attack roll on the current turn, provided you haven't moved this turn, and your speed is 0 until the end of the turn." },
        { name: "Ability Score Improvement", level: 4, description: "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify. You gain this feature again at Rogue levels 8, 10, 12, and 16." },
        { name: "Cunning Strike", level: 5, description: "You've developed cunning ways to use your Sneak Attack. When you deal Sneak Attack damage, you can add one of the following Cunning Strike effects. Each effect has a die cost, which is the number of Sneak Attack damage dice you must forgo to add the effect; you remove the die before rolling, and the effect occurs immediately after the attack's damage is dealt. If a Cunning Strike effect requires a saving throw, the DC equals 8 plus your Dexterity modifier and proficiency bonus.\nPoison (Cost: 1d6): You add a toxin to your strike, forcing the target to make a Constitution saving throw. On a failed save, the target is poisoned for 1 minute, repeating the save at the end of each of its turns, ending the effect on itself on a success. You must have a poisoner's kit on your person to use this effect.\nTrip (Cost: 1d6): If the target is Large or smaller, it must succeed on a Dexterity saving throw or be knocked prone.\nWithdraw (Cost: 1d6): Immediately after the attack, you move up to half your speed without provoking opportunity attacks." },
        { name: "Uncanny Dodge", level: 5, description: "When an attacker that you can see hits you with an attack, you can use your reaction to halve the attack's damage against you (round down)." },
        { name: "Expertise", level: 6, description: "You gain Expertise in two more of your skill proficiencies of your choice." },
        { name: "Evasion", level: 7, description: "You can nimbly dodge out of the way of certain area effects. When you are subjected to an effect that allows you to make a Dexterity saving throw to take only half damage, you instead take no damage if you succeed, and only half damage if you fail. You can't use this feature if you have the Incapacitated condition." },
        { name: "Reliable Talent", level: 7, description: "Whenever you make an ability check using one of your skill or tool proficiencies, you can treat a d20 roll of 9 or lower as a 10." },
        { name: "Ability Score Improvement", level: 8, description: "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify." },
        { name: "Ability Score Improvement", level: 10, description: "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify." },
        { name: "Improved Cunning Strike", level: 11, description: "You can use up to two Cunning Strike effects when you deal Sneak Attack damage, paying the die cost for each effect." },
        { name: "Ability Score Improvement", level: 12, description: "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify." },
        { name: "Devious Strikes", level: 14, description: "You've practiced new, deadlier ways to use your Sneak Attack. The following effects are now among your Cunning Strike options.\nDaze (Cost: 2d6): The target must succeed on a Constitution saving throw, or on its next turn, it can do only one of the following: move, take an action, or take a Bonus Action.\nKnock Out (Cost: 6d6): The target must succeed on a Constitution saving throw, or it falls unconscious for 1 minute or until it takes any damage, repeating the save at the end of each of its turns, ending the effect on itself on a success.\nObscure (Cost: 3d6): The target must succeed on a Dexterity saving throw, or it is blinded until the end of its next turn." },
        { name: "Slippery Mind", level: 15, description: "Your cunning mind is exceptionally difficult to control. You gain proficiency in Wisdom and Charisma saving throws." },
        { name: "Ability Score Improvement", level: 16, description: "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify." },
        { name: "Elusive", level: 18, description: "You are so evasive that attackers rarely gain the upper hand against you. No attack roll can have advantage against you unless you have the Incapacitated condition." },
        { name: "Epic Boon", level: 19, description: "You gain an Epic Boon feat or another feat of your choice for which you qualify. Boon of the Night Spirit is recommended." },
        { name: "Stroke of Luck", level: 20, description: "You have a marvelous knack for succeeding when you need to. If you fail a d20 Test - an ability check, attack roll, or saving throw - you can turn the roll into a 20. Once you use this feature, you can't use it again until you finish a Short or Long Rest." },
    ],
};
