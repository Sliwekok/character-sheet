import { CharacterClass } from "@/interfaces/CharacterClass";

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
};
