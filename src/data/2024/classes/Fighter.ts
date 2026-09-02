import { CharacterClass } from "@/interfaces/CharacterClass";

// weaponMasteryProgression sourced directly from 5etools' class table data (not
// hand-recalled) - still worth a quick cross-check against your book.
export const Fighter: CharacterClass = {
    name: "Fighter",
    edition: "2024",
    hitDie: 10,
    proficiencies: {
        armor: ["Light armor", "Medium armor", "Heavy armor", "Shields"],
        weapons: ["Simple weapons", "Martial weapons"],
        savingThrows: ["strength", "constitution"],
        skills: { choose: 2, from: [
            "Acrobatics",
            "Animal Handling",
            "Athletics",
            "History",
            "Insight",
            "Intimidation",
            "Persuasion",
            "Perception",
            "Survival",
        ] },
    },
    multiclassProficiencies: {
        armor: ["Light armor", "Medium armor", "Shields"],
        weapons: ["Martial weapons"],
    },
    primaryAbility: "strength",
    casterProgression: "none",
    subclassLevel: 3,
    weaponMasteryProgression: { 1: 3, 4: 4, 10: 5, 16: 6 },
    // features text pulled and verified against 5etools' class-fighter.json (XPHB source) - https://5e.tools/classes.html#fighter_xphb
    // Corrected from an earlier from-memory pass: Fighting Style is a Fighting Style FEAT choice
    // in 2024 (not a plain list of named styles like the 2014 version); Second Wind's use count
    // (2, then 3 at level 4, then 4 at level 10) was missing entirely; Action Surge and
    // Indomitable are each just named "Action Surge" / "Indomitable" at every level they appear
    // (not "(one use)"/"(two uses)"/"(three uses)", which is 2014-only naming) and their level-17
    // text is identical to their earlier instance, per source; the level-11 and level-20 Extra
    // Attack entries are renamed to their real XPHB names "Two Extra Attacks" and "Three Extra
    // Attacks"; the previously-missing base features "Tactical Master" (9) and "Studied Attacks"
    // (13) were added; and level 19 is a distinct "Epic Boon" feature, not a fifth Ability Score
    // Improvement - the erroneous "At 19th level you can instead take an Epic Boon feat" clause
    // was removed from the other Ability Score Improvement entries accordingly.
    features: [
        { name: "Fighting Style", level: 1, description: "You have honed your martial prowess and gain a Fighting Style feat of your choice. Defense is recommended.\nWhenever you gain a Fighter level, you can replace the feat you chose with a different Fighting Style feat." },
        { name: "Second Wind", level: 1, description: "You have a limited well of physical and mental stamina that you can draw on. As a Bonus Action, you can use it to regain hit points equal to 1d10 plus your Fighter level.\nYou can use this feature twice. You regain one expended use when you finish a Short Rest, and you regain all expended uses when you finish a Long Rest.\nWhen you reach certain Fighter levels, you gain more uses of this feature: three uses at 4th level and four uses at 10th level." },
        { name: "Weapon Mastery", level: 1, description: "Your training with weapons allows you to use the mastery properties of three kinds of Simple or Martial weapons of your choice. Whenever you finish a Long Rest, you can practice weapon drills and change one of those weapon choices. When you reach certain Fighter levels, you gain the ability to use the mastery property of more kinds of weapons, as shown in the Weapon Mastery column of the class table." },
        { name: "Action Surge", level: 2, description: "You can push yourself beyond your normal limits for a moment. On your turn, you can take one additional action, except the Magic action. Once you use this feature, you can't do so again until you finish a Short or Long Rest. Starting at 17th level, you can use it twice before a rest, but only once on the same turn." },
        { name: "Tactical Mind", level: 2, description: "You have a mind for tactics on and off the battlefield. When you fail an ability check, you can expend a use of your Second Wind to push yourself toward success. Rather than regaining hit points, you roll 1d10 and add the number rolled to the ability check, potentially turning it into a success. If the check still fails, this use of Second Wind isn't expended." },
        { name: "Ability Score Improvement", level: 4, description: "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify. You gain this feature again at Fighter levels 6, 8, 12, 14, and 16." },
        { name: "Extra Attack", level: 5, description: "You can attack twice, instead of once, whenever you take the Attack action on your turn." },
        { name: "Tactical Shift", level: 5, description: "Whenever you activate your Second Wind with a Bonus Action, you can move up to half your speed without provoking Opportunity Attacks." },
        { name: "Ability Score Improvement", level: 6, description: "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify." },
        { name: "Ability Score Improvement", level: 8, description: "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify." },
        { name: "Indomitable", level: 9, description: "If you fail a saving throw, you can reroll it with a bonus equal to your Fighter level. You must use the new roll, and you can't use this feature again until you finish a Long Rest.\nYou can use this feature twice before a Long Rest starting at 13th level and three times before a Long Rest starting at 17th level." },
        { name: "Tactical Master", level: 9, description: "When you attack with a weapon whose mastery property you can use, you can replace that property with the Push, Sap, or Slow property for that attack." },
        { name: "Two Extra Attacks", level: 11, description: "You can attack three times, instead of once, whenever you take the Attack action on your turn." },
        { name: "Ability Score Improvement", level: 12, description: "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify." },
        { name: "Indomitable", level: 13, description: "If you fail a saving throw, you can reroll it with a bonus equal to your Fighter level. You must use the new roll, and you can't use this feature again until you finish a Long Rest.\nYou can use this feature twice before a Long Rest starting at 13th level and three times before a Long Rest starting at 17th level." },
        { name: "Studied Attacks", level: 13, description: "You study your opponents and learn from each attack you make. If you make an attack roll against a creature and miss, you have advantage on your next attack roll against that creature before the end of your next turn." },
        { name: "Ability Score Improvement", level: 14, description: "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify." },
        { name: "Ability Score Improvement", level: 16, description: "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify." },
        { name: "Action Surge", level: 17, description: "You can push yourself beyond your normal limits for a moment. On your turn, you can take one additional action, except the Magic action. Once you use this feature, you can't do so again until you finish a Short or Long Rest. Starting at 17th level, you can use it twice before a rest, but only once on the same turn." },
        { name: "Indomitable", level: 17, description: "If you fail a saving throw, you can reroll it with a bonus equal to your Fighter level. You must use the new roll, and you can't use this feature again until you finish a Long Rest.\nYou can use this feature twice before a Long Rest starting at 13th level and three times before a Long Rest starting at 17th level." },
        { name: "Epic Boon", level: 19, description: "You gain an Epic Boon feat or another feat of your choice for which you qualify. Boon of Combat Prowess is recommended." },
        { name: "Three Extra Attacks", level: 20, description: "You can attack four times, instead of once, whenever you take the Attack action on your turn." },
    ],
};
