import { CharacterClass } from "@/interfaces/CharacterClass";
import { halfCasterProgression } from "@/interfaces/SpellSlotsProgression";

// Artificer has no official 2024 (XPHB) printing - this uses its most recent
// official crunch (Eberron: Forge of the Artificer, 2023) under the '2014' edition
// tag. casterProgression is bucketed as 'half' for multiclassing purposes (matching
// the PHB multiclassing table), though Artificer's own single-class slot table starts
// at level 1 rather than following the shared half-caster table exactly - worth a
// gut-check against Tasha's Cauldron of Everything if that matters for your build.
export const Artificer: CharacterClass = {
    name: "Artificer",
    edition: "2014",
    hitDie: 8,
    proficiencies: {
        armor: ["Light armor", "Medium armor", "Shields"],
        weapons: ["Simple weapons"],
        tools: ["Thieves' Tools", "Tinker's Tools", "One type of Artisan's Tools of your choice"],
        savingThrows: ["constitution", "intelligence"],
        skills: { choose: 2, from: ["Arcana", "History", "Investigation", "Medicine", "Nature", "Perception", "Sleight of Hand"] },
    },
    multiclassProficiencies: {
        armor: ["Light armor", "Medium armor", "Shields"],
        tools: ["Tinker's Tools"],
        skills: { choose: 1, from: ["Arcana", "History", "Investigation", "Medicine", "Nature", "Perception", "Sleight of Hand"] },
    },
    primaryAbility: "intelligence",
    casterProgression: "half",
    spellcasting: {
        ability: "intelligence",
        preparation: "prepared",
        ritualCasting: true,
        progression: halfCasterProgression,
    },
    subclassLevel: 3,
};
