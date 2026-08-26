import { CharacterClass } from "@/interfaces/CharacterClass";

export const Monk: CharacterClass = {
    name: "Monk",
    edition: "2024",
    hitDie: 8,
    proficiencies: {
        armor: [],
        weapons: ["Simple weapons", "Martial weapons that have the type=martial weapon property"],
        tools: ["Choose one type of Artisan's Tools or Musical Instrument"],
        savingThrows: ["strength", "dexterity"],
        skills: { choose: 2, from: ["Acrobatics", "Athletics", "History", "Insight", "Religion", "Stealth"] },
    },
    primaryAbility: "dexterity",
    casterProgression: "none",
    subclassLevel: 3,
};
