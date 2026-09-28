import { describe, it, expect } from "vitest";
import {
    averageHitDieValue,
    buildHpHistory,
    calculateMaxHP,
    getMaxHpBreakdown,
    rollsNeededForClassEntry,
} from "./calculateMaxHp";
import { classLevel, makeCharacter } from "../../tests/fixtures/characters";
import type { Character } from "@/interfaces/Characters";
import type { HpLevelEntry } from "@/interfaces/Hp";
import { Fighter as Fighter2024 } from "@/data/2024/classes/Fighter";
import { Wizard as Wizard2024 } from "@/data/2024/classes/Wizard";
import { Barbarian as Barbarian2024 } from "@/data/2024/classes/Barbarian";
import { Fighter as Fighter2014 } from "@/data/2014/classes/Fighter";
import { Wizard as Wizard2014 } from "@/data/2014/classes/Wizard";

function withCon(constitution: number, overrides: Partial<Character> = {}): Character {
    const base = makeCharacter(overrides);
    return { ...base, abilityScores: { ...base.abilityScores, constitution } };
}

const hpGains = (history: HpLevelEntry[]) => history.map((entry) => entry.hpGained);

describe("averageHitDieValue", () => {
    it.each([
        [6, 4],
        [8, 5],
        [10, 6],
        [12, 7],
    ])("averages a d%i to %i", (die, average) => {
        expect(averageHitDieValue(die)).toBe(average);
    });
});

describe("rollsNeededForClassEntry", () => {
    it("skips the very first level of the first class taken", () => {
        expect(rollsNeededForClassEntry(1, true)).toBe(0);
        expect(rollsNeededForClassEntry(5, true)).toBe(4);
    });

    it("needs a roll for every level of a later class", () => {
        expect(rollsNeededForClassEntry(1, false)).toBe(1);
        expect(rollsNeededForClassEntry(3, false)).toBe(3);
    });

    it("never goes negative", () => {
        expect(rollsNeededForClassEntry(0, true)).toBe(0);
        expect(rollsNeededForClassEntry(0, false)).toBe(0);
    });
});

describe("buildHpHistory", () => {
    it("uses the max hit die at first level and the average afterwards", () => {
        const history = buildHpHistory([{ hitDie: 10, level: 3, hpMethod: "average" }], 2);
        expect(hpGains(history)).toEqual([12, 8, 8]);
        expect(history[0]).toEqual({
            classIndex: 0,
            levelInClass: 1,
            isFirstLevel: true,
            method: "average",
            hitDie: 10,
            dieValue: 10,
            roll: undefined,
            conModifier: 2,
            hpGained: 12,
        });
        expect(history[1]).toMatchObject({ levelInClass: 2, isFirstLevel: false, dieValue: 6, roll: undefined });
    });

    it("uses pre-rolled values for later levels with the roll method", () => {
        const history = buildHpHistory([{ hitDie: 10, level: 3, hpMethod: "roll", rolls: [3, 9] }], 1);
        expect(history.map((entry) => entry.dieValue)).toEqual([10, 3, 9]);
        expect(hpGains(history)).toEqual([11, 4, 10]);
        expect(history[0]).toMatchObject({ method: "average", roll: undefined });
        expect(history[1]).toMatchObject({ method: "roll", roll: 3 });
        expect(history[2]).toMatchObject({ method: "roll", roll: 9 });
    });

    it("falls back to the average for a missing roll", () => {
        const history = buildHpHistory([{ hitDie: 8, level: 3, hpMethod: "roll", rolls: [2] }], 0);
        expect(history.map((entry) => entry.dieValue)).toEqual([8, 2, 5]);
        expect(history[2]).toMatchObject({ method: "roll", roll: 5 });
    });

    it("ignores rolls when the method is average", () => {
        const history = buildHpHistory([{ hitDie: 8, level: 2, hpMethod: "average", rolls: [1] }], 0);
        expect(history[1]).toMatchObject({ dieValue: 5, roll: undefined, method: "average" });
    });

    it("never treats a later class's level 1 as the first level", () => {
        const history = buildHpHistory(
            [
                { hitDie: 10, level: 1, hpMethod: "average" },
                { hitDie: 6, level: 2, hpMethod: "average" },
            ],
            0
        );
        expect(history.map((entry) => [entry.classIndex, entry.levelInClass, entry.isFirstLevel, entry.dieValue])).toEqual([
            [0, 1, true, 10],
            [1, 1, false, 4],
            [1, 2, false, 4],
        ]);
    });

    it("uses a later class's rolls starting from its own level 1", () => {
        const history = buildHpHistory(
            [
                { hitDie: 10, level: 2, hpMethod: "roll", rolls: [7] },
                { hitDie: 6, level: 2, hpMethod: "roll", rolls: [1, 6] },
            ],
            0
        );
        expect(history.map((entry) => entry.dieValue)).toEqual([10, 7, 1, 6]);
    });

    it("grants at least 1 HP per level with a very low Con modifier", () => {
        const history = buildHpHistory([{ hitDie: 6, level: 3, hpMethod: "roll", rolls: [1, 6] }], -5);
        expect(hpGains(history)).toEqual([1, 1, 1]);
    });

    it("returns an empty history for no classes", () => {
        expect(buildHpHistory([], 3)).toEqual([]);
    });
});

