import { CharacterClass } from "@/interfaces/CharacterClass";

// weaponMasteryProgression sourced directly from 5etools' class table data (not
// hand-recalled) - still worth a quick cross-check against your book.
export const Barbarian: CharacterClass = {
    name: "Barbarian",
    edition: "2024",
    hitDie: 12,
    proficiencies: {
        armor: ["Light armor", "Medium armor", "Shields"],
        weapons: ["Simple weapons", "Martial weapons"],
        savingThrows: ["strength", "constitution"],
        skills: { choose: 2, from: ["Animal Handling", "Athletics", "Intimidation", "Nature", "Perception", "Survival"] },
    },
    multiclassProficiencies: {
        armor: ["Shields"],
        weapons: ["Martial weapons"],
    },
    primaryAbility: "strength",
    casterProgression: "none",
    subclassLevel: 3,
    weaponMasteryProgression: { 1: 2, 4: 3, 10: 4 },
};
