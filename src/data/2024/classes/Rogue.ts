import { CharacterClass } from "@/interfaces/CharacterClass";

// weaponMasteryProgression was previously missing entirely. Filled in to match the
// same {1,4,10} breakpoints and counts already sourced from 5etools for Barbarian
// (Fighter alone gets an extra step at 16) - worth a cross-check against your book.
export const Rogue: CharacterClass = {
    name: "Rogue",
    edition: "2024",
    hitDie: 8,
    proficiencies: {
        armor: ["Light armor"],
        weapons: ["Simple weapons", "Martial weapons that have the type=martial weapon property"],
        tools: ["Thieves' Tools"],
        savingThrows: ["dexterity", "intelligence"],
        skills: { choose: 4, from: [
            "Acrobatics",
            "Athletics",
            "Deception",
            "Insight",
            "Intimidation",
            "Investigation",
            "Perception",
            "Persuasion",
            "Sleight of Hand",
            "Stealth",
        ] },
    },
    multiclassProficiencies: {
        armor: ["Light armor"],
        tools: ["Thieves' Tools"],
        skills: { choose: 1, from: [
            "Acrobatics",
            "Athletics",
            "Deception",
            "Insight",
            "Intimidation",
            "Investigation",
            "Perception",
            "Persuasion",
            "Sleight of Hand",
            "Stealth",
        ] },
    },
    primaryAbility: "dexterity",
    casterProgression: "none",
    subclassLevel: 3,
    weaponMasteryProgression: { 1: 2, 4: 3, 10: 4 },
};
