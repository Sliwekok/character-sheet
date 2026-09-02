import { CharacterClass } from "@/interfaces/CharacterClass";
import { fullCasterProgression } from "@/interfaces/SpellSlotsProgression";

export const Bard: CharacterClass = {
    name: "Bard",
    edition: "2014",
    hitDie: 8,
    proficiencies: {
        armor: ["Light armor"],
        weapons: ["Simple weapons", "Hand crossbows", "Longswords", "Rapiers", "Shortswords"],
        tools: ["Three musical instruments of your choice"],
        savingThrows: ["dexterity", "charisma"],
        // Fixed: this was `{ choose: 1, from: [] }` - an empty pool made Bard's
        // primary class skill choice impossible to satisfy. PHB Bard skill
        // proficiency is "Choose any three" from the full skill list (the list
        // below was already present, just misplaced under
        // multiclassProficiencies instead of here).
        skills: { choose: 3, from: [
            "Athletics",
            "Acrobatics",
            "Sleight of Hand",
            "Stealth",
            "Arcana",
            "History",
            "Investigation",
            "Nature",
            "Religion",
            "Animal Handling",
            "Insight",
            "Medicine",
            "Perception",
            "Survival",
            "Deception",
            "Intimidation",
            "Performance",
            "Persuasion",
        ] },
    },
    multiclassProficiencies: {
        armor: ["Light armor"],
        tools: ["One musical instrument of your choice"],
        skills: { choose: 1, from: [
            "Athletics",
            "Acrobatics",
            "Sleight of Hand",
            "Stealth",
            "Arcana",
            "History",
            "Investigation",
            "Nature",
            "Religion",
            "Animal Handling",
            "Insight",
            "Medicine",
            "Perception",
            "Survival",
            "Deception",
            "Intimidation",
            "Performance",
            "Persuasion",
        ] },
    },
    primaryAbility: "charisma",
    casterProgression: "full",
    spellcasting: {
        ability: "charisma",
        preparation: "known",
        ritualCasting: true,
        progression: fullCasterProgression,
    },
    subclassLevel: 3,
    // features text pulled and verified against 5etools' class-bard.json (PHB source) - https://5e.tools/classes.html#bard_phb
    // Corrected from an earlier from-memory pass: Spellcasting was a paraphrased summary
    // instead of the actual rules text (cantrip/spell-known progression, spell slot use,
    // spellcasting ability, ritual casting, and spellcasting focus were all missing); every
    // Ability Score Improvement entry was missing the "if your DM allows the use of feats,
    // you may instead take a feat" clause; Countercharm was missing its early-end clause; and
    // Song of Rest/Magical Secrets/Expertise/Bardic Inspiration wording was tightened to match
    // the book exactly (the "Bard College" subclass-choice placeholder at level 3 and the
    // generic "gain a feature from your Bard College" placeholder at level 6 remain correctly
    // omitted, since subclass features live in Subclass.features).
    features: [
        { name: "Spellcasting", level: 1, description: "You have learned to untangle and reshape the fabric of reality in harmony with your wishes and music. Your spells are part of your vast repertoire, magic that you can tune to different situations.\nCantrips: You know two cantrips of your choice from the bard spell list. You learn additional bard cantrips of your choice at higher levels, learning a 3rd cantrip at 4th level and a 4th at 10th level.\nSpell Slots: The Bard table shows how many spell slots you have to cast your bard spells of 1st level and higher. To cast one of these spells, you must expend a slot of the spell's level or higher. You regain all expended spell slots when you finish a long rest. For example, if you know the 1st-level spell cure wounds and have a 1st-level and a 2nd-level spell slot available, you can cast cure wounds using either slot.\nSpells Known of 1st Level and Higher: You know four 1st-level spells of your choice from the bard spell list. You learn an additional bard spell of your choice at each level except 12th, 16th, 19th, and 20th. Each of these spells must be of a level for which you have spell slots. For instance, when you reach 3rd level in this class, you can learn one new spell of 1st or 2nd level. Additionally, when you gain a level in this class, you can choose one of the bard spells you know and replace it with another spell from the bard spell list, which also must be of a level for which you have spell slots.\nSpellcasting Ability: Charisma is your spellcasting ability for your bard spells. Your magic comes from the heart and soul you pour into the performance of your music or oration. You use your Charisma whenever a spell refers to your spellcasting ability. In addition, you use your Charisma modifier when setting the saving throw DC for a bard spell you cast and when making an attack roll with one.\nRitual Casting: You can cast any bard spell you know as a ritual if that spell has the ritual tag.\nSpellcasting Focus: You can use a musical instrument as a spellcasting focus for your bard spells." },
        { name: "Bardic Inspiration (d6)", level: 1, description: "You can inspire others through stirring words or music. To do so, you use a bonus action on your turn to choose one creature other than yourself within 60 feet of you who can hear you. That creature gains one Bardic Inspiration die, a d6. Once within the next 10 minutes, the creature can roll the die and add the number rolled to one ability check, attack roll, or saving throw it makes. The creature can wait until after it rolls the d20 before deciding to use the Bardic Inspiration die, but must decide before the DM says whether the roll succeeds or fails. Once the Bardic Inspiration die is rolled, it is lost. A creature can have only one Bardic Inspiration die at a time. You can use this feature a number of times equal to your Charisma modifier (a minimum of once). You regain any expended uses when you finish a long rest. Your Bardic Inspiration die changes when you reach certain levels in this class. The die becomes a d8 at 5th level, a d10 at 10th level, and a d12 at 15th level." },
        { name: "Jack of All Trades", level: 2, description: "Starting at 2nd level, you can add half your proficiency bonus, rounded down, to any ability check you make that doesn't already include your proficiency bonus." },
        { name: "Song of Rest (d6)", level: 2, description: "Beginning at 2nd level, you can use soothing music or oration to help revitalize your wounded allies during a short rest. If you or any friendly creatures who can hear your performance regain hit points by spending Hit Dice at the end of the short rest, each of those creatures regains an extra 1d6 hit points. The extra hit points increase when you reach certain levels in this class: to 1d8 at 9th level, to 1d10 at 13th level, and to 1d12 at 17th level." },
        { name: "Expertise", level: 3, description: "At 3rd level, choose two of your skill proficiencies. Your proficiency bonus is doubled for any ability check you make that uses either of the chosen proficiencies. At 10th level, you can choose another two skill proficiencies to gain this benefit." },
        { name: "Ability Score Improvement", level: 4, description: "When you reach 4th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1. As normal, you can't increase an ability score above 20 using this feature. If your DM allows the use of feats, you may instead take a feat." },
        { name: "Bardic Inspiration (d8)", level: 5, description: "At 5th level, your Bardic Inspiration die changes to a d8." },
        { name: "Font of Inspiration", level: 5, description: "Beginning when you reach 5th level, you regain all of your expended uses of Bardic Inspiration when you finish a short or long rest." },
        { name: "Countercharm", level: 6, description: "At 6th level, you gain the ability to use musical notes or words of power to disrupt mind-influencing effects. As an action, you can start a performance that lasts until the end of your next turn. During that time, you and any friendly creatures within 30 feet of you have advantage on saving throws against being frightened or charmed. A creature must be able to hear you to gain this benefit. The performance ends early if you are incapacitated or silenced or if you voluntarily end it (no action required)." },
        { name: "Ability Score Improvement", level: 8, description: "When you reach 8th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1. As normal, you can't increase an ability score above 20 using this feature. If your DM allows the use of feats, you may instead take a feat." },
        { name: "Song of Rest (d8)", level: 9, description: "At 9th level, the extra hit points gained from Song of Rest increases to 1d8." },
        { name: "Bardic Inspiration (d10)", level: 10, description: "At 10th level, your Bardic Inspiration die changes to a d10." },
        { name: "Expertise", level: 10, description: "At 10th level, you can choose another two skill proficiencies. Your proficiency bonus is doubled for any ability check you make that uses either of the chosen proficiencies." },
        { name: "Magical Secrets", level: 10, description: "By 10th level, you have plundered magical knowledge from a wide spectrum of disciplines. Choose two spells from any classes, including this one. A spell you choose must be of a level you can cast, as shown on the Bard table, or a cantrip. The chosen spells count as bard spells for you and are included in the number in the Spells Known column of the Bard table. You learn two additional spells from any classes at 14th level and again at 18th level." },
        { name: "Ability Score Improvement", level: 12, description: "When you reach 12th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1. As normal, you can't increase an ability score above 20 using this feature. If your DM allows the use of feats, you may instead take a feat." },
        { name: "Song of Rest (d10)", level: 13, description: "At 13th level, the extra hit points gained from Song of Rest increases to 1d10." },
        { name: "Magical Secrets", level: 14, description: "At 14th level, choose two additional spells from any classes, including this one. A spell you choose must be of a level you can cast, as shown on the Bard table, or a cantrip. The chosen spells count as bard spells for you and are included in the number in the Spells Known column of the Bard table." },
        { name: "Bardic Inspiration (d12)", level: 15, description: "At 15th level, your Bardic Inspiration die changes to a d12." },
        { name: "Ability Score Improvement", level: 16, description: "When you reach 16th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1. As normal, you can't increase an ability score above 20 using this feature. If your DM allows the use of feats, you may instead take a feat." },
        { name: "Song of Rest (d12)", level: 17, description: "At 17th level, the extra hit points gained from Song of Rest increases to 1d12." },
        { name: "Magical Secrets", level: 18, description: "At 18th level, choose two additional spells from any class, including this one. A spell you choose must be of a level you can cast, as shown on the Bard table, or a cantrip. The chosen spells count as bard spells for you and are included in the number in the Spells Known column of the Bard table." },
        { name: "Ability Score Improvement", level: 19, description: "When you reach 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1. As normal, you can't increase an ability score above 20 using this feature. If your DM allows the use of feats, you may instead take a feat." },
        { name: "Superior Inspiration", level: 20, description: "At 20th level, when you roll initiative and have no uses of Bardic Inspiration left, you regain one use." },
    ],
};
