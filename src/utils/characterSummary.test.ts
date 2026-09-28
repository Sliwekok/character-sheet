import { describe, it, expect } from "vitest";
import { toCharacterSummary } from "./characterSummary";
import { armor, classLevel, makeStoredCharacter } from "../../tests/fixtures/characters";
import { Fighter as Fighter2024 } from "@/data/2024/classes/Fighter";
import { Wizard as Wizard2024 } from "@/data/2024/classes/Wizard";

describe("toCharacterSummary", () => {
    it("derives the card's fields from a stored character", () => {
        const character = makeStoredCharacter({
            name: "Aria",
            alignment: "Chaotic Good",
            initiative: 2,
            classes: [classLevel(Fighter2024, 3), classLevel(Wizard2024, 2)],
            abilityScores: { strength: 16, dexterity: 14, constitution: 12, intelligence: 13, wisdom: 8, charisma: 10 },
            armors: [armor("Chain Mail", { equipped: true }), armor("Shield", { equipped: true })],
        });
        expect(toCharacterSummary(character)).toEqual({
            id: character.id,
            name: "Aria",
            level: 5,
            alignment: "Chaotic Good",
            className: "Fighter / Wizard",
            armorClass: 18,
            initiative: 2,
            abilityModifiers: { strength: 3, dexterity: 2, constitution: 1, intelligence: 1, wisdom: -1, charisma: 0 },
        });
    });

    it("shows a single class name without a separator", () => {
        expect(toCharacterSummary(makeStoredCharacter()).className).toBe("Fighter");
    });

    it("uses unarmored AC when nothing is worn", () => {
        expect(toCharacterSummary(makeStoredCharacter()).armorClass).toBe(10);
    });
});
