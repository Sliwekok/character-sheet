import { Race } from "@/interfaces/Race";

/**
 * Generated from 5etools' races.json (every printed species/subrace across
 * every sourcebook, not just core). A few conventions worth knowing:
 *
 * - Subraces are flattened into standalone Race entries merged with their
 *   parent (ability modifiers summed, traits concatenated, darkvision/speed/
 *   languages taken from the subrace when it overrides the parent). Merged
 *   names follow "Parent (Subrace)", e.g. "Elf (Drow)", "Dwarf (Hill)" -
 *   except when the subrace's own name already includes the parent's (e.g.
 *   Dragonborn's per-color variants), where the subrace name is used as-is.
 * - When the same name would otherwise collide within one edition (a race
 *   reprinted with revised stats across multiple sourcebooks - Orc alone
 *   has 6), each is disambiguated with its source book in brackets, e.g.
 *   "Orc [MPMM]", "Elf [PHB]" vs "Elf [LFL]".
 * - abilityModifiers only holds FIXED bonuses; the interface has no way to
 *   represent 5etools' "choose N abilities, +1 each" mechanic (used by
 *   MPMM's flexible-ASI redesigns, Tasha's Custom Lineage, and most non-PHB
 *   settings), so those stay text-only in the "Ability Score Increase"
 *   trait. Don't read an empty {} here as "no bonus" without checking the
 *   traits array - for MPMM/flexible-design races it's expected, but a
 *   small number of DMG Appendix D monster-race entries also came through
 *   with no `ability` field in 5etools' own data and may be worth a manual
 *   check against the book if you rely on them.
 * - grantedFeatChoice/grantedSkillChoice (2024-only) are detected with a
 *   text-pattern heuristic over the trait prose, not hand-verified per
 *   entry - Human's are known-correct; spot-check any others you rely on.
 * - `traits` entries are "Name: full trait text" (not just names), since
 *   this is the only place darkvision range, resistances, size, age, and
 *   granted proficiencies/spells end up - none of those have a dedicated
 *   field on the Race interface.
 */
