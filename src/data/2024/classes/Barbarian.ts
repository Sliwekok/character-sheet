import { CharacterClass } from "@/interfaces/CharacterClass";

// weaponMasteryProgression sourced directly from 5etools' class table data (not
// hand-recalled) - still worth a quick cross-check against your book.
export const Barbarian: CharacterClass = {
    name: "Barbarian",
    edition: "2024",
    hitDie: 12,
    proficiencies: {
        armor: ["Light armor", "Medium armor", "Shields"],
        weapons: ["Simple weapons", "Martial weapons"],
        savingThrows: ["strength", "constitution"],
        skills: { choose: 2, from: ["Animal Handling", "Athletics", "Intimidation", "Nature", "Perception", "Survival"] },
    },
    multiclassProficiencies: {
        armor: ["Shields"],
        weapons: ["Martial weapons"],
    },
    primaryAbility: "strength",
    casterProgression: "none",
    subclassLevel: 3,
    weaponMasteryProgression: { 1: 2, 4: 3, 10: 4 },
    // features text pulled and verified against 5etools' class-barbarian.json (XPHB source) - https://5e.tools/classes.html#barbarian_xphb
    // Corrected from an earlier from-memory pass: Weapon Mastery started with two kinds (not
    // three, which also contradicts weaponMasteryProgression above); Rage was rewritten with
    // the redesigned "lasts until end of next turn, extend each turn, short-rest recovery"
    // mechanic; Relentless Rage now restores HP equal to twice your Barbarian level rather than
    // dropping you to 1; Persistent Rage gained its Initiative-roll recovery and 10-minute
    // no-extension duration; Brutal Strike/Improved Brutal Strike got their real named effects
    // (Forceful Blow, Hamstring Blow, Staggering Blow, Sundering Blow), including a level 13
    // Improved Brutal Strike entry that was missing entirely; and level 19 is Epic Boon, not a
    // fifth Ability Score Improvement.
    features: [
        { name: "Rage", level: 1, description: "You can imbue yourself with a primal power called Rage, a force that grants you extraordinary might and resilience.\nActivating Rage: As a Bonus Action, you activate your Rage, which lasts until the end of your next turn. It ends early if you're Incapacitated or if your turn ends and you haven't attacked a hostile creature since your last turn or forced a saving throw since then. You can also end it on your turn as a Bonus Action. Once you activate Rage, you can extend it for another round by taking one of those actions again; you can Rage in this way for up to 10 minutes total, and you can't Rage again until you finish a Short or Long Rest, or someone uses a spell like Bless on you that requires Concentration - if you finish a Short Rest, you regain one expended use of Rage (a minimum of one), and you regain all expended uses when you finish a Long Rest.\nBenefits While Raging: While Raging, you gain the following benefits if you aren't wearing Heavy armor: you have advantage on Strength checks and Strength saving throws; when you make an attack using Strength with a weapon or an Unarmed Strike, you gain a bonus to the damage roll that increases as you gain levels as a Barbarian, as shown in the Rage Damage column of the Barbarian table (+2 at level 1, +3 at level 9, +4 at level 16); and you have Resistance to Bludgeoning, Piercing, and Slashing damage.\nIf you can cast spells, you can't cast them or concentrate on them while Raging." },
        { name: "Unarmored Defense", level: 1, description: "While you aren't wearing armor, your base Armor Class equals 10 plus your Dexterity and Constitution modifiers. You can use a Shield and still gain this benefit." },
        { name: "Weapon Mastery", level: 1, description: "Your training with weapons allows you to use the weapon mastery properties of two kinds of Simple or Martial Melee weapons of your choice, such as Greataxes and Handaxes. Whenever you finish a Long Rest, you can change your choices. When you reach certain Barbarian levels, you gain the ability to use the mastery property of more kinds of weapons, as shown in the Weapon Mastery column of the class table." },
        { name: "Danger Sense", level: 2, description: "You gain an uncanny sense of when things nearby aren't as they should be, giving you an edge when you dodge away from danger. You have advantage on Dexterity saving throws unless you have the Incapacitated condition." },
        { name: "Reckless Attack", level: 2, description: "You can throw aside all concern for defense to attack with fierce desperation. When you make your first attack roll on your turn, you can decide to attack recklessly, giving you advantage on melee attack rolls using Strength during this turn, but attack rolls against you have advantage until your next turn." },
        { name: "Primal Knowledge", level: 3, description: "You gain proficiency in another skill of your choice from the skill list available to Barbarians at level 1. In addition, while raging, you can use Strength in place of the normal ability for an ability check with one of your proficient skills from that list - Acrobatics, Intimidation, Perception, Stealth, or Survival - as the primal power coursing through you hones your agility, bearing, and senses." },
        { name: "Ability Score Improvement", level: 4, description: "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify. You gain this feature again at Barbarian levels 8, 12, and 16." },
        { name: "Extra Attack", level: 5, description: "You can attack twice, instead of once, whenever you take the Attack action on your turn." },
        { name: "Fast Movement", level: 5, description: "Your speed increases by 10 feet while you aren't wearing Heavy armor." },
        { name: "Feral Instinct", level: 7, description: "Your instincts are so honed that you have advantage on Initiative rolls. Additionally, if you're surprised at the start of combat and aren't Incapacitated, you can act normally on your first turn if you enter your rage before doing anything else on that turn." },
        { name: "Instinctive Pounce", level: 7, description: "As part of the Bonus Action you take to activate your Rage, you can move up to half your Speed." },
        { name: "Ability Score Improvement", level: 8, description: "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify." },
        { name: "Brutal Strike", level: 9, description: "If you use Reckless Attack, you can forgo any Advantage on one Strength-based attack roll of your choice on your turn. The chosen attack roll mustn't have Disadvantage. If the chosen attack roll hits, the target takes an extra 1d10 damage of the same type dealt by the weapon or Unarmed Strike, and you can cause one Brutal Strike effect of your choice. You have the following effect options.\nForceful Blow: The target is pushed 15 feet straight away from you. You can then move up to half your Speed straight toward the target without provoking Opportunity Attacks.\nHamstring Blow: The target's Speed is reduced by 15 feet until the start of your next turn. A target can be affected by only one Hamstring Blow at a time - the most recent one." },
        { name: "Relentless Rage", level: 11, description: "Your rage can keep you fighting despite grievous wounds. If you drop to 0 hit points while your Rage is active and don't die outright, you can make a DC 10 Constitution saving throw. If you succeed, your hit points instead change to a number equal to twice your Barbarian level. Each time you use this feature after the first, the DC increases by 5. When you finish a Short or Long Rest, the DC resets to 10." },
        { name: "Ability Score Improvement", level: 12, description: "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify." },
        { name: "Improved Brutal Strike", level: 13, description: "You have honed new ways to attack furiously. The following effects are now among your Brutal Strike options.\nStaggering Blow: The target has Disadvantage on the next saving throw it makes, and it can't make Opportunity Attacks until the start of your next turn.\nSundering Blow: Before the start of your next turn, the next attack roll made by another creature against the target gains a +5 bonus to the roll. An attack roll can gain only one Sundering Blow bonus." },
        { name: "Persistent Rage", level: 15, description: "When you roll Initiative, you can regain all expended uses of Rage, and you can use this benefit only once per Long Rest. In addition, your Rage now lasts for 10 minutes without needing to be extended round by round, and it ends early only if you fall Unconscious or if you choose to end it." },
        { name: "Ability Score Improvement", level: 16, description: "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify." },
        { name: "Improved Brutal Strike", level: 17, description: "The extra damage of your Brutal Strike increases to 2d10, and you can now cause two different Brutal Strike effects of your choice with the same Brutal Strike, or the same effect twice where doing so makes sense." },
        { name: "Indomitable Might", level: 18, description: "If your total for a Strength check or Strength saving throw is less than your Strength score, you can use that score in place of the total." },
        { name: "Epic Boon", level: 19, description: "You gain an Epic Boon feat or another feat of your choice for which you qualify. Boon of Irresistible Offense is recommended." },
        { name: "Primal Champion", level: 20, description: "You embody primal power. Your Strength and Constitution scores increase by 4, to a maximum of 25." },
    ],
};
