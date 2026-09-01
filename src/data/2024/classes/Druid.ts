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
    // features authored from memory of the 2024 PHB (no web access) - worth a cross-check against your book.
    features: [
        { name: "Druidic", level: 1, description: "You know Druidic, the secret language of druids. You can speak the language and use it to leave hidden messages that you and others who know Druidic automatically spot. Others spot the message's presence with a DC 15 Wisdom (Perception) check but can't decipher it without magic." },
        { name: "Spellcasting", level: 1, description: "Drawing on the divine essence of nature itself, you can cast spells to shape that essence to your will. See the Spells section of this sheet for the spells you have prepared, your spell save DC, and your spell attack bonus." },
        { name: "Primal Order", level: 1, description: "You have dedicated yourself to one of the following sacred roles of your choice. Magician: you learn an extra cantrip from the druid spell list, and your spellcasting ability check to recall lore has advantage. Warden: you gain training with Martial weapons and Medium armor." },
        { name: "Wild Shape", level: 2, description: "You can use your action to magically assume the shape of a beast that you have seen before. You can use this feature twice, regaining expended uses when you finish a short or long rest. Your druid level determines the beasts you can transform into, as shown in the Beast Shapes table, and you can stay in beast form for a number of hours equal to half your druid level (rounded down), or until you drop to 0 hit points or die." },
        { name: "Wild Companion", level: 2, description: "You can expend a use of your Wild Shape to cast the find familiar spell without material components, without expending a spell slot. The familiar disappears after a number of hours equal to half your druid level." },
        { name: "Ability Score Improvement", level: 4, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature. At 19th level you can instead take an Epic Boon feat." },
        { name: "Wild Resurgence", level: 5, description: "Once per long rest, you can convert unused Wild Shape uses into spell slots: you can turn one Wild Shape use into a single spell slot no higher than 1st level, or vice versa. Additionally, once per long rest you can give yourself a Wild Shape use by expending a spell slot." },
        { name: "Ability Score Improvement", level: 8, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature. At 19th level you can instead take an Epic Boon feat." },
        { name: "Elemental Fury", level: 11, description: "You choose one of the following options each time you cast a druid spell that deals damage, or each time you deal damage with Wild Shape: Potent Spellcasting (add your Wisdom modifier to one damage roll of a druid spell you cast) or Primal Strike (your Wild Shape attacks count as magical for overcoming resistance and immunity)." },
        { name: "Ability Score Improvement", level: 12, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature. At 19th level you can instead take an Epic Boon feat." },
        { name: "Ability Score Improvement", level: 16, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature. At 19th level you can instead take an Epic Boon feat." },
        { name: "Beast Spells", level: 18, description: "You can cast many of your druid spells in any shape you assume using Wild Shape, performing verbal and somatic components while unable to provide material components that have a cost or are consumed." },
        { name: "Timeless Body", level: 18, description: "The primal magic you wield causes you to age more slowly. For every 10 years that pass, your body ages only 1 year, and you no longer suffer the frailty of old age." },
        { name: "Ability Score Improvement", level: 19, description: "When you reach 4th level, and again at 8th, 12th, 16th, and 19th level, you can increase one ability score of your choice by 2, or you can increase two ability scores of your choice by 1 each. As normal, you can't increase an ability score above 20 using this feature. At 19th level you can instead take an Epic Boon feat." },
        { name: "Archdruid", level: 20, description: "You can use Wild Shape an unlimited number of times. Additionally, you can ignore the verbal and somatic components of your druid spells, as well as any material components that lack a cost and aren't consumed by a spell." },
    ],
};
