import { CharacterClass } from "@/interfaces/CharacterClass";
import { fullCasterProgression } from "@/interfaces/SpellSlotsProgression";

// 2024 unified all casters onto a single 'prepared spells' model, but these three
// classes can only reselect their prepared spells on level-up (not after every long
// rest, unlike Cleric/Druid/Paladin/Ranger/Wizard) - not modeled by ClassSpellcasting
// yet, flagged here in case that distinction matters later.
export const Bard: CharacterClass = {
    name: "Bard",
    edition: "2024",
    hitDie: 8,
    proficiencies: {
        armor: ["Light armor"],
        weapons: ["Simple weapons"],
        tools: ["Choose three Musical Instruments"],
        savingThrows: ["dexterity", "charisma"],
        // Fixed: see the identical fix + comment in 2014/classes/Bard.ts -
        // this was `{ choose: 1, from: [] }`, an unsatisfiable empty pool.
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
        tools: ["Choose one Musical Instrument"],
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
        preparation: "prepared",
        ritualCasting: true,
        progression: fullCasterProgression,
    },
    subclassLevel: 3,
    // features text pulled and verified against 5etools' class-bard.json (XPHB source) - https://5e.tools/classes.html#bard_xphb
    // Corrected from an earlier from-memory pass: Spellcasting was a paraphrased summary
    // instead of the actual rules text (cantrip/prepared-spell progression, spell slots,
    // spellcasting ability, and spellcasting focus were all missing); Bardic Inspiration was
    // missing its full uses/duration text; Countercharm was completely wrong - it's a level 7
    // Reaction that forces a reroll with advantage on a failed save against Charmed/Frightened
    // within 30 feet, not a level 6 30-foot passive-advantage aura; three fabricated
    // "Bardic Inspiration (d8/d10/d12)" entries at levels 5/10/15 were removed, since XPHB
    // doesn't track the die-size increase as its own feature (it's described within the
    // level 1 Bardic Inspiration entry instead); the missing level 18 Superior Inspiration and
    // level 20 Words of Creation capstone were added; and level 19 grants an Epic Boon feat,
    // not a fifth Ability Score Improvement (the "Bard Subclass" placeholder at level 3 and the
    // "Subclass Feature" placeholders at levels 6 and 14 remain correctly omitted, since
    // subclass features live in Subclass.features).
    features: [
        { name: "Bardic Inspiration (d6)", level: 1, description: "You can supernaturally inspire others through words, music, or dance. This inspiration is represented by your Bardic Inspiration die, which is a d6.\nUsing Bardic Inspiration: As a Bonus Action, you can inspire another creature within 60 feet of yourself who can see or hear you. That creature gains one of your Bardic Inspiration dice. A creature can have only one Bardic Inspiration die at a time. Once within the next hour when the creature fails a D20 Test, the creature can roll the Bardic Inspiration die and add the number rolled to the d20, potentially turning the failure into a success. A Bardic Inspiration die is expended when it's rolled.\nNumber of Uses: You can confer a Bardic Inspiration die a number of times equal to your Charisma modifier (minimum of once), and you regain all expended uses when you finish a Long Rest.\nAt Higher Levels: Your Bardic Inspiration die changes when you reach certain Bard levels, as shown in the Bardic Die column of the Bard Features table. The die becomes a d8 at level 5, a d10 at level 10, and a d12 at level 15." },
        { name: "Spellcasting", level: 1, description: "You have learned to cast spells through your bardic arts. See the rules on spellcasting for how you use those rules with Bard spells, which appear in the Bard spell list in this class's description.\nCantrips: You know two cantrips of your choice from the Bard spell list. Dancing Lights and Vicious Mockery are recommended. Whenever you gain a Bard level, you can replace one of your cantrips with another cantrip of your choice from the Bard spell list. When you reach Bard levels 4 and 10, you learn another cantrip of your choice from the Bard spell list, as shown in the Cantrips column of the Bard Features table.\nSpell Slots: The Bard Features table shows how many spell slots you have to cast your level 1+ spells. You regain all expended slots when you finish a Long Rest.\nPrepared Spells of Level 1+: You prepare the list of level 1+ spells that are available for you to cast with this feature. To start, choose four level 1 spells from the Bard spell list. Charm Person, Color Spray, Dissonant Whispers, and Healing Word are recommended. The number of spells on your list increases as you gain Bard levels, as shown in the Prepared Spells column of the Bard Features table. Whenever that number increases, choose additional spells from the Bard spell list until the number of spells on your list matches the number on the table. The chosen spells must be of a level for which you have spell slots. For example, if you're a level 3 Bard, your list of prepared spells can include six spells of levels 1 and 2 in any combination. If another Bard feature gives you spells that you always have prepared, those spells don't count against the number of spells you can prepare with this feature, but those spells otherwise count as Bard spells for you.\nChanging Your Prepared Spells: Whenever you gain a Bard level, you can replace one spell on your list with another Bard spell for which you have spell slots.\nSpellcasting Ability: Charisma is your spellcasting ability for your Bard spells.\nSpellcasting Focus: You can use a Musical Instrument as a Spellcasting Focus for your Bard spells." },
        { name: "Expertise", level: 2, description: "You gain Expertise in two of your skill proficiencies of your choice. Performance and Persuasion are recommended if you have proficiency in them. At Bard level 9, you gain Expertise in two more of your skill proficiencies of your choice." },
        { name: "Jack of All Trades", level: 2, description: "You can add half your Proficiency Bonus (round down) to any ability check you make that uses a skill proficiency you lack and that doesn't otherwise use your Proficiency Bonus. For example, if you make a Strength (Athletics) check and lack Athletics proficiency, you can add half your Proficiency Bonus to the check." },
        { name: "Ability Score Improvement", level: 4, description: "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify. You gain this feature again at Bard levels 8, 12, and 16." },
        { name: "Font of Inspiration", level: 5, description: "You now regain all your expended uses of Bardic Inspiration when you finish a Short Rest or Long Rest. In addition, you can expend a spell slot (no action required) to regain one expended use of Bardic Inspiration." },
        { name: "Countercharm", level: 7, description: "You can use musical notes or words of power to disrupt mind-influencing effects. If you or a creature within 30 feet of you fails a saving throw against an effect that applies the Charmed or Frightened condition, you can take a Reaction to cause the save to be rerolled, and the new roll has Advantage." },
        { name: "Ability Score Improvement", level: 8, description: "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify." },
        { name: "Expertise", level: 9, description: "You gain Expertise in two of your Skill Proficiencies of your choice." },
        { name: "Magical Secrets", level: 10, description: "You've learned secrets from various magical traditions. Whenever you reach a Bard level (including this level) and the Prepared Spells number in the Bard Features table increases, you can choose any of your new prepared spells from the Bard, Cleric, Druid, and Wizard spell lists, and the chosen spells count as Bard spells for you. In addition, whenever you replace a spell prepared for this class, you can replace it with a spell from those lists." },
        { name: "Ability Score Improvement", level: 12, description: "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify." },
        { name: "Ability Score Improvement", level: 16, description: "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify." },
        { name: "Superior Inspiration", level: 18, description: "When you roll Initiative, you regain expended uses of Bardic Inspiration until you have two if you have fewer than that." },
        { name: "Epic Boon", level: 19, description: "You gain an Epic Boon feat or another feat of your choice for which you qualify. Boon of Spell Recall is recommended." },
        { name: "Words of Creation", level: 20, description: "You have mastered two of the Words of Creation: the words of life and death. You therefore always have the Power Word Heal and Power Word Kill spells prepared. When you cast either spell, you can target a second creature with it if that creature is within 10 feet of the first target." },
    ],
};
