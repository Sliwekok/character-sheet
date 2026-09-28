import { describe, it, expect } from "vitest";
import { calculateAbilityModifiers } from "./abilityModifiers";
import type { AbilityScores } from "@/interfaces/Characters";

const allScores = (score: number): AbilityScores => ({
    strength: score,
    dexterity: score,
    constitution: score,
    intelligence: score,
    wisdom: score,
    charisma: score,
});

describe("calculateAbilityModifiers", () => {
    it.each([
        [1, -5],
        [3, -4],
        [7, -2],
        [8, -1],
        [9, -1],
        [10, 0],
        [11, 0],
        [12, 1],
        [13, 1],
        [15, 2],
        [18, 4],
        [20, 5],
        [30, 10],
    ])("gives a score of %i a modifier of %i", (score, modifier) => {
        expect(calculateAbilityModifiers(allScores(score)).strength).toBe(modifier);
    });

    it("computes each ability independently", () => {
        expect(
            calculateAbilityModifiers({ strength: 16, dexterity: 14, constitution: 13, intelligence: 10, wisdom: 8, charisma: 5 })
        ).toEqual({ strength: 3, dexterity: 2, constitution: 1, intelligence: 0, wisdom: -1, charisma: -3 });
    });

    it("returns exactly the six ability keys", () => {
        expect(Object.keys(calculateAbilityModifiers(allScores(10))).sort()).toEqual(
            ["charisma", "constitution", "dexterity", "intelligence", "strength", "wisdom"]
        );
    });
});
