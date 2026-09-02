import { CharacterClass } from "@/interfaces/CharacterClass";

export const Monk: CharacterClass = {
    name: "Monk",
    edition: "2024",
    hitDie: 8,
    proficiencies: {
        armor: [],
        weapons: ["Simple weapons", "Martial weapons that have the type=martial weapon property"],
        tools: ["Choose one type of Artisan's Tools or Musical Instrument"],
        savingThrows: ["strength", "dexterity"],
        skills: { choose: 2, from: ["Acrobatics", "Athletics", "History", "Insight", "Religion", "Stealth"] },
    },
    primaryAbility: "dexterity",
    casterProgression: "none",
    subclassLevel: 3,
    // features text pulled and verified against 5etools' class-monk.json (XPHB source) - https://5e.tools/classes.html#monk_xphb
    // Corrected from an earlier from-memory pass: Uncanny Metabolism is gained at level 2 (not 3)
    // and regains HP equal to Monk level plus a Martial Arts die roll, not a flat Wisdom-modifier
    // amount; Deflect Attacks is gained at level 3 (not 4), only works against
    // Bludgeoning/Piercing/Slashing damage, and redirects force at a nearby creature rather than
    // catching-and-shooting the missile; Stunning Strike was rewritten with its "once per turn"
    // limit and its new partial-success effect (Speed halved, next attack against the target has
    // advantage); Empowered Strikes is gained at level 6 (not 10) and now grants an optional Force
    // damage type rather than "counts as magical"; Acrobatic Movement (9), Heightened Focus (10),
    // Self-Restoration (10), Deflect Energy (13), and Perfect Focus (15) were missing entirely;
    // "Diamond Soul" at 14 doesn't exist in the 2024 class - it's named Disciplined Survivor;
    // "Tongue of the Sun and Moon" at 13 was cut from the base class entirely and removed; Body
    // and Mind is the level 20 capstone (not a level 17 feature), and increases Dexterity and
    // Wisdom by 4 (not Wisdom by 2 plus a speed bonus); and level 19 is Epic Boon, not a fifth
    // Ability Score Improvement.
    features: [
        { name: "Martial Arts", level: 1, description: "Your practice of martial arts techniques gives you mastery of combat styles using Unarmed Strikes and Monk weapons (Simple Melee weapons and Martial Melee weapons that have the Light property). While you are unarmed or wielding only Monk weapons and not wearing armor or wielding a Shield, you gain the following benefits: you can make an Unarmed Strike as a Bonus Action; you can roll a d6 in place of the normal damage of your Unarmed Strike or Monk weapons (this die increases as you gain monk levels: d8 at 5th, d10 at 11th, d12 at 17th); and you can use your Dexterity modifier instead of your Strength modifier for the attack and damage rolls of your Unarmed Strikes and Monk weapons, as well as for the save DC when you Grapple or Shove with an Unarmed Strike." },
        { name: "Unarmored Defense", level: 1, description: "While you aren't wearing armor or wielding a Shield, your base Armor Class equals 10 plus your Dexterity and Wisdom modifiers." },
        { name: "Monk's Focus", level: 2, description: "Your focus and martial training let you harness a well of extraordinary energy within yourself, represented by Focus Points equal to your monk level. When you expend a Focus Point, it's unavailable until you finish a Short or Long Rest, at the end of which you regain all your expended points. You start knowing three Focus features:\nFlurry of Blows: You can expend 1 Focus Point to make two Unarmed Strikes as a Bonus Action.\nPatient Defense: You can take the Disengage action as a Bonus Action; you can also expend 1 Focus Point to take both the Disengage and Dodge actions as a Bonus Action.\nStep of the Wind: You can take the Dash action as a Bonus Action; you can also expend 1 Focus Point to take both the Disengage and Dash actions as a Bonus Action, with your jump distance doubled for the turn.\nSome Focus features require a saving throw with a DC equal to 8 plus your Wisdom modifier and proficiency bonus." },
        { name: "Unarmored Movement", level: 2, description: "Your speed increases by 10 feet while you aren't wearing armor or wielding a Shield. This bonus increases as you gain monk levels (to +15 ft at 6th, +20 ft at 10th, +25 ft at 14th, +30 ft at 18th)." },
        { name: "Uncanny Metabolism", level: 2, description: "When you roll Initiative, you can regain all your expended Focus Points; when you do, roll your Martial Arts die and regain a number of Hit Points equal to your monk level plus the number rolled. Once you use this feature, you can't do so again until you finish a Long Rest." },
        { name: "Deflect Attacks", level: 3, description: "When an attack roll hits you and its damage includes Bludgeoning, Piercing, or Slashing damage, you can take a Reaction to reduce the attack's total damage against you by 1d10 plus your Dexterity modifier and monk level. If you reduce the damage to 0, you can expend 1 Focus Point to redirect some of the attack's force at a creature you can see within 5 feet of yourself (if the attack was melee) or within 60 feet and not behind total cover (if the attack was ranged); that creature must succeed on a Dexterity saving throw or take damage, of the same type dealt by the attack, equal to two rolls of your Martial Arts die plus your Dexterity modifier." },
        { name: "Ability Score Improvement", level: 4, description: "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify. You gain this feature again at Monk levels 8, 12, and 16." },
        { name: "Slow Fall", level: 4, description: "You can take a Reaction when you fall to reduce any falling damage you take by an amount equal to five times your monk level." },
        { name: "Extra Attack", level: 5, description: "You can attack twice, instead of once, whenever you take the Attack action on your turn." },
        { name: "Stunning Strike", level: 5, description: "Once per turn when you hit a creature with a Monk weapon or an Unarmed Strike, you can expend 1 Focus Point to attempt a stunning strike. The target must make a Constitution saving throw. On a failed save, the target is stunned until the start of your next turn. On a successful save, the target's Speed is halved until the start of your next turn, and the next attack roll made against it before then has advantage." },
        { name: "Empowered Strikes", level: 6, description: "Whenever you deal damage with your Unarmed Strike, you can choose for it to deal Force damage instead of its normal damage type." },
        { name: "Evasion", level: 7, description: "When you're subjected to an effect that allows you to make a Dexterity saving throw to take only half damage, you instead take no damage if you succeed on the saving throw and only half damage if you fail. You don't benefit from this feature if you're incapacitated." },
        { name: "Ability Score Improvement", level: 8, description: "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify." },
        { name: "Acrobatic Movement", level: 9, description: "While you aren't wearing armor or wielding a Shield, you can move along vertical surfaces and across liquids on your turn without falling during the movement." },
        { name: "Heightened Focus", level: 10, description: "Your Flurry of Blows, Patient Defense, and Step of the Wind gain the following benefits.\nFlurry of Blows: You can expend 1 Focus Point to make three Unarmed Strikes with it instead of two.\nPatient Defense: When you expend a Focus Point to use it, you gain Temporary Hit Points equal to two rolls of your Martial Arts die.\nStep of the Wind: When you expend a Focus Point to use it, you can bring a willing Large or smaller creature within 5 feet of yourself along with you until the end of your turn, without its movement provoking Opportunity Attacks." },
        { name: "Self-Restoration", level: 10, description: "At the end of each of your turns, you can remove one of the following conditions from yourself: charmed, frightened, or poisoned. In addition, forgoing food and drink doesn't give you levels of exhaustion." },
        { name: "Ability Score Improvement", level: 12, description: "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify." },
        { name: "Deflect Energy", level: 13, description: "You can now use your Deflect Attacks feature against attacks that deal any damage type, not just Bludgeoning, Piercing, or Slashing." },
        { name: "Disciplined Survivor", level: 14, description: "Your physical and mental discipline grant you proficiency in all saving throws. Additionally, whenever you make a saving throw and fail, you can expend 1 Focus Point to reroll it, and you must use the new roll." },
        { name: "Perfect Focus", level: 15, description: "When you roll Initiative and don't use Uncanny Metabolism, you regain expended Focus Points until you have 4, if you have 3 or fewer." },
        { name: "Ability Score Improvement", level: 16, description: "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify." },
        { name: "Superior Defense", level: 18, description: "At the start of your turn, you can expend 3 Focus Points to bolster yourself against harm for 1 minute or until you're incapacitated. During that time, you have resistance to all damage except Force damage." },
        { name: "Epic Boon", level: 19, description: "You gain an Epic Boon feat or another feat of your choice for which you qualify. Boon of Irresistible Offense is recommended." },
        { name: "Body and Mind", level: 20, description: "Your Dexterity and Wisdom scores increase by 4, to a maximum of 25." },
    ],
};
