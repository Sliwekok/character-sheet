import { CharacterClass } from "@/interfaces/CharacterClass";
import { fullCasterProgression } from "@/interfaces/SpellSlotsProgression";

export const Druid: CharacterClass = {
    name: "Druid",
    edition: "2024",
    hitDie: 8,
    proficiencies: {
        armor: ["Light armor", "Shields"],
        weapons: ["Simple weapons"],
        tools: ["Herbalism Kit"],
        savingThrows: ["intelligence", "wisdom"],
        skills: { choose: 2, from: ["Arcana", "Animal Handling", "Insight", "Medicine", "Nature", "Perception", "Religion", "Survival"] },
    },
    multiclassProficiencies: {
        armor: ["Light armor", "Shields"],
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
    // features text pulled and verified against 5etools' class-druid.json (XPHB source) - https://5e.tools/classes.html#druid_xphb
    // Corrected from an earlier from-memory pass: Wild Shape is a Bonus Action into one of four
    // pre-learned known forms (not "any beast you've seen"), grants temporary hit points, and
    // regains only one use on a short rest (all uses on a long rest); Elemental Fury is gained at
    // level 7, not level 11, and its level-15 upgrade "Improved Elemental Fury" was missing
    // entirely and has been added; Wild Companion, Wild Resurgence, Primal Order, and Beast Spells
    // were reworded to match the redesigned mechanics; level 18's "Timeless Body" doesn't exist as
    // its own feature in 2024 - its longevity clause is folded into Archdruid at level 20 instead;
    // level 19 is a distinctly named Epic Boon feature, not a fifth Ability Score Improvement; the
    // remaining ASI entries (4/8/12/16) were reworded to the "feat" phrasing; and feature order at
    // levels 1 and 2 was corrected to match the class table (Primal Order before Spellcasting,
    // Wild Companion before Wild Shape).
    features: [
        { name: "Druidic", level: 1, description: "You know Druidic, the secret language of druids. While learning this ancient tongue, you also unlocked the magic of communicating with animals - you always have the Speak with Animals spell prepared.\nYou can use Druidic to leave hidden messages. You and others who know Druidic automatically spot such a message. Others spot the message's presence with a successful DC 15 Intelligence (Investigation) check but can't decipher it without magic." },
        { name: "Primal Order", level: 1, description: "You have dedicated yourself to one of the following sacred roles of your choice. Magician: you know one extra cantrip from the druid spell list, and your mystical connection to nature gives you a bonus to your Intelligence (Arcana or Nature) checks equal to your Wisdom modifier (minimum bonus of +1). Warden: you gain proficiency with Martial weapons and training with Medium armor." },
        { name: "Spellcasting", level: 1, description: "Drawing on the divine essence of nature itself, you can cast spells to shape that essence to your will. See the Spells section of this sheet for the spells you have prepared, your spell save DC, and your spell attack bonus." },
        { name: "Wild Companion", level: 2, description: "You can summon a nature spirit that assumes an animal form to aid you. As a Magic action, you can expend a spell slot or a use of Wild Shape to cast the Find Familiar spell without material components. The familiar is a fey creature when summoned this way, and it disappears when you finish a long rest." },
        { name: "Wild Shape", level: 2, description: "The power of nature allows you to assume the form of an animal. As a Bonus Action, you shape-shift into a Beast form you have learned for this feature. You stay in that form for a number of hours equal to half your druid level, or until you use Wild Shape again, have the Incapacitated condition, or die - you can also leave the form early as a Bonus Action.\nNumber of Uses: You can use Wild Shape twice, regaining one expended use when you finish a short rest and all expended uses when you finish a long rest. You gain additional uses at higher druid levels.\nKnown Forms: You know four Beast forms for this feature, chosen from Beast stat blocks with a maximum challenge rating of 1/4 that lack a flying speed. You can swap a known form for another eligible one whenever you finish a long rest. Your number of known forms and their maximum challenge rating increase at higher druid levels, and starting at 8th level you can adopt a form that has a flying speed.\nWhile Shape-Shifted: When you assume a Wild Shape form you gain temporary hit points equal to your druid level. You retain your personality, memories, and ability to speak. Your game statistics are replaced by the beast's stat block, but you keep your creature type, hit points, Hit Dice, Intelligence, Wisdom, and Charisma scores, class features, languages, and feats, along with your own skill and saving throw proficiencies (using the higher of your bonus or the creature's). You can't cast spells, though shape-shifting doesn't break your concentration on a spell you've already cast." },
        { name: "Ability Score Improvement", level: 4, description: "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify. You gain this feature again at druid levels 8, 12, and 16." },
        { name: "Wild Resurgence", level: 5, description: "Once on each of your turns, if you have no uses of Wild Shape left, you can give yourself one use by expending a spell slot (no action required). Additionally, once per long rest, you can expend one use of Wild Shape (no action required) to give yourself a level 1 spell slot." },
        { name: "Elemental Fury", level: 7, description: "The might of the elements flows through you. You gain one of the following options of your choice.\nPotent Spellcasting: Add your Wisdom modifier to the damage you deal with any druid cantrip.\nPrimal Strike: Once on each of your turns when you hit a creature with an attack roll using a weapon or a Beast form's attack in Wild Shape, you can cause the target to take an extra 1d8 cold, fire, lightning, or thunder damage (choose when you hit)." },
        { name: "Ability Score Improvement", level: 8, description: "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify." },
        { name: "Ability Score Improvement", level: 12, description: "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify." },
        { name: "Improved Elemental Fury", level: 15, description: "The option you chose for Elemental Fury grows more powerful.\nPotent Spellcasting: When you cast a druid cantrip with a range of 10 feet or greater, the spell's range increases by 300 feet.\nPrimal Strike: The extra damage of your Primal Strike increases to 2d8." },
        { name: "Ability Score Improvement", level: 16, description: "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify." },
        { name: "Beast Spells", level: 18, description: "While using Wild Shape, you can cast spells in your Beast form, except for any spell that has a material component with a specified cost or that the spell consumes." },
        { name: "Epic Boon", level: 19, description: "You gain an Epic Boon feat or another feat of your choice for which you qualify. Boon of Dimensional Travel is recommended." },
        { name: "Archdruid", level: 20, description: "The vitality of nature constantly blooms within you, granting you the following benefits.\nEvergreen Wild Shape: Whenever you roll Initiative and have no uses of Wild Shape left, you regain one expended use of it.\nNature Magician: Once per long rest, you can convert your unexpended uses of Wild Shape into a single spell slot (no action required), with each use contributing 2 spell levels - for example, converting two uses produces a 4th-level spell slot.\nLongevity: The primal magic that you wield causes you to age more slowly. For every 10 years that pass, your body ages only 1 year." },
    ],
};