export const RACES_2024: Race[] = [
    {
        name: "Aasimar",
        edition: "2024",
        traits: [
            "Celestial Resistance: You have Resistance to Necrotic damage and Radiant damage.",
            "Darkvision: You have Darkvision with a range of 60 feet.",
            "Healing Hands: As a Magic action, you touch a creature and roll a number of d4s equal to your Proficiency. The creature regains a number of Hit Points equal to the total rolled. Once you use this trait, you can't use it again until you finish a Long Rest.",
            "Light Bearer: You know the Light cantrip. Charisma is your spellcasting ability for it.",
            "Celestial Revelation: When you reach character level 3, you can transform as a Bonus Action using one of the options below (choose the option each time you transform). The transformation lasts for 1 minute or until you end it (no action required). Once you transform, you can't do so again until you finish a Long Rest.\nOnce on each of your turns before the transformation ends, you can deal extra damage to one target when you deal damage to it with an attack or a spell. The extra damage equals your Proficiency, and the extra damage's type is either Necrotic for Necrotic Shroud or Radiant for Heavenly Wings and Inner Radiance.\nHere are the transformation options:\n- Heavenly Wings: Two spectral wings sprout from your back temporarily. Until the transformation ends, you have a Fly Speed equal to your Speed.\n- Inner Radiance: Searing light temporarily radiates from your eyes and mouth. For the duration, you shed Bright Light in a 10-foot radius and Dim Light for an additional 10 feet, and at the end of each of your turns, each creature within 10 feet of you takes Radiant damage equal to your Proficiency.\n- Necrotic Shroud: Your eyes briefly become pools of darkness, and flightless wings sprout from your back temporarily. Creatures other than your allies within 10 feet of you must succeed on a Charisma saving throw (DC 8 plus your Charisma modifier and Proficiency) or have the Frightened condition until the end of your next turn.",
        ],
        abilityModifiers: {},
        speed: 30,
        languages: ["Common"],
    },
    {
        name: "Changeling",
        edition: "2024",
        traits: [
            "Changeling Instincts: Thanks to your connection to the fey realm, you gain proficiency in two of the following skills of your choice: Deception, Insight, Intimidation, Performance, or Persuasion.",
            "Shape-Shifter: As an action, you can shape-shift to change your appearance and your voice. You determine the specifics of the changes, including your coloration, hair length, and sex. You can also adjust your height and weight and can change your size between Medium and Small. You can make yourself appear as a member of another playable species, though none of your game statistics change. You can't duplicate the appearance of an individual you've never seen, and you must adopt a form that has the same basic arrangement of limbs that you have. This trait doesn't change your clothing and equipment.\nWhile shape-shifted with this trait, you have Advantage on Charisma checks.\nYou stay in the new form until you take an action to revert to your true form.",
        ],
        abilityModifiers: {},
        speed: 30,
        languages: ["Common"],
    },
    {
        name: "Dragonborn",
        edition: "2024",
        traits: [
            "Draconic Ancestry: Your lineage stems from a dragon progenitor. Choose the kind of dragon from the Draconic Ancestors table. Your choice affects your Breath Weapon and Damage Resistance traits as well as your appearance.",
            "Breath Weapon: When you take the Attack action on your turn, you can replace one of your attacks with an exhalation of magical energy in either a 15-foot Cone [Area of Effect] or a 30-foot Line [Area of Effect] that is 5 feet wide (choose the shape each time). Each creature in that area must make a Dexterity saving throw (DC 8 plus your Constitution modifier and Proficiency). On a failed save, a creature takes 1d10 damage of the type determined by your Draconic Ancestry trait. On a successful save, a creature takes half as much damage. This damage increases by 1d10 when you reach character levels 5 (2d10), 11 (3d10), and 17 (4d10).\nYou can use this Breath Weapon a number of times equal to your Proficiency, and you regain all expended uses when you finish a Long Rest.",
            "Damage Resistance: You have Resistance to the damage type determined by your Draconic Ancestry trait.",
            "Darkvision: You have Darkvision with a range of 60 feet.",
            "Draconic Flight: When you reach character level 5, you can channel draconic magic to give yourself temporary flight. As a Bonus Action, you sprout spectral wings on your back that last for 10 minutes or until you retract the wings (no action required) or have the Incapacitated condition. During that time, you have a Fly Speed equal to your Speed. Your wings appear to be made of the same energy as your Breath Weapon. Once you use this trait, you can't use it again until you finish a Long Rest.",
        ],
        abilityModifiers: {},
        speed: 30,
        languages: ["Common"],
    },
    {
        name: "Dragonborn (Black)",
        edition: "2024",
        traits: [
            "Breath Weapon: When you take the Attack action on your turn, you can replace one of your attacks with an exhalation of magical energy in either a 15-foot Cone [Area of Effect] or a 30-foot Line [Area of Effect] that is 5 feet wide (choose the shape each time). Each creature in that area must make a Dexterity saving throw (DC 8 plus your Constitution modifier and Proficiency). On a failed save, a creature takes 1d10 Acid damage. On a successful save, a creature takes half as much damage. This damage increases by 1d10 when you reach character levels 5 (2d10), 11 (3d10), and 17 (4d10).\nYou can use this Breath Weapon a number of times equal to your Proficiency, and you regain all expended uses when you finish a Long Rest.",
            "Damage Resistance: You have Resistance to Acid damage.",
            "Darkvision: You have Darkvision with a range of 60 feet.",
            "Draconic Flight: When you reach character level 5, you can channel draconic magic to give yourself temporary flight. As a Bonus Action, you sprout spectral wings on your back that last for 10 minutes or until you retract the wings (no action required) or have the Incapacitated condition. During that time, you have a Fly Speed equal to your Speed. Your wings appear to be made of the same energy as your Breath Weapon. Once you use this trait, you can't use it again until you finish a Long Rest.",
        ],
        abilityModifiers: {},
        speed: 30,
        languages: ["Common"],
    },
    {
        name: "Dragonborn (Blue)",
        edition: "2024",
        traits: [
            "Breath Weapon: When you take the Attack action on your turn, you can replace one of your attacks with an exhalation of magical energy in either a 15-foot Cone [Area of Effect] or a 30-foot Line [Area of Effect] that is 5 feet wide (choose the shape each time). Each creature in that area must make a Dexterity saving throw (DC 8 plus your Constitution modifier and Proficiency). On a failed save, a creature takes 1d10 Lightning damage. On a successful save, a creature takes half as much damage. This damage increases by 1d10 when you reach character levels 5 (2d10), 11 (3d10), and 17 (4d10).\nYou can use this Breath Weapon a number of times equal to your Proficiency, and you regain all expended uses when you finish a Long Rest.",
            "Damage Resistance: You have Resistance to Lightning damage.",
            "Darkvision: You have Darkvision with a range of 60 feet.",
            "Draconic Flight: When you reach character level 5, you can channel draconic magic to give yourself temporary flight. As a Bonus Action, you sprout spectral wings on your back that last for 10 minutes or until you retract the wings (no action required) or have the Incapacitated condition. During that time, you have a Fly Speed equal to your Speed. Your wings appear to be made of the same energy as your Breath Weapon. Once you use this trait, you can't use it again until you finish a Long Rest.",
        ],
        abilityModifiers: {},
        speed: 30,
        languages: ["Common"],
    },
    {
        name: "Dragonborn (Brass)",
        edition: "2024",
        traits: [
            "Breath Weapon: When you take the Attack action on your turn, you can replace one of your attacks with an exhalation of magical energy in either a 15-foot Cone [Area of Effect] or a 30-foot Line [Area of Effect] that is 5 feet wide (choose the shape each time). Each creature in that area must make a Dexterity saving throw (DC 8 plus your Constitution modifier and Proficiency). On a failed save, a creature takes 1d10 Fire damage. On a successful save, a creature takes half as much damage. This damage increases by 1d10 when you reach character levels 5 (2d10), 11 (3d10), and 17 (4d10).\nYou can use this Breath Weapon a number of times equal to your Proficiency, and you regain all expended uses when you finish a Long Rest.",
            "Damage Resistance: You have Resistance to Fire damage.",
            "Darkvision: You have Darkvision with a range of 60 feet.",
            "Draconic Flight: When you reach character level 5, you can channel draconic magic to give yourself temporary flight. As a Bonus Action, you sprout spectral wings on your back that last for 10 minutes or until you retract the wings (no action required) or have the Incapacitated condition. During that time, you have a Fly Speed equal to your Speed. Your wings appear to be made of the same energy as your Breath Weapon. Once you use this trait, you can't use it again until you finish a Long Rest.",
        ],
        abilityModifiers: {},
        speed: 30,
        languages: ["Common"],
    },
    {
        name: "Dragonborn (Bronze)",
        edition: "2024",
        traits: [
            "Breath Weapon: When you take the Attack action on your turn, you can replace one of your attacks with an exhalation of magical energy in either a 15-foot Cone [Area of Effect] or a 30-foot Line [Area of Effect] that is 5 feet wide (choose the shape each time). Each creature in that area must make a Dexterity saving throw (DC 8 plus your Constitution modifier and Proficiency). On a failed save, a creature takes 1d10 Lightning damage. On a successful save, a creature takes half as much damage. This damage increases by 1d10 when you reach character levels 5 (2d10), 11 (3d10), and 17 (4d10).\nYou can use this Breath Weapon a number of times equal to your Proficiency, and you regain all expended uses when you finish a Long Rest.",
            "Damage Resistance: You have Resistance to Lightning damage.",
            "Darkvision: You have Darkvision with a range of 60 feet.",
            "Draconic Flight: When you reach character level 5, you can channel draconic magic to give yourself temporary flight. As a Bonus Action, you sprout spectral wings on your back that last for 10 minutes or until you retract the wings (no action required) or have the Incapacitated condition. During that time, you have a Fly Speed equal to your Speed. Your wings appear to be made of the same energy as your Breath Weapon. Once you use this trait, you can't use it again until you finish a Long Rest.",
        ],
        abilityModifiers: {},
        speed: 30,
        languages: ["Common"],
    },
    {
        name: "Dragonborn (Copper)",
        edition: "2024",
        traits: [
            "Breath Weapon: When you take the Attack action on your turn, you can replace one of your attacks with an exhalation of magical energy in either a 15-foot Cone [Area of Effect] or a 30-foot Line [Area of Effect] that is 5 feet wide (choose the shape each time). Each creature in that area must make a Dexterity saving throw (DC 8 plus your Constitution modifier and Proficiency). On a failed save, a creature takes 1d10 Acid damage. On a successful save, a creature takes half as much damage. This damage increases by 1d10 when you reach character levels 5 (2d10), 11 (3d10), and 17 (4d10).\nYou can use this Breath Weapon a number of times equal to your Proficiency, and you regain all expended uses when you finish a Long Rest.",
            "Damage Resistance: You have Resistance to Acid damage.",
            "Darkvision: You have Darkvision with a range of 60 feet.",
            "Draconic Flight: When you reach character level 5, you can channel draconic magic to give yourself temporary flight. As a Bonus Action, you sprout spectral wings on your back that last for 10 minutes or until you retract the wings (no action required) or have the Incapacitated condition. During that time, you have a Fly Speed equal to your Speed. Your wings appear to be made of the same energy as your Breath Weapon. Once you use this trait, you can't use it again until you finish a Long Rest.",
        ],
        abilityModifiers: {},
        speed: 30,
        languages: ["Common"],
    },
    {
        name: "Dragonborn (Gold)",
        edition: "2024",
        traits: [
            "Breath Weapon: When you take the Attack action on your turn, you can replace one of your attacks with an exhalation of magical energy in either a 15-foot Cone [Area of Effect] or a 30-foot Line [Area of Effect] that is 5 feet wide (choose the shape each time). Each creature in that area must make a Dexterity saving throw (DC 8 plus your Constitution modifier and Proficiency). On a failed save, a creature takes 1d10 Fire damage. On a successful save, a creature takes half as much damage. This damage increases by 1d10 when you reach character levels 5 (2d10), 11 (3d10), and 17 (4d10).\nYou can use this Breath Weapon a number of times equal to your Proficiency, and you regain all expended uses when you finish a Long Rest.",
            "Damage Resistance: You have Resistance to Fire damage.",
            "Darkvision: You have Darkvision with a range of 60 feet.",
            "Draconic Flight: When you reach character level 5, you can channel draconic magic to give yourself temporary flight. As a Bonus Action, you sprout spectral wings on your back that last for 10 minutes or until you retract the wings (no action required) or have the Incapacitated condition. During that time, you have a Fly Speed equal to your Speed. Your wings appear to be made of the same energy as your Breath Weapon. Once you use this trait, you can't use it again until you finish a Long Rest.",
        ],
        abilityModifiers: {},
        speed: 30,
        languages: ["Common"],
    },
    {
        name: "Dragonborn (Green)",
        edition: "2024",
        traits: [
            "Breath Weapon: When you take the Attack action on your turn, you can replace one of your attacks with an exhalation of magical energy in either a 15-foot Cone [Area of Effect] or a 30-foot Line [Area of Effect] that is 5 feet wide (choose the shape each time). Each creature in that area must make a Dexterity saving throw (DC 8 plus your Constitution modifier and Proficiency). On a failed save, a creature takes 1d10 Poison damage. On a successful save, a creature takes half as much damage. This damage increases by 1d10 when you reach character levels 5 (2d10), 11 (3d10), and 17 (4d10).\nYou can use this Breath Weapon a number of times equal to your Proficiency, and you regain all expended uses when you finish a Long Rest.",
            "Damage Resistance: You have Resistance to Poison damage.",
            "Darkvision: You have Darkvision with a range of 60 feet.",
            "Draconic Flight: When you reach character level 5, you can channel draconic magic to give yourself temporary flight. As a Bonus Action, you sprout spectral wings on your back that last for 10 minutes or until you retract the wings (no action required) or have the Incapacitated condition. During that time, you have a Fly Speed equal to your Speed. Your wings appear to be made of the same energy as your Breath Weapon. Once you use this trait, you can't use it again until you finish a Long Rest.",
        ],
        abilityModifiers: {},
        speed: 30,
        languages: ["Common"],
    },
    {
        name: "Dragonborn (Red)",
        edition: "2024",
        traits: [
            "Breath Weapon: When you take the Attack action on your turn, you can replace one of your attacks with an exhalation of magical energy in either a 15-foot Cone [Area of Effect] or a 30-foot Line [Area of Effect] that is 5 feet wide (choose the shape each time). Each creature in that area must make a Dexterity saving throw (DC 8 plus your Constitution modifier and Proficiency). On a failed save, a creature takes 1d10 Fire damage. On a successful save, a creature takes half as much damage. This damage increases by 1d10 when you reach character levels 5 (2d10), 11 (3d10), and 17 (4d10).\nYou can use this Breath Weapon a number of times equal to your Proficiency, and you regain all expended uses when you finish a Long Rest.",
            "Damage Resistance: You have Resistance to Fire damage.",
            "Darkvision: You have Darkvision with a range of 60 feet.",
            "Draconic Flight: When you reach character level 5, you can channel draconic magic to give yourself temporary flight. As a Bonus Action, you sprout spectral wings on your back that last for 10 minutes or until you retract the wings (no action required) or have the Incapacitated condition. During that time, you have a Fly Speed equal to your Speed. Your wings appear to be made of the same energy as your Breath Weapon. Once you use this trait, you can't use it again until you finish a Long Rest.",
        ],
        abilityModifiers: {},
        speed: 30,
        languages: ["Common"],
    },
    {
        name: "Dragonborn (Silver)",
        edition: "2024",
        traits: [
            "Breath Weapon: When you take the Attack action on your turn, you can replace one of your attacks with an exhalation of magical energy in either a 15-foot Cone [Area of Effect] or a 30-foot Line [Area of Effect] that is 5 feet wide (choose the shape each time). Each creature in that area must make a Dexterity saving throw (DC 8 plus your Constitution modifier and Proficiency). On a failed save, a creature takes 1d10 Cold damage. On a successful save, a creature takes half as much damage. This damage increases by 1d10 when you reach character levels 5 (2d10), 11 (3d10), and 17 (4d10).\nYou can use this Breath Weapon a number of times equal to your Proficiency, and you regain all expended uses when you finish a Long Rest.",
            "Damage Resistance: You have Resistance to Cold damage.",
            "Darkvision: You have Darkvision with a range of 60 feet.",
            "Draconic Flight: When you reach character level 5, you can channel draconic magic to give yourself temporary flight. As a Bonus Action, you sprout spectral wings on your back that last for 10 minutes or until you retract the wings (no action required) or have the Incapacitated condition. During that time, you have a Fly Speed equal to your Speed. Your wings appear to be made of the same energy as your Breath Weapon. Once you use this trait, you can't use it again until you finish a Long Rest.",
        ],
        abilityModifiers: {},
        speed: 30,
        languages: ["Common"],
    },
    {
        name: "Dragonborn (White)",
        edition: "2024",
        traits: [
            "Breath Weapon: When you take the Attack action on your turn, you can replace one of your attacks with an exhalation of magical energy in either a 15-foot Cone [Area of Effect] or a 30-foot Line [Area of Effect] that is 5 feet wide (choose the shape each time). Each creature in that area must make a Dexterity saving throw (DC 8 plus your Constitution modifier and Proficiency). On a failed save, a creature takes 1d10 Cold damage. On a successful save, a creature takes half as much damage. This damage increases by 1d10 when you reach character levels 5 (2d10), 11 (3d10), and 17 (4d10).\nYou can use this Breath Weapon a number of times equal to your Proficiency, and you regain all expended uses when you finish a Long Rest.",
            "Damage Resistance: You have Resistance to Cold damage.",
            "Darkvision: You have Darkvision with a range of 60 feet.",
            "Draconic Flight: When you reach character level 5, you can channel draconic magic to give yourself temporary flight. As a Bonus Action, you sprout spectral wings on your back that last for 10 minutes or until you retract the wings (no action required) or have the Incapacitated condition. During that time, you have a Fly Speed equal to your Speed. Your wings appear to be made of the same energy as your Breath Weapon. Once you use this trait, you can't use it again until you finish a Long Rest.",
        ],
        abilityModifiers: {},
        speed: 30,
        languages: ["Common"],
    },
    {
        name: "Dwarf",
        edition: "2024",
        traits: [
            "Darkvision: You have Darkvision with a range of 120 feet.",
            "Dwarven Resilience: You have Resistance to Poison damage. You also have Advantage on saving throws you make to avoid or end the Poisoned condition.",
            "Dwarven Toughness: Your Hit Points maximum increases by 1, and it increases by 1 again whenever you gain a level.",
            "Stonecunning: As a Bonus Action, you gain Tremorsense with a range of 60 feet for 10 minutes. You must be on a stone surface or touching a stone surface to use this Tremorsense. The stone can be natural or worked.\nYou can use this Bonus Action a number of times equal to your Proficiency, and you regain all expended uses when you finish a Long Rest.",
        ],
        abilityModifiers: {},
        speed: 30,
        languages: ["Common"],
    },
    {
        name: "Elf [LFL]",
        edition: "2024",
        traits: [
            "Darkvision: You have Darkvision with a range of 60 feet.",
            "Elven Lineage: You are part of a lineage that grants you supernatural abilities. Choose a lineage from the Elven Lineages table. You gain the level 1 benefit of that lineage.\nWhen you reach character levels 3 and 5, you learn a higher-level spell, as shown on the table. You always have that spell prepared. You can cast it once without a spell slot, and you regain the ability to cast it in that way when you finish a Long Rest. You can also cast the spell using any spell slots you have of the appropriate level.\nIntelligence, Wisdom, or Charisma is your spellcasting ability for the spells you cast with this trait (choose the ability when you select the lineage).",
            "Fey Ancestry: You have Advantage on saving throws you make to avoid or end the Charmed condition.",
            "Keen Senses: You have proficiency in the Insight, Perception, or Survival skill.",
            "Trance: You don't need to sleep, and magic can't put you to sleep. You can finish a Long Rest in 4 hours if you spend those hours in a trancelike meditation, during which you retain consciousness.",
        ],
        abilityModifiers: {},
        speed: 30,
        languages: ["Common"],
    },
    {
        name: "Elf [XPHB]",
        edition: "2024",
        traits: [
            "Darkvision: You have Darkvision with a range of 60 feet.",
            "Elven Lineage: You are part of a lineage that grants you supernatural abilities. Choose a lineage from the Elven Lineages table. You gain the level 1 benefit of that lineage.\nWhen you reach character levels 3 and 5, you learn a higher-level spell, as shown on the table. You always have that spell prepared. You can cast it once without a spell slot, and you regain the ability to cast it in that way when you finish a Long Rest. You can also cast the spell using any spell slots you have of the appropriate level.\nIntelligence, Wisdom, or Charisma is your spellcasting ability for the spells you cast with this trait (choose the ability when you select the lineage).",
            "Fey Ancestry: You have Advantage on saving throws you make to avoid or end the Charmed condition.",
            "Keen Senses: You have proficiency in the Insight, Perception, or Survival skill.",
            "Trance: You don't need to sleep, and magic can't put you to sleep. You can finish a Long Rest in 4 hours if you spend those hours in a trancelike meditation, during which you retain consciousness.",
        ],
        abilityModifiers: {},
        speed: 30,
        languages: ["Common"],
    },
    {
        name: "Elf; Drow Lineage",
        edition: "2024",
        traits: [
            "Darkvision: You have Darkvision with a range of 120 feet.",
            "Elven Lineage (Drow): You are part of a lineage that grants you supernatural abilities. The range of your Darkvision increases to 120 feet. You also know the Dancing Lights cantrip.\nWhen you reach character level 3, you learn the Faerie Fire spell. When you reach character level 5, you also learn the Darkness spell. You always have these spells prepared, and you can cast each spell once without a spell slot. Once you cast either of these spells with this trait, you can't cast that spell with it again until you finish a Long Rest. You can also cast the spell using any spell slots you have of the appropriate level.\nIntelligence, Wisdom, or Charisma is your spellcasting ability for the spells you cast with this trait (choose the ability when you select the lineage).",
            "Fey Ancestry: You have Advantage on saving throws you make to avoid or end the Charmed condition.",
            "Keen Senses: You have proficiency in the Insight, Perception, or Survival skill.",
            "Trance: You don't need to sleep, and magic can't put you to sleep. You can finish a Long Rest in 4 hours if you spend those hours in a trancelike meditation, during which you retain consciousness.",
        ],
        abilityModifiers: {},
        speed: 30,
        languages: ["Common"],
    },
    {
        name: "Elf; High Elf Lineage",
        edition: "2024",
        traits: [
            "Darkvision: You have Darkvision with a range of 60 feet.",
            "Elven Lineage (High Elf): You are part of a lineage that grants you supernatural abilities. You know the Prestidigitation cantrip. Whenever you finish a Long Rest, you can replace that cantrip with a different cantrip from the Wizard spell list.\nWhen you reach character level 3, you learn the Detect Magic spell. When you reach character level 5, you also learn the Misty Step spell. You always have these spells prepared, and you can cast each spell once without a spell slot. Once you cast either of these spells with this trait, you can't cast that spell with it again until you finish a Long Rest. You can also cast the spell using any spell slots you have of the appropriate level.\nIntelligence, Wisdom, or Charisma is your spellcasting ability for the spells you cast with this trait (choose the ability when you select the lineage).",
            "Fey Ancestry: You have Advantage on saving throws you make to avoid or end the Charmed condition.",
            "Keen Senses: You have proficiency in the Insight, Perception, or Survival skill.",
            "Trance: You don't need to sleep, and magic can't put you to sleep. You can finish a Long Rest in 4 hours if you spend those hours in a trancelike meditation, during which you retain consciousness.",
        ],
        abilityModifiers: {},
        speed: 30,
        languages: ["Common"],
    },
    {
        name: "Elf; Lorwyn Lineage",
        edition: "2024",
        traits: [
            "Darkvision: You have Darkvision with a range of 60 feet.",
            "Elven Lineage (Lorwyn): You are part of a lineage that grants you supernatural abilities. You know the Thorn Whip cantrip. Whenever you finish a Long Rest, you can replace that cantrip with a different cantrip from the Druid spell list.\nWhen you reach character level 3, you learn the Command spell. When you reach character level 5, you also learn the Silence spell. You always have these spells prepared, and you can cast each spell once without a spell slot. Once you cast either of these spells with this trait, you can't cast that spell with it again until you finish a Long Rest. You can also cast the spell using any spell slots you have of the appropriate level.\nIntelligence, Wisdom, or Charisma is your spellcasting ability for the spells you cast with this trait (choose the ability when you select the lineage).",
            "Fey Ancestry: You have Advantage on saving throws you make to avoid or end the Charmed condition.",
            "Keen Senses: You have proficiency in the Insight, Perception, or Survival skill.",
            "Trance: You don't need to sleep, and magic can't put you to sleep. You can finish a Long Rest in 4 hours if you spend those hours in a trancelike meditation, during which you retain consciousness.",
        ],
        abilityModifiers: {},
        speed: 30,
        languages: ["Common"],
    },
    {
        name: "Elf; Shadowmoor Lineage",
        edition: "2024",
        traits: [
            "Darkvision: You have Darkvision with a range of 60 feet.",
            "Elven Lineage (Shadowmoor): You are part of a lineage that grants you supernatural abilities. The range of your Darkvision increases to 120 feet. You also know the Starry Wisp cantrip.\nWhen you reach character level 3, you learn the Heroism spell. When you reach character level 5, you also learn the Gentle Repose spell. You always have these spells prepared, and you can cast each spell once without a spell slot. Once you cast either of these spells with this trait, you can't cast that spell with it again until you finish a Long Rest. You can also cast the spell using any spell slots you have of the appropriate level.\nIntelligence, Wisdom, or Charisma is your spellcasting ability for the spells you cast with this trait (choose the ability when you select the lineage).",
            "Fey Ancestry: You have Advantage on saving throws you make to avoid or end the Charmed condition.",
            "Keen Senses: You have proficiency in the Insight, Perception, or Survival skill.",
            "Trance: You don't need to sleep, and magic can't put you to sleep. You can finish a Long Rest in 4 hours if you spend those hours in a trancelike meditation, during which you retain consciousness.",
        ],
        abilityModifiers: {},
        speed: 30,
        languages: ["Common"],
    },
    {
        name: "Elf; Wood Elf Lineage",
        edition: "2024",
        traits: [
            "Darkvision: You have Darkvision with a range of 60 feet.",
            "Elven Lineage (Wood Elf): You are part of a lineage that grants you supernatural abilities. Your Speed increases to 35 feet. You also know the Druidcraft cantrip.\nWhen you reach character level 3, you learn the Longstrider spell. When you reach character level 5, you also learn the Pass without Trace spell. You always have these spells prepared, and you can cast each spell once without a spell slot. Once you cast either of these spells with this trait, you can't cast that spell with it again until you finish a Long Rest. You can also cast the spell using any spell slots you have of the appropriate level.\nIntelligence, Wisdom, or Charisma is your spellcasting ability for the spells you cast with this trait (choose the ability when you select the lineage).",
            "Fey Ancestry: You have Advantage on saving throws you make to avoid or end the Charmed condition.",
            "Keen Senses: You have proficiency in the Insight, Perception, or Survival skill.",
            "Trance: You don't need to sleep, and magic can't put you to sleep. You can finish a Long Rest in 4 hours if you spend those hours in a trancelike meditation, during which you retain consciousness.",
        ],
        abilityModifiers: {},
        speed: 35,
        languages: ["Common"],
    },
    {
        name: "Gnome",
        edition: "2024",
        traits: [
            "Darkvision: You have Darkvision with a range of 60 feet.",
            "Gnomish Cunning: You have Advantage on Intelligence, Wisdom, and Charisma saving throws.",
            "Gnomish Lineage: You are part of a lineage that grants you supernatural abilities. Choose one of the following options; whichever one you choose, Intelligence, Wisdom, or Charisma is your spellcasting ability for the spells you cast with this trait (choose the ability when you select the lineage):\n- Forest Gnome: You know the Minor Illusion cantrip. You also always have the Speak with Animals spell prepared. You can cast it without a spell slot a number of times equal to your Proficiency, and you regain all expended uses when you finish a Long Rest. You can also use any spell slots you have to cast the spell.\n- Rock Gnome: You know the Mending and Prestidigitation cantrips. In addition, you can spend 10 minutes casting Prestidigitation to create a Tiny clockwork device (AC 5, 1 HP), such as a toy, fire starter, or music box. When you create the device, you determine its function by choosing one effect from Prestidigitation; the device produces that effect whenever you or another creature takes a Bonus Action to activate it with a touch. If the chosen effect has options within it, you choose one of those options for the device when you create it. For example, if you choose the spell's ignite-extinguish effect, you determine whether the device ignites or extinguishes fire; the device doesn't do both. You can have three such devices in existence at a time, and each falls apart 8 hours after its creation or when you dismantle it with a touch as a Utilize action.",
        ],
        abilityModifiers: {},
        speed: 30,
        languages: ["Common"],
    },
    {
        name: "Gnome; Forest Gnome Lineage",
        edition: "2024",
        traits: [
            "Darkvision: You have Darkvision with a range of 60 feet.",
            "Gnomish Cunning: You have Advantage on Intelligence, Wisdom, and Charisma saving throws.",
            "Gnomish Lineage (Forest Gnome): You know the Minor Illusion cantrip. You also always have the Speak with Animals spell prepared. You can cast it without a spell slot a number of times equal to your Proficiency, and you regain all expended uses when you finish a Long Rest. You can also use any spell slots you have to cast the spell.",
        ],
        abilityModifiers: {},
        speed: 30,
        languages: ["Common"],
    },
    {
        name: "Gnome; Rock Gnome Lineage",
        edition: "2024",
        traits: [
            "Darkvision: You have Darkvision with a range of 60 feet.",
            "Gnomish Cunning: You have Advantage on Intelligence, Wisdom, and Charisma saving throws.",
            "Gnomish Lineage (Rock Gnome): You know the Mending and Prestidigitation cantrips. In addition, you can spend 10 minutes casting Prestidigitation to create a Tiny clockwork device (AC 5, 1 HP), such as a toy, fire starter, or music box. When you create the device, you determine its function by choosing one effect from Prestidigitation; the device produces that effect whenever you or another creature takes a Bonus Action to activate it with a touch. If the chosen effect has options within it, you choose one of those options for the device when you create it. For example, if you choose the spell's ignite-extinguish effect, you determine whether the device ignites or extinguishes fire; the device doesn't do both. You can have three such devices in existence at a time, and each falls apart 8 hours after its creation or when you dismantle it with a touch as a Utilize action.",
        ],
        abilityModifiers: {},
        speed: 30,
        languages: ["Common"],
    },
    {
        name: "Goliath",
        edition: "2024",
        traits: [
            "Giant Ancestry: You are descended from Giants. Choose one of the following benefits—a supernatural boon from your ancestry; you can use the chosen benefit a number of times equal to your Proficiency, and you regain all expended uses when you finish a Long Rest:\n- Cloud's Jaunt (Cloud Giant): As a Bonus Action, you magically teleport up to 30 feet to an unoccupied space you can see.\n- Fire's Burn (Fire Giant): When you hit a target with an attack roll and deal damage to it, you can also deal 1d10 Fire damage to that target.\n- Frost's Chill (Frost Giant): When you hit a target with an attack roll and deal damage to it, you can also deal 1d6 Cold damage to that target and reduce its Speed by 10 feet until the start of your next turn.\n- Hill's Tumble (Hill Giant): When you hit a Large or smaller creature with an attack roll and deal damage to it, you can give that target the Prone condition.\n- Stone's Endurance (Stone Giant): When you take damage, you can take a Reaction to roll 1d12. Add your Constitution modifier to the number rolled and reduce the damage by that total.\n- Storm's Thunder (Storm Giant): When you take damage from a creature within 60 feet of you, you can take a Reaction to deal 1d8 Thunder damage to that creature.",
            "Large Form: Starting at character level 5, you can change your size to Large as a Bonus Action if you're in a big enough space. This transformation lasts for 10 minutes or until you end it (no action required). For that duration, you have Advantage on Strength checks, and your Speed increases by 10 feet. Once you use this trait, you can't use it again until you finish a Long Rest.",
            "Powerful Build: You have Advantage on any ability check you make to end the Grappled condition. You also count as one size larger when determining your carrying capacity.",
        ],
        abilityModifiers: {},
        speed: 35,
        languages: ["Common"],
    },
    {
        name: "Goliath; Cloud Giant Ancestry",
        edition: "2024",
        traits: [
            "Giant Ancestry (Cloud): You are descended from Giants, granting you a supernatural boon; you can use this boon a number of times equal to your Proficiency, and you regain all expended uses when you finish a Long Rest:\n- Cloud's Jaunt: As a Bonus Action, you magically teleport up to 30 feet to an unoccupied space you can see.",
            "Large Form: Starting at character level 5, you can change your size to Large as a Bonus Action if you're in a big enough space. This transformation lasts for 10 minutes or until you end it (no action required). For that duration, you have Advantage on Strength checks, and your Speed increases by 10 feet. Once you use this trait, you can't use it again until you finish a Long Rest.",
            "Powerful Build: You have Advantage on any ability check you make to end the Grappled condition. You also count as one size larger when determining your carrying capacity.",
        ],
        abilityModifiers: {},
        speed: 35,
        languages: ["Common"],
    },
    {
        name: "Goliath; Fire Giant Ancestry",
        edition: "2024",
        traits: [
            "Giant Ancestry (Fire): You are descended from Giants, granting you a supernatural boon; you can use this boon a number of times equal to your Proficiency, and you regain all expended uses when you finish a Long Rest:\n- Fire's Burn: When you hit a target with an attack roll and deal damage to it, you can also deal 1d10 Fire damage to that target.",
            "Large Form: Starting at character level 5, you can change your size to Large as a Bonus Action if you're in a big enough space. This transformation lasts for 10 minutes or until you end it (no action required). For that duration, you have Advantage on Strength checks, and your Speed increases by 10 feet. Once you use this trait, you can't use it again until you finish a Long Rest.",
            "Powerful Build: You have Advantage on any ability check you make to end the Grappled condition. You also count as one size larger when determining your carrying capacity.",
        ],
        abilityModifiers: {},
        speed: 35,
        languages: ["Common"],
    },
    {
        name: "Goliath; Frost Giant Ancestry",
        edition: "2024",
        traits: [
            "Giant Ancestry (Frost): You are descended from Giants, granting you a supernatural boon; you can use this boon a number of times equal to your Proficiency, and you regain all expended uses when you finish a Long Rest:\n- Frost's Chill: When you hit a target with an attack roll and deal damage to it, you can also deal 1d6 Cold damage to that target and reduce its Speed by 10 feet until the start of your next turn.",
            "Large Form: Starting at character level 5, you can change your size to Large as a Bonus Action if you're in a big enough space. This transformation lasts for 10 minutes or until you end it (no action required). For that duration, you have Advantage on Strength checks, and your Speed increases by 10 feet. Once you use this trait, you can't use it again until you finish a Long Rest.",
            "Powerful Build: You have Advantage on any ability check you make to end the Grappled condition. You also count as one size larger when determining your carrying capacity.",
        ],
        abilityModifiers: {},
        speed: 35,
        languages: ["Common"],
    },
    {
        name: "Goliath; Hill Giant Ancestry",
        edition: "2024",
        traits: [
            "Giant Ancestry (Hill): You are descended from Giants, granting you a supernatural boon; you can use this boon a number of times equal to your Proficiency, and you regain all expended uses when you finish a Long Rest:\n- Hill's Tumble: When you hit a Large or smaller creature with an attack roll and deal damage to it, you can give that target the Prone condition.",
            "Large Form: Starting at character level 5, you can change your size to Large as a Bonus Action if you're in a big enough space. This transformation lasts for 10 minutes or until you end it (no action required). For that duration, you have Advantage on Strength checks, and your Speed increases by 10 feet. Once you use this trait, you can't use it again until you finish a Long Rest.",
            "Powerful Build: You have Advantage on any ability check you make to end the Grappled condition. You also count as one size larger when determining your carrying capacity.",
        ],
        abilityModifiers: {},
        speed: 35,
        languages: ["Common"],
    },
    {
        name: "Goliath; Stone Giant Ancestry",
        edition: "2024",
        traits: [
            "Giant Ancestry (Stone): You are descended from Giants, granting you a supernatural boon; you can use this boon a number of times equal to your Proficiency, and you regain all expended uses when you finish a Long Rest:\n- Stone's Endurance: When you take damage, you can take a Reaction to roll 1d12. Add your Constitution modifier to the number rolled and reduce the damage by that total.",
            "Large Form: Starting at character level 5, you can change your size to Large as a Bonus Action if you're in a big enough space. This transformation lasts for 10 minutes or until you end it (no action required). For that duration, you have Advantage on Strength checks, and your Speed increases by 10 feet. Once you use this trait, you can't use it again until you finish a Long Rest.",
            "Powerful Build: You have Advantage on any ability check you make to end the Grappled condition. You also count as one size larger when determining your carrying capacity.",
        ],
        abilityModifiers: {},
        speed: 35,
        languages: ["Common"],
    },
    {
        name: "Goliath; Storm Giant Ancestry",
        edition: "2024",
        traits: [
            "Giant Ancestry (Storm): You are descended from Giants, granting you a supernatural boon; you can use this boon a number of times equal to your Proficiency, and you regain all expended uses when you finish a Long Rest:\n- Storm's Thunder: When you take damage from a creature within 60 feet of you, you can take a Reaction to deal 1d8 Thunder damage to that creature.",
            "Large Form: Starting at character level 5, you can change your size to Large as a Bonus Action if you're in a big enough space. This transformation lasts for 10 minutes or until you end it (no action required). For that duration, you have Advantage on Strength checks, and your Speed increases by 10 feet. Once you use this trait, you can't use it again until you finish a Long Rest.",
            "Powerful Build: You have Advantage on any ability check you make to end the Grappled condition. You also count as one size larger when determining your carrying capacity.",
        ],
        abilityModifiers: {},
        speed: 35,
        languages: ["Common"],
    },
    {
        name: "Halfling",
        edition: "2024",
        traits: [
            "Brave: You have Advantage on saving throws you make to avoid or end the Frightened condition.",
            "Halfling Nimbleness: You can move through the space of any creature that is a size larger than you, but you can't stop in the same space.",
            "Luck: When you roll a 1 on the d20 of a D20 Test, you can reroll the die, and you must use the new roll.",
            "Naturally Stealthy: You can take the Hide action even when you are obscured only by a creature that is at least one size larger than you.",
        ],
        abilityModifiers: {},
        speed: 30,
        languages: ["Common"],
    },
    {
        name: "Hexblood",
        edition: "2024",
        traits: [
            "Darkvision: You have Darkvision with a range of 60 feet.",
            "Eerie Token: As a Bonus Action, you can create a magical token by harmlessly removing a lock of hair, detaching a nail, or using some other method. While the token exists, you gain the following benefits:\n- Distant Message: As a Magic action, you can send a telepathic message of 25 words or fewer to a creature holding or carrying the token, as long as you are within 10 miles of it.\n- Remote Viewing: If you are within 10 miles of the token, you can take a Magic action to extend your senses through the token for 1 minute, until you have the Incapacitated condition, or until you end this state (no action required). During this state, you can see and hear from the token as if you were located where it is. When this state ends, the token is harmlessly destroyed.\nUnless the token is destroyed early, it lasts until you finish a Long Rest. Once you create a token using this feature, you can't do so again until you finish a Long Rest.\n- Hex Magic: You always have the Disguise Self and Hex spells prepared. You can cast each spell once without a spell slot, and you regain the ability to cast it in that way when you finish a Long Rest. You can also cast the spell using any spell slots you have of the appropriate level. Intelligence, Wisdom, or Charisma is your spellcasting ability for the spells you cast with this trait (choose the ability when you select this species).",
        ],
        abilityModifiers: {},
        speed: 30,
        languages: ["Common"],
    },
    {
        name: "Kalashtar",
        edition: "2024",
        traits: [
            "Dual Mind: You have Advantage on Wisdom and Charisma saving throws.",
            "Mental Discipline: You have Resistance to Psychic damage.",
            "Mind Link: You have telepathy with a range in feet equal to 10 times your level. When you're using this trait to speak telepathically to a creature, you can take a Magic action to give that creature the ability to speak telepathically with you for 1 hour or until you take another Magic action to end this effect.",
            "Severed from Dreams: You can't be the target of the Dream spell. In addition, when you finish a Long Rest, you gain proficiency in one skill of your choice. This proficiency lasts until you finish another Long Rest.",
        ],
        abilityModifiers: {},
        speed: 30,
        languages: ["Common"],
        grantedSkillChoice: { choose: 1 },
    },
    {
        name: "Khoravar",
        edition: "2024",
        traits: [
            "Darkvision: You have Darkvision with a range of 60 feet.",
            "Fey Ancestry: You have Advantage on saving throws you make to avoid or end the Charmed condition.",
            "Fey Gift: You know the Friends cantrip. Whenever you finish a Long Rest, you can replace that cantrip with a different cantrip from the Cleric, Druid, or Wizard spell list. Intelligence, Wisdom, or Charisma is your spellcasting ability for it (choose the ability when you select this species).",
            "Lethargy Resilience: When you fail a saving throw to avoid or end the Unconscious condition, you can succeed instead. Once you use this trait, you can't do so again until you finish 1d4 Long Rest.",
            "Skill Versatility: You gain proficiency in one skill or with one tool of your choice. Whenever you finish a Long Rest, you can replace it with another skill or tool proficiency.",
        ],
        abilityModifiers: {},
        speed: 30,
        languages: ["Common"],
    },
    {
        name: "Kithkin",
        edition: "2024",
        traits: [
            "Brave: You have Advantage on saving throws you make to avoid or end the Frightened condition.",
            "Halfling Nimbleness: You can move through the space of any creature that is a size larger than you, but you can't stop in the same space.",
            "Luck: When you roll a 1 on the d20 of a D20 Test, you can reroll the die, and you must use the new roll.",
            "Naturally Stealthy: You can take the Hide action even when you are obscured only by a creature that is at least one size larger than you.",
            "Kithkin Lineage: As a native of either Lorwyn and Shadowmoor, you may gain additional traits.\n- Lorwyn: You do not gain any additional traits.\n- Shadowmoor: You have Darkvision with a range of 120 feet.",
        ],
        abilityModifiers: {},
        speed: 30,
        languages: ["Common"],
    },
    {
        name: "Kithkin; Lorwyn",
        edition: "2024",
        traits: [
            "Brave: You have Advantage on saving throws you make to avoid or end the Frightened condition.",
            "Halfling Nimbleness: You can move through the space of any creature that is a size larger than you, but you can't stop in the same space.",
            "Luck: When you roll a 1 on the d20 of a D20 Test, you can reroll the die, and you must use the new roll.",
            "Naturally Stealthy: You can take the Hide action even when you are obscured only by a creature that is at least one size larger than you.",
        ],
        abilityModifiers: {},
        speed: 30,
        languages: ["Common"],
    },
    {
        name: "Kithkin; Shadowmoor",
        edition: "2024",
        traits: [
            "Darkvision: You have Darkvision with a range of 120 feet.",
            "Brave: You have Advantage on saving throws you make to avoid or end the Frightened condition.",
            "Halfling Nimbleness: You can move through the space of any creature that is a size larger than you, but you can't stop in the same space.",
            "Luck: When you roll a 1 on the d20 of a D20 Test, you can reroll the die, and you must use the new roll.",
            "Naturally Stealthy: You can take the Hide action even when you are obscured only by a creature that is at least one size larger than you.",
        ],
        abilityModifiers: {},
        speed: 30,
        languages: ["Common"],
    },
    {
        name: "Lupin",
        edition: "2024",
        traits: [
            "Darkvision: You have Darkvision with a range of 60 feet.",
            "Feral Pounce: Your Unarmed Strike deal Slashing damage instead of Bludgeoning damage. In addition, when you hit a creature with an Unarmed Strike as part of the Attack action on your turn, you can use both the Damage and the Shove options. You can use this benefit only once per turn.",
            "Howl: As a Bonus Action, you let out an unearthly howl. Each creature of your choice within 15 feet of you must succeed on a Wisdom saving throw (DC 8 plus your Constitution modifier and Proficiency) or have Disadvantage on attack rolls and saving throws until the start of your next turn.\nYou can use this trait a number of times equal to your Proficiency, and you regain all expended uses when you finish a Long Rest.",
            "Werewolf Instincts: You have proficiency in the Perception, Stealth, or Survival skill.",
        ],
        abilityModifiers: {},
        speed: 30,
        languages: ["Common"],
    },
    {
        name: "Orc",
        edition: "2024",
        traits: [
            "Adrenaline Rush: You can take the Dash action as a Bonus Action. When you do so, you gain a number of Temporary Hit Points equal to your Proficiency.\nYou can use this trait a number of times equal to your Proficiency, and you regain all expended uses when you finish a Short Rest or Long Rest.",
            "Darkvision: You have Darkvision with a range of 120 feet.",
            "Relentless Endurance: When you are reduced to 0 Hit Points but not killed outright, you can drop to 1 Hit Points instead. Once you use this trait, you can't do so again until you finish a Long Rest.",
        ],
        abilityModifiers: {},
        speed: 30,
        languages: ["Common"],
    },
    {
        name: "Reborn",
        edition: "2024",
        traits: [
            "Escaped Death: You have Advantage on Death Saving Throw.",
            "Everlasting: You don't gain Exhaustion levels from dehydration, malnutrition, or suffocation. You don't need to sleep, and magic can't put you to sleep. You can finish a Long Rest in 4 hours if you spend those hours in an inactive, motionless state, during which you retain consciousness.",
            "Knowledge from a Past Life: You gain proficiency in one skill of your choice.\nIn addition, you can temporarily peer into the past to aid you in the present. When you fail an ability check, you can roll 1d6 and add the number rolled to the d20, potentially turning the failure into a success. You can do this a number of times equal to your Proficiency, and you regain all expended uses when you finish a Long Rest.",
            "Strange Endurance: You have Resistance to one of the following damage types of your choice: Cold, Necrotic, or Poison.",
        ],
        abilityModifiers: {},
        speed: 30,
        languages: ["Common"],
        grantedSkillChoice: { choose: 1 },
    },
    {
        name: "Shifter",
        edition: "2024",
        traits: [
            "Bestial Instincts: Channeling the beast within, you gain proficiency in one of the following skills of your choice: Acrobatics, Athletics, Intimidation, or Survival.",
            "Darkvision: You have Darkvision with a range of 60 feet.",
            "Shifting: As a Bonus Action, you can shape-shift to assume a more bestial appearance. This transformation lasts for 1 minute or until you revert to your normal appearance as a Bonus Action. When you shift, you gain Temporary Hit Points equal to 2 times your Proficiency. You can shift a number of times equal to your Proficiency, and you regain all expended uses when you finish a Long Rest.\nWhenever you shift, you gain the benefit of one of the following options (choose when you select this species)\n- Beasthide: You gain 1d6 additional Temporary Hit Points. While shifted, you have a +1 bonus to your Armor Class.\n- Longtooth: When you shift and as a Bonus Action on your other turns while shifted, you can use your elongated fangs to make an Unarmed Strike. If you hit with this Unarmed Strike and deal damage, you can deal Piercing damage equal to 1d6 plus your Strength modifier, instead of the normal damage of an Unarmed Strike.\n- Swiftstride: While you are shifted, your Speed increases by 10 feet. Additionally, you can move up to 10 feet as a Reaction when a creature ends its turn within 5 feet of you. This reactive movement doesn't provoke Opportunity Attack.\n- Wildhunt: While shifted, you have Advantage on Wisdom checks. Additionally, no creature within 30 feet of you can have Advantage on an attack roll against you unless you have the Incapacitated condition.",
        ],
        abilityModifiers: {},
        speed: 30,
        languages: ["Common"],
    },
    {
        name: "Shifter; Beasthide",
        edition: "2024",
        traits: [
            "Bestial Instincts: Channeling the beast within, you gain proficiency in one of the following skills of your choice: Acrobatics, Athletics, Intimidation, or Survival.",
            "Darkvision: You have Darkvision with a range of 60 feet.",
            "Shifting (Beasthide): As a Bonus Action, you can shape-shift to assume a more bestial appearance. This transformation lasts for 1 minute or until you revert to your normal appearance as a Bonus Action. When you shift, you gain Temporary Hit Points equal to 2 times your Proficiency. You can shift a number of times equal to your Proficiency, and you regain all expended uses when you finish a Long Rest.\nWhenever you shift, you gain 1d6 additional Temporary Hit Points. While shifted, you have a +1 bonus to your Armor Class.",
        ],
        abilityModifiers: {},
        speed: 30,
        languages: ["Common"],
    },
    {
        name: "Shifter; Longtooth",
        edition: "2024",
        traits: [
            "Bestial Instincts: Channeling the beast within, you gain proficiency in one of the following skills of your choice: Acrobatics, Athletics, Intimidation, or Survival.",
            "Darkvision: You have Darkvision with a range of 60 feet.",
            "Shifting (Longtooth): As a Bonus Action, you can shape-shift to assume a more bestial appearance. This transformation lasts for 1 minute or until you revert to your normal appearance as a Bonus Action. When you shift, you gain Temporary Hit Points equal to 2 times your Proficiency. You can shift a number of times equal to your Proficiency, and you regain all expended uses when you finish a Long Rest.\nWhen you shift and as a Bonus Action on your other turns while shifted, you can use your elongated fangs to make an Unarmed Strike. If you hit with this Unarmed Strike and deal damage, you can deal Piercing damage equal to 1d6 plus your Strength modifier, instead of the normal damage of an Unarmed Strike.",
        ],
        abilityModifiers: {},
        speed: 30,
        languages: ["Common"],
    },
    {
        name: "Shifter; Swiftstride",
        edition: "2024",
        traits: [
            "Bestial Instincts: Channeling the beast within, you gain proficiency in one of the following skills of your choice: Acrobatics, Athletics, Intimidation, or Survival.",
            "Darkvision: You have Darkvision with a range of 60 feet.",
            "Shifting (Swiftstride): As a Bonus Action, you can shape-shift to assume a more bestial appearance. This transformation lasts for 1 minute or until you revert to your normal appearance as a Bonus Action. When you shift, you gain Temporary Hit Points equal to 2 times your Proficiency. You can shift a number of times equal to your Proficiency, and you regain all expended uses when you finish a Long Rest.\nWhile you are shifted, your Speed increases by 10 feet. Additionally, you can move up to 10 feet as a Reaction when a creature ends its turn within 5 feet of you. This reactive movement doesn't provoke Opportunity Attack.",
        ],
        abilityModifiers: {},
        speed: 30,
        languages: ["Common"],
    },
    {
        name: "Shifter; Wildhunt",
        edition: "2024",
        traits: [
            "Bestial Instincts: Channeling the beast within, you gain proficiency in one of the following skills of your choice: Acrobatics, Athletics, Intimidation, or Survival.",
            "Darkvision: You have Darkvision with a range of 60 feet.",
            "Shifting (Wildhunt): As a Bonus Action, you can shape-shift to assume a more bestial appearance. This transformation lasts for 1 minute or until you revert to your normal appearance as a Bonus Action. When you shift, you gain Temporary Hit Points equal to 2 times your Proficiency. You can shift a number of times equal to your Proficiency, and you regain all expended uses when you finish a Long Rest.\nWhile shifted, you have Advantage on Wisdom checks. Additionally, no creature within 30 feet of you can have Advantage on an attack roll against you unless you have the Incapacitated condition.",
        ],
        abilityModifiers: {},
        speed: 30,
        languages: ["Common"],
    },
    {
        name: "Tiefling",
        edition: "2024",
        traits: [
            "Darkvision: You have Darkvision with a range of 60 feet.",
            "Fiendish Legacy: You are the recipient of a legacy that grants you supernatural abilities. Choose a legacy from the Fiendish Legacies table. You gain the level 1 benefit of the chosen legacy.\nWhen you reach character levels 3 and 5, you learn a higher-level spell, as shown on the table. You always have that spell prepared. You can cast it once without a spell slot, and you regain the ability to cast it in that way when you finish a Long Rest. You can also cast the spell using any spell slots you have of the appropriate level. Intelligence, Wisdom, or Charisma is your spellcasting ability for the spells you cast with this trait (choose the ability when you select the legacy).",
            "Otherworldly Presence: You know the Thaumaturgy cantrip. When you cast it with this trait, the spell uses the same spellcasting ability you use for your Fiendish Legacy Trait.",
        ],
        abilityModifiers: {},
        speed: 30,
        languages: ["Common"],
    },
    {
        name: "Tiefling; Abyssal Legacy",
        edition: "2024",
        traits: [
            "Darkvision: You have Darkvision with a range of 60 feet.",
            "Fiendish Legacy (Abyssal): You are the recipient of a legacy that grants you supernatural abilities. You have Resistance to Poison damage. You also know the Poison Spray cantrip.\nWhen you reach character level 3, you learn the Ray of Sickness spell. When you reach character level 5, you also learn the Hold Person spell. You always have these spells prepared, and you can cast each spell once without a spell slot. Once you cast either of these spells with this trait, you can't cast that spell with it again until you finish a Long Rest. You can also cast the spell using any spell slots you have of the appropriate level.\nIntelligence, Wisdom, or Charisma is your spellcasting ability for the spells you cast with this trait (choose the ability when you select the legacy).",
            "Otherworldly Presence: You know the Thaumaturgy cantrip. When you cast it with this trait, the spell uses the same spellcasting ability you use for your Fiendish Legacy Trait.",
        ],
        abilityModifiers: {},
        speed: 30,
        languages: ["Common"],
    },
    {
        name: "Tiefling; Chthonic Legacy",
        edition: "2024",
        traits: [
            "Darkvision: You have Darkvision with a range of 60 feet.",
            "Fiendish Legacy (Chthonic): You are the recipient of a legacy that grants you supernatural abilities. You have Resistance to Necrotic damage. You also know the Chill Touch cantrip.\nWhen you reach character level 3, you learn the False Life spell. When you reach character level 5, you also learn the Ray of Enfeeblement spell. You always have these spells prepared, and you can cast each spell once without a spell slot. Once you cast either of these spells with this trait, you can't cast that spell with it again until you finish a Long Rest. You can also cast the spell using any spell slots you have of the appropriate level.\nIntelligence, Wisdom, or Charisma is your spellcasting ability for the spells you cast with this trait (choose the ability when you select the legacy).",
            "Otherworldly Presence: You know the Thaumaturgy cantrip. When you cast it with this trait, the spell uses the same spellcasting ability you use for your Fiendish Legacy Trait.",
        ],
        abilityModifiers: {},
        speed: 30,
        languages: ["Common"],
    },
    {
        name: "Tiefling; Infernal Legacy",
        edition: "2024",
        traits: [
            "Darkvision: You have Darkvision with a range of 60 feet.",
            "Fiendish Legacy (Infernal): You are the recipient of a legacy that grants you supernatural abilities. You have Resistance to Fire damage. You also know the Fire Bolt cantrip.\nWhen you reach character level 3, you learn the Hellish Rebuke spell. When you reach character level 5, you also learn the Darkness spell. You always have these spells prepared, and you can cast each spell once without a spell slot. Once you cast either of these spells with this trait, you can't cast that spell with it again until you finish a Long Rest. You can also cast the spell using any spell slots you have of the appropriate level.\nIntelligence, Wisdom, or Charisma is your spellcasting ability for the spells you cast with this trait (choose the ability when you select the legacy).",
            "Otherworldly Presence: You know the Thaumaturgy cantrip. When you cast it with this trait, the spell uses the same spellcasting ability you use for your Fiendish Legacy Trait.",
        ],
        abilityModifiers: {},
        speed: 30,
        languages: ["Common"],
    },
    {
        name: "Warforged",
        edition: "2024",
        traits: [
            "Construct Resilience: You have Resistance to Poison damage. You also have Advantage on saving throws to avoid or end the Poisoned condition.",
            "Integrated Protection: You gain a +1 bonus to your Armor Class. In addition, armor you have donned can't be removed against your will while you're alive.",
            "Sentry's Rest: You don't need to sleep, and magic can't put you to sleep. You can finish a Long Rest in 6 hours if you spend those hours in an inactive, motionless state. During this time, you appear inert but remain conscious.",
            "Specialized Design: You gain one skill proficiency and one tool proficiency of your choice.",
            "Tireless: You don't gain Exhaustion levels from dehydration, malnutrition, or suffocation.",
        ],
        abilityModifiers: {},
        speed: 30,
        languages: ["Common"],
    },
];
