import { describe, it, expect } from "vitest";
import {
    calculateProficiencyBonus,
    getNextProficiencyBonus,
    getProficiencyBonusBreakdown,
} from "./calculateProficiencyBonus";
import { classLevel, makeCharacter } from "../../tests/fixtures/characters";
import { Fighter as Fighter2024 } from "@/data/2024/classes/Fighter";
import { Wizard as Wizard2024 } from "@/data/2024/classes/Wizard";
import { Fighter as Fighter2014 } from "@/data/2014/classes/Fighter";
import { Rogue as Rogue2014 } from "@/data/2014/classes/Rogue";

const fighterAtLevel = (level: number) => makeCharacter({ classes: [classLevel(Fighter2024, level)] });

describe("calculateProficiencyBonus", () => {
    it.each([
        [1, 2], [4, 2],
        [5, 3], [8, 3],
        [9, 4], [12, 4],
        [13, 5], [16, 5],
        [17, 6], [20, 6],
    ])("gives a level %i character +%i", (level, bonus) => {
        expect(calculateProficiencyBonus(fighterAtLevel(level))).toBe(bonus);
    });

    it("uses total level across every class when multiclassed", () => {
        const character = makeCharacter({ classes: [classLevel(Fighter2024, 3), classLevel(Wizard2024, 2)] });
        expect(calculateProficiencyBonus(character)).toBe(3);
    });

    it("is the same in the 2014 edition", () => {
        const character = makeCharacter({
            edition: "2014",
            classes: [classLevel(Fighter2014, 6), classLevel(Rogue2014, 3)],
        });
        expect(calculateProficiencyBonus(character)).toBe(4);
    });

    it("uses an explicit level instead of the character's when given", () => {
        expect(calculateProficiencyBonus(fighterAtLevel(1), 13)).toBe(5);
    });
});

describe("getNextProficiencyBonus", () => {
    it.each([
        [1, 5, 3],
        [4, 5, 3],
        [5, 9, 4],
        [8, 9, 4],
        [12, 13, 5],
        [16, 17, 6],
    ])("at level %i points to level %i for +%i", (level, nextLevel, nextBonus) => {
        expect(getNextProficiencyBonus(fighterAtLevel(level))).toEqual([
            { label: `Next level ${nextLevel}`, value: `Proficiency Bonus +${nextBonus}` },
        ]);
    });

    it("returns false once the maximum bonus is reached (levels 17-20)", () => {
        for (const level of [17, 18, 19, 20]) {
            expect(getNextProficiencyBonus(fighterAtLevel(level))).toBe(false);
        }
    });

    it("uses total multiclass level", () => {
        const character = makeCharacter({ classes: [classLevel(Fighter2024, 3), classLevel(Wizard2024, 3)] });
        expect(getNextProficiencyBonus(character)).toEqual([{ label: "Next level 9", value: "Proficiency Bonus +4" }]);
    });
});

describe("getProficiencyBonusBreakdown", () => {
    it("shows the current bonus and the next increase", () => {
        expect(getProficiencyBonusBreakdown(fighterAtLevel(3))).toEqual([
            { label: "Level 3", value: "Proficiency Bonus +2" },
            { label: "Next level 5", value: "Proficiency Bonus +3" },
        ]);
    });

    it("shows only the current bonus when there is no further increase", () => {
        expect(getProficiencyBonusBreakdown(fighterAtLevel(20))).toEqual([
            { label: "Level 20", value: "Proficiency Bonus +6" },
        ]);
    });
});
