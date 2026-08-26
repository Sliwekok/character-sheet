import { CharacterClass } from "@/interfaces/CharacterClass";

export const Monk: CharacterClass = {
    name: "Monk",
    edition: "2014",
    hitDie: 8,
    proficiencies: {
        armor: [],
        weapons: ["Simple weapons", "Shortswords"],
        tools: ["Any one type of artisan's tools or any one musical instrument of your choice"],
        savingThrows: ["strength", "dexterity"],
        skills: { choose: 2, from: ["Acrobatics", "Athletics", "History", "Insight", "Religion", "Stealth"] },
    },
    multiclassProficiencies: {
        weapons: ["Simple weapons", "Shortswords"],
    },
    primaryAbility: "dexterity",
    casterProgression: "none",
    subclassLevel: 3,
};
