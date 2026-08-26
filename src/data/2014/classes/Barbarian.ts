import { CharacterClass } from "@/interfaces/CharacterClass";

export const Barbarian: CharacterClass = {
    name: "Barbarian",
    edition: "2014",
    hitDie: 12,
    proficiencies: {
        armor: ["Light armor", "Medium armor", "Shields"],
        weapons: ["Simple weapons", "Martial weapons"],
        savingThrows: ["strength", "constitution"],
        skills: { choose: 2, from: ["Animal Handling", "Athletics", "Intimidation", "Nature", "Perception", "Survival"] },
    },
    multiclassProficiencies: {
        armor: ["Shields"],
        weapons: ["Simple weapons", "Martial weapons"],
    },
    primaryAbility: "strength",
    casterProgression: "none",
    subclassLevel: 3,
};