describe("calculateMaxHP", () => {
    it("gives a level-1 Fighter with Con 10 their full hit die", () => {
        expect(calculateMaxHP(makeCharacter())).toBe(10);
    });

    it("adds the Con modifier (not score) per level - 2014 Fighter 5 with Con 16", () => {
        const character = withCon(16, { edition: "2014", classes: [classLevel(Fighter2014, 5)] });
        // 10 + 3, then 4 x (6 + 3)
        expect(calculateMaxHP(character)).toBe(49);
    });

    it("handles a multiclass character (2024 Fighter 1 / Wizard 2, Con 14)", () => {
        const character = withCon(14, { classes: [classLevel(Fighter2024, 1), classLevel(Wizard2024, 2)] });
        // 10 + 2, then 2 x (4 + 2)
        expect(calculateMaxHP(character)).toBe(24);
    });

    it("uses the first listed class's hit die for first level", () => {
        const wizardFirst = withCon(10, { edition: "2014", classes: [classLevel(Wizard2014, 1), classLevel(Fighter2014, 1)] });
        // 6, then 6 (d10 average)
        expect(calculateMaxHP(wizardFirst)).toBe(12);
    });

    it("applies a negative Con modifier to every level", () => {
        const character = withCon(8, { classes: [classLevel(Barbarian2024, 3)] });
        // 12 - 1, then 2 x (7 - 1)
        expect(calculateMaxHP(character)).toBe(23);
    });

    it("treats a class entry with the roll method but no rolls as average", () => {
        const character = makeCharacter({ classes: [classLevel(Fighter2024, 3, { hpMethod: "roll" })] });
        expect(calculateMaxHP(character)).toBe(22);
    });

    it("sums a stored hpHistory instead of recomputing it", () => {
        const hpHistory = buildHpHistory([{ hitDie: 10, level: 3, hpMethod: "roll", rolls: [2, 3] }], 0);
        const character = makeCharacter({ classes: [classLevel(Fighter2024, 3)], hpHistory });
        expect(calculateMaxHP(character)).toBe(15);
    });

    it("is always equal to the breakdown's total", () => {
        const character = withCon(15, { classes: [classLevel(Fighter2024, 4), classLevel(Wizard2024, 3)] });
        expect(calculateMaxHP(character)).toBe(getMaxHpBreakdown(character).total);
    });
});

describe("getMaxHpBreakdown", () => {
    it("lists one line per level and a final Max HP line", () => {
        const character = withCon(14, { classes: [classLevel(Fighter2024, 2)] });
        expect(getMaxHpBreakdown(character)).toEqual({
            lines: [
                { label: "Fighter level 1 (first level - max hit die)", value: "10 + 2 = 12" },
                { label: "Fighter level 2 (average of d10)", value: "6 + 2 = 8" },
                { label: "Max HP", value: "20" },
            ],
            total: 20,
        });
    });

    it("labels rolled levels and each class by name", () => {
        const hpHistory = buildHpHistory(
            [
                { hitDie: 10, level: 1, hpMethod: "average" },
                { hitDie: 6, level: 1, hpMethod: "roll", rolls: [3] },
            ],
            -1
        );
        const character = makeCharacter({ classes: [classLevel(Fighter2024, 1), classLevel(Wizard2024, 1)], hpHistory });
        expect(getMaxHpBreakdown(character).lines).toEqual([
            { label: "Fighter level 1 (first level - max hit die)", value: "10 - 1 = 9" },
            { label: "Wizard level 1 (rolled d6)", value: "3 - 1 = 2" },
            { label: "Max HP", value: "11" },
        ]);
    });

    it("shows the 1 HP minimum when a level would grant less", () => {
        const character = withCon(1, { classes: [classLevel(Wizard2024, 2)] });
        expect(getMaxHpBreakdown(character).lines).toEqual([
            { label: "Wizard level 1 (first level - max hit die)", value: "6 - 5 = 1" },
            { label: "Wizard level 2 (average of d6)", value: "4 - 5 = -1 → 1" },
            { label: "Max HP", value: "2" },
        ]);
    });

    it("falls back to a generic class name when a history entry's class is gone", () => {
        const hpHistory = buildHpHistory(
            [
                { hitDie: 10, level: 1, hpMethod: "average" },
                { hitDie: 6, level: 1, hpMethod: "average" },
            ],
            0
        );
        const character = makeCharacter({ classes: [classLevel(Fighter2024, 1)], hpHistory });
        expect(getMaxHpBreakdown(character).lines[1]).toEqual({ label: "Class 2 level 1 (average of d6)", value: "4 + 0 = 4" });
    });

    it("shows just a zero total for an empty history", () => {
        expect(getMaxHpBreakdown(makeCharacter({ hpHistory: [] }))).toEqual({ lines: [{ label: "Max HP", value: "0" }], total: 0 });
    });
});
