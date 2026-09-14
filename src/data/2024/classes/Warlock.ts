import { CharacterClass } from "@/interfaces/CharacterClass";
import { pactMagicProgression } from "@/interfaces/SpellSlotsProgression";

// 2024 unified all casters onto a single 'prepared spells' model, but these three
// classes can only reselect their prepared spells on level-up (not after every long
// rest, unlike Cleric/Druid/Paladin/Ranger/Wizard) - not modeled by ClassSpellcasting
// yet, flagged here in case that distinction matters later.
// subclassLevel moved from 1 (2014) to 3 in the 2024 revision, sourced directly from
// 5etools' class data (classFeature 'Warlock Subclass|Warlock|XPHB|3').
export const Warlock: CharacterClass = {
    name: "Warlock",
    edition: "2024",
    hitDie: 8,
    proficiencies: {
        armor: ["Light armor"],
        weapons: ["Simple weapons"],
        savingThrows: ["wisdom", "charisma"],
        skills: { choose: 2, from: ["Arcana", "Deception", "History", "Intimidation", "Investigation", "Nature", "Religion"] },
    },
    multiclassProficiencies: {
        armor: ["Light armor"],
    },
    primaryAbility: "charisma",
    casterProgression: "pact",
    spellcasting: {
        ability: "charisma",
        preparation: "prepared",
        pactMagic: pactMagicProgression,
    },
    subclassLevel: 3,
    // features text re-scraped and verified against Roll20's D&D 2024 Compendium ("Warlock
    // Features" table) - https://roll20.net/compendium/dnd5e/Classes:Warlock (2024 source)
    // Corrected from an earlier pass: Pact Magic had been reduced to a stub pointing at "the
    // Spells section of this sheet" instead of the actual rules text (cantrips gained at 1st/4th/
    // 10th, the all-slots-share-one-level mechanic with a worked example, prepared spells with the
    // "always prepared" clause, changing prepared spells on level-up, spellcasting ability and
    // focus). Magical Cunning, Ability Score Improvement, Contact Patron, Mystic Arcanum, Epic
    // Boon, and Eldritch Master were already accurate and are unchanged. Eldritch Invocations
    // previously had no `choice` at all - not even the three Pact Boons the 2024 revision folded
    // directly into the invocation list (Pact of the Blade/Chain/Tome are no longer a separate
    // "Pact Boon" feature the way 2014 has one - see this class having no such feature above).
    // Its `choice.options` below is now the full 28-invocation core PHB (2024) list (id/label/
    // prerequisite verified against the 5etools class-data JSON; each `summary` is this app's own
    // short paraphrase, not source text), and `countByLevel` is the real "Invocations Known" table
    // (1 at 1st level, jumping straight to 3 at 2nd, then 5/6/7/8/9/10 at 5/7/9/12/15/18).
    // Prerequisites (a minimum level, or requiring a damaging/attack-roll cantrip, Pact of the
    // Blade, or another invocation) are noted parenthetically in each option's `summary` but -
    // like every other feature-choice prerequisite in this app - aren't mechanically enforced.
    features: [
        { name: "Eldritch Invocations", level: 1, description: "You have unearthed Eldritch Invocations, fragments of forbidden knowledge that imbue you with an abiding magical ability or other lesson. You gain one invocation of your choice, such as Pact of the Blade, Pact of the Chain, or Pact of the Tome. If an invocation has a prerequisite, you must meet it to learn it, and you can't replace an invocation if it's a prerequisite for another invocation you have. You gain additional invocations as you gain levels in this class, and whenever you gain a level you can replace one you know with another for which you qualify.", choice: { key: "invocations", prompt: "Choose your Eldritch Invocations", countByLevel: { 1: 1, 2: 3, 5: 5, 7: 6, 9: 7, 12: 8, 15: 9, 18: 10 }, options: [
            { id: "agonizing-blast", label: "Agonizing Blast", summary: "Add your Charisma modifier to the damage of one chosen damaging Warlock cantrip; repeatable for a different cantrip. (2nd level)" },
            { id: "armor-of-shadows", label: "Armor of Shadows", summary: "Cast Mage Armor on yourself without expending a spell slot.", grantedSpells: [{ spellName: "Mage Armor", limit: "at will (self only)" }] },
            { id: "ascendant-step", label: "Ascendant Step", summary: "Cast Levitate on yourself without expending a spell slot. (5th level)", grantedSpells: [{ spellName: "Levitate", limit: "at will (self only)" }] },
            { id: "devils-sight", label: "Devil's Sight", summary: "See normally in dim light and darkness, magical or not, within 120 feet. (2nd level)" },
            { id: "devouring-blade", label: "Devouring Blade", summary: "Thirsting Blade's extra attack becomes two extra attacks instead of one. (12th level, requires Thirsting Blade)" },
            { id: "eldritch-mind", label: "Eldritch Mind", summary: "Gain advantage on Constitution saving throws made to maintain concentration." },
            { id: "eldritch-smite", label: "Eldritch Smite", summary: "Once per turn on a pact-weapon hit, spend a slot for +1d8 Force damage per slot level, possibly knocking a Huge-or-smaller target prone. (5th level, Pact of the Blade)" },
            { id: "eldritch-spear", label: "Eldritch Spear", summary: "A chosen damaging Warlock cantrip's range increases by 30 feet per Warlock level; repeatable. (2nd level, requires a damaging cantrip)" },
            { id: "fiendish-vigor", label: "Fiendish Vigor", summary: "Cast False Life on yourself without a spell slot, always taking the maximum temporary hit points. (2nd level)", grantedSpells: [{ spellName: "False Life", limit: "at will (self only); always the maximum roll" }] },
            { id: "gaze-of-two-minds", label: "Gaze of Two Minds", summary: "Bonus action: touch a creature to perceive through its senses and cast spells from its space within 60 feet; renewable each turn. (5th level)" },
            { id: "gift-of-the-depths", label: "Gift of the Depths", summary: "Gain a swim speed equal to your speed and water breathing; also cast Water Breathing once per long rest without a slot. (5th level)", grantedSpells: [{ spellName: "Water Breathing", limit: "once per long rest, without a spell slot" }] },
            { id: "gift-of-the-protectors", label: "Gift of the Protectors", summary: "Name creatures in your Book of Shadows (up to your Charisma modifier); once per long rest, a named creature dropped to 0 HP drops to 1 HP instead. (9th level, Pact of the Tome)" },
            { id: "investment-of-the-chain-master", label: "Investment of the Chain Master", summary: "Your familiar gains bonus benefits: fly or swim speed, a bonus-action attack, necrotic/radiant damage, your spell save DC, and reaction resistance. (5th level, Pact of the Chain)" },
            { id: "lessons-of-the-first-ones", label: "Lessons of the First Ones", summary: "Gain one Origin feat of your choice; repeatable for a different Origin feat. (2nd level)" },
            { id: "lifedrinker", label: "Lifedrinker", summary: "Once per turn on a pact-weapon hit: extra 1d6 necrotic/psychic/radiant damage; may spend a Hit Point Die to heal. (9th level, Pact of the Blade)" },
            { id: "mask-of-many-faces", label: "Mask of Many Faces", summary: "Cast Disguise Self without expending a spell slot. (2nd level)", grantedSpells: [{ spellName: "Disguise Self", limit: "at will" }] },
            { id: "master-of-myriad-forms", label: "Master of Myriad Forms", summary: "Cast Alter Self without expending a spell slot. (5th level)", grantedSpells: [{ spellName: "Alter Self", limit: "at will" }] },
            { id: "misty-visions", label: "Misty Visions", summary: "Cast Silent Image without expending a spell slot. (2nd level)", grantedSpells: [{ spellName: "Silent Image", limit: "at will" }] },
            { id: "one-with-shadows", label: "One with Shadows", summary: "While in dim light or darkness, cast Invisibility on yourself without expending a spell slot. (5th level)", grantedSpells: [{ spellName: "Invisibility", limit: "at will (self only); only while in dim light or darkness" }] },
            { id: "otherworldly-leap", label: "Otherworldly Leap", summary: "Cast Jump on yourself without expending a spell slot. (2nd level)", grantedSpells: [{ spellName: "Jump", limit: "at will (self only)" }] },
            { id: "pact-of-the-blade", label: "Pact of the Blade", summary: "Bonus action: conjure or bond a weapon as a focus; use Charisma for its attacks and optionally deal necrotic, psychic, or radiant damage." },
            { id: "pact-of-the-chain", label: "Pact of the Chain", summary: "Learn and cast Find Familiar without a spell slot, with extra familiar forms; can forgo an attack to let it attack by reaction.", grantedSpells: [{ spellName: "Find Familiar", limit: "learned; castable at will without a spell slot" }] },
            { id: "pact-of-the-tome", label: "Pact of the Tome", summary: "Conjure a Book of Shadows: keeps 3 cantrips and 2 ritual 1st-level spells (from any class's list) always prepared; usable as a spellcasting focus.", grantedSpells: [{ choice: { count: 3, spellLevel: 0 }, limit: "always prepared while book is held" }, { choice: { count: 2, spellLevel: 1 }, limit: "always prepared, ritual-tagged spells from any class's list" }] },
            { id: "repelling-blast", label: "Repelling Blast", summary: "On a hit with a chosen attack-roll cantrip, push a Large-or-smaller target 10 feet away; repeatable. (2nd level, requires an attack-roll cantrip)" },
            { id: "thirsting-blade", label: "Thirsting Blade", summary: "Attack twice with your pact weapon, instead of once, when you take the Attack action. (5th level, Pact of the Blade)" },
            { id: "visions-of-distant-realms", label: "Visions of Distant Realms", summary: "Cast Arcane Eye without expending a spell slot. (9th level)", grantedSpells: [{ spellName: "Arcane Eye", limit: "at will" }] },
            { id: "whispers-of-the-grave", label: "Whispers of the Grave", summary: "Cast Speak with Dead without expending a spell slot. (7th level)", grantedSpells: [{ spellName: "Speak with Dead", limit: "at will" }] },
            { id: "witch-sight", label: "Witch Sight", summary: "Gain Truesight out to 30 feet. (15th level)" },
        ] } },
        { name: "Pact Magic", level: 1, description: "Through occult ceremony, you have formed a pact with a mysterious entity to gain magical powers. See the Spells section of this sheet for the spells you have prepared, your spell save DC, and your spell attack bonus.\nCantrips: You know two Warlock cantrips of your choice. Whenever you gain a Warlock level, you can replace one of your cantrips from this feature with another Warlock cantrip of your choice. When you reach Warlock levels 4 and 10, you learn another Warlock cantrip of your choice.\nSpell Slots: The Warlock table shows how many spell slots you have to cast your Warlock spells of levels 1-5. The table also shows the level of those slots, all of which are the same level. You regain all expended Pact Magic spell slots when you finish a Short or Long Rest. For example, when you're a level 5 Warlock, you have two level 3 spell slots. To cast the level 1 spell Witch Bolt, you must spend one of those slots, and you cast it as a level 3 spell.\nPrepared Spells of Level 1+: You prepare the list of level 1+ spells that are available for you to cast with this feature. To start, choose two level 1 Warlock spells. The number of spells on your list increases as you gain Warlock levels. Whenever that number increases, choose additional Warlock spells until the number of spells on your list matches your new total. The chosen spells must be of a level no higher than your slot level. If another Warlock feature gives you spells that you always have prepared, those spells don't count against the number of spells you can prepare with this feature, but those spells otherwise count as Warlock spells for you.\nChanging Your Prepared Spells: Whenever you gain a Warlock level, you can replace one spell on your list with another Warlock spell of an eligible level.\nSpellcasting Ability: Charisma is the spellcasting ability for your Warlock spells.\nSpellcasting Focus: You can use an Arcane Focus as a Spellcasting Focus for your Warlock spells." },
        { name: "Magical Cunning", level: 2, description: "You can perform an esoteric rite for 1 minute. At the end of it, you regain expended Pact Magic spell slots, but no more than a number equal to half your maximum (rounded up). Once you use this feature, you can't do so again until you finish a Long Rest." },
        { name: "Ability Score Improvement", level: 4, description: "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify. You gain this feature again at Warlock levels 8, 12, and 16." },
        { name: "Ability Score Improvement", level: 8, description: "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify." },
        { name: "Contact Patron", level: 9, description: "In the past, you usually contacted your patron through intermediaries. Now you can communicate directly: you always have the Contact Other Plane spell prepared, and you can cast it without expending a spell slot to contact your patron, automatically succeeding on the spell's saving throw. Once you cast the spell this way, you can't do so again until you finish a Long Rest.", grantedSpells: [{ spellName: "Contact Other Plane", limit: "once per long rest (auto-succeeds its save)" }] },
        { name: "Mystic Arcanum", level: 11, description: "Your patron grants you a magical secret called an arcanum. Choose one 6th-level Warlock spell as this arcanum. You can cast it once without expending a spell slot, and you must finish a Long Rest before you can cast it this way again. At higher levels you gain another Warlock spell that can be cast this way: a 7th-level spell at 13th level, an 8th-level spell at 15th level, and a 9th-level spell at 17th level. You regain all uses of your Mystic Arcanum when you finish a Long Rest. Whenever you gain a Warlock level, you can replace one of your arcanum spells with another Warlock spell of the same level.", grantedSpells: [{ choice: { count: 1, spellLevel: 6 }, limit: "once per long rest" }] },
        { name: "Ability Score Improvement", level: 12, description: "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify." },
        { name: "Mystic Arcanum", level: 13, description: "You gain a 7th-level Warlock spell of your choice for your Mystic Arcanum.", grantedSpells: [{ choice: { count: 1, spellLevel: 7 }, limit: "once per long rest" }] },
        { name: "Mystic Arcanum", level: 15, description: "You gain an 8th-level Warlock spell of your choice for your Mystic Arcanum.", grantedSpells: [{ choice: { count: 1, spellLevel: 8 }, limit: "once per long rest" }] },
        { name: "Ability Score Improvement", level: 16, description: "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify." },
        { name: "Mystic Arcanum", level: 17, description: "You gain a 9th-level Warlock spell of your choice for your Mystic Arcanum.", grantedSpells: [{ choice: { count: 1, spellLevel: 9 }, limit: "once per long rest" }] },
        { name: "Epic Boon", level: 19, description: "You gain an Epic Boon feat or another feat of your choice for which you qualify. Boon of Fate is recommended." },
        { name: "Eldritch Master", level: 20, description: "When you use your Magical Cunning feature, you regain all your expended Pact Magic spell slots." },
    ],
};
