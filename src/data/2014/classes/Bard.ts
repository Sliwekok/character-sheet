import { CharacterClass } from "@/interfaces/CharacterClass";
import { fullCasterProgression } from "@/interfaces/SpellSlotsProgression";

export const Bard: CharacterClass = {
    name: "Bard",
    edition: "2014",
    hitDie: 8,
    proficiencies: {
        armor: ["Light armor"],
        weapons: ["Simple weapons", "Hand crossbows", "Longswords", "Rapiers", "Shortswords"],
        tools: ["Three musical instruments of your choice"],
        savingThrows: ["dexterity", "charisma"],
        skills: { choose: 1, from: [] },
    },
    multiclassProficiencies: {
        armor: ["Light armor"],
        tools: ["One musical instrument of your choice"],
        skills: { choose: 1, from: [
            "Athletics",
            "Acrobatics",
            "Sleight of Hand",
            "Stealth",
            "Arcana",
            "History",
            "Investigation",
            "Nature",
            "Religion",
            "Animal Handling",
            "Insight",
            "Medicine",
            "Perception",
            "Survival",
            "Deception",
            "Intimidation",
            "Performance",
            "Persuasion",
        ] },
    },
    primaryAbility: "charisma",
    casterProgression: "full",
    spellcasting: {
        ability: "charisma",
        preparation: "known",
        ritualCasting: true,
        progression: fullCasterProgression,
    },
    subclassLevel: 3,
};
