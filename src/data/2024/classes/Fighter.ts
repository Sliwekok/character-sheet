import { CharacterClass } from "@/interfaces/CharacterClass";

// weaponMasteryProgression sourced directly from 5etools' class table data (not
// hand-recalled) - still worth a quick cross-check against your book.
export const Fighter: CharacterClass = {
    name: "Fighter",
    edition: "2024",
    hitDie: 10,
    proficiencies: {
        armor: ["Light armor", "Medium armor", "Heavy armor", "Shields"],
        weapons: ["Simple weapons", "Martial weapons"],
        savingThrows: ["strength", "constitution"],
        skills: { choose: 2, from: [
            "Acrobatics",
            "Animal Handling",
            "Athletics",
            "History",
            "Insight",
            "Intimidation",
            "Persuasion",
            "Perception",
            "Survival",
        ] },
    },
    multiclassProficiencies: {
        armor: ["Light armor", "Medium armor", "Shields"],
        weapons: ["Martial weapons"],
    },
    primaryAbility: "strength",
    casterProgression: "none",
    subclassLevel: 3,
    weaponMasteryProgression: { 1: 3, 4: 4, 10: 5, 16: 6 },
};
