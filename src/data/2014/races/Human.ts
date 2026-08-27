import { Race } from "@/interfaces/Race";

/**
 * Hand-authored rather than generated, like the rest of this file's
 * siblings under 2014/ - see the header comment in 2014/races/Races.ts:
 * 5etools' own data is missing an `ability` field for PHB Human entirely,
 * so it can't be reliably auto-converted.
 *
 * This file was referenced by data/index.ts (`import { Human as Human2014 }
 * from "./2014/races/Human"`) but didn't actually exist on disk - the
 * import was broken and the project failed to compile. Filled in here.
 */
export const Human: Race = {
    name: "Human",
    edition: "2014",
    traits: [
        "Age: Humans reach adulthood in their late teens and live less than a century.",
        "Size: Humans vary widely in height and build, from barely 5 feet to well over 6 feet tall. Your size is Medium.",
        "Speed: Your base walking speed is 30 feet.",
        "Ability Score Increase: Each of your ability scores increases by 1.",
        "Languages: You can speak, read, and write Common and one extra language of your choice.",
    ],
    abilityModifiers: {
        strength: 1,
        dexterity: 1,
        constitution: 1,
        intelligence: 1,
        wisdom: 1,
        charisma: 1,
    },
    speed: 30,
    languages: ["Common"],
};
