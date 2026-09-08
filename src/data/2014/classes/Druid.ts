import { CharacterClass } from "@/interfaces/CharacterClass";
import { fullCasterProgression } from "@/interfaces/SpellSlotsProgression";

export const Druid: CharacterClass = {
    name: "Druid",
    edition: "2014",
    hitDie: 8,
    proficiencies: {
        armor: ["Light armor", "Medium armor", "Shield"],
        weapons: [
            "Clubs",
            "Daggers",
            "Darts",
            "Javelins",
            "Maces",
            "Quarterstaffs",
            "Scimitars",
            "Sickles",
            "Slings",
            "Spears",
        ],
        tools: ["Herbalism kit"],
        savingThrows: ["intelligence", "wisdom"],
        skills: { choose: 2, from: ["Arcana", "Animal Handling", "Insight", "Medicine", "Nature", "Perception", "Religion", "Survival"] },
    },
    multiclassProficiencies: {
        armor: ["Light armor", "Medium armor", "Shield"],
    },
    primaryAbility: "wisdom",
    casterProgression: "full",
    spellcasting: {
        ability: "wisdom",
        preparation: "prepared",
        ritualCasting: true,
        progression: fullCasterProgression,
    },
    subclassLevel: 2,
    // features re-scraped and verified against Roll20's D&D 5th Edition Compendium (Free Basic
    // Rules 2014 source, "Table: The Druid") - https://roll20.net/compendium/dnd5e/Classes:Druid
    // Corrected from an earlier pass: Spellcasting had been reduced to a two-sentence stub
    // pointing at "the Spells section of this sheet" instead of the actual rules text (cantrip
    // count, spell slot/preparation rules including the Wisdom-modifier-plus-druid-level formula,
    // spellcasting ability, ritual casting, and spellcasting focus) - Druidic's description, Wild
    // Shape's progression, the Ability Score Improvement levels, the Timeless Body/Beast Spells
    // order at 18th level, and Archdruid were already accurate and are unchanged.
    features: [
        { name: "Druidic", level: 1, description: "You know Druidic, the secret language of druids. You can speak the language and use it to leave hidden messages. You and others who know this language automatically spot such a message. Others spot the message's presence with a successful DC 15 Wisdom (Perception) check but can't decipher it without magic." },
        { name: "Spellcasting", level: 1, description: "Drawing on the divine essence of nature itself, you can cast spells to shape that essence to your will.\nCantrips: At 1st level, you know two cantrips of your choice from the druid spell list. You learn additional druid cantrips of your choice at higher levels, as shown in the Cantrips Known column of the Druid table.\nPreparing and Casting Spells: The Druid table shows how many spell slots you have to cast your spells of 1st level and higher. To cast one of these druid spells, you must expend a slot of the spell's level or higher. You regain all expended spell slots when you finish a long rest. You prepare the list of druid spells that are available for you to cast, choosing from the druid spell list. When you do so, choose a number of druid spells equal to your Wisdom modifier + your druid level (minimum of one spell). The spells must be of a level for which you have spell slots. For example, if you are a 3rd-level druid, you have four 1st-level and two 2nd-level spell slots. With a Wisdom of 16, your list of prepared spells can include six spells of 1st or 2nd level, in any combination. If you prepare the 1st-level spell Cure Wounds, you can cast it using a 1st-level or 2nd-level slot. Casting the spell doesn't remove it from your list of prepared spells. You can also change your list of prepared spells when you finish a long rest. Preparing a new list of druid spells requires time spent in prayer and meditation: at least 1 minute per spell level for each spell on your list.\nSpellcasting Ability: Wisdom is your spellcasting ability for your druid spells, since your magic draws upon your devotion and attunement to nature. You use your Wisdom whenever a spell refers to your spellcasting ability. In addition, you use your Wisdom modifier when setting the saving throw DC for a druid spell you cast and when making an attack roll with one.\nRitual Casting: You can cast a druid spell as a ritual if that spell has the ritual tag and you have the spell prepared.\nSpellcasting Focus: You can use a druidic focus as a spellcasting focus for your druid spells." },
        { name: "Wild Shape", level: 2, description: "You can use your action to magically assume the shape of a beast that you have seen before. You can use this feature twice, regaining expended uses when you finish a short or long rest. Your druid level determines the beasts you can transform into, as shown in the Beast Shapes table (initially limited to a challenge rating of 1/4 with no swimming or flying speed). You can stay in a beast shape for a number of hours equal to half your druid level (rounded down), or until you drop to 0 hit points or die." },
        { name: "Wild Shape Improvement (swimming)", level: 4, description: "You can transform into a beast with a challenge rating as high as 1/2, and you can now transform into a beast with a swimming speed." },
        { name: "Ability Score Improvement", level: 4, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature." },
        { name: "Wild Shape Improvement (flying)", level: 8, description: "You can transform into a beast with a challenge rating as high as 1, and you can now transform into a beast with a flying speed." },
        { name: "Ability Score Improvement", level: 8, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature." },
        { name: "Ability Score Improvement", level: 12, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature." },
        { name: "Ability Score Improvement", level: 16, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature." },
        { name: "Timeless Body", level: 18, description: "The primal magic that you wield causes you to age more slowly. For every 10 years that pass, your body ages only 1 year." },
        { name: "Beast Spells", level: 18, description: "You can cast many of your druid spells in any shape you assume using Wild Shape. You can perform the somatic and verbal components of a druid spell while in a beast shape, but you aren't able to provide material components." },
        { name: "Ability Score Improvement", level: 19, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature." },
        { name: "Archdruid", level: 20, description: "You can use Wild Shape an unlimited number of times. Additionally, you can ignore the verbal and somatic components of your druid spells, as well as any material components that lack a cost and aren't consumed by a spell." },
    ],
};
