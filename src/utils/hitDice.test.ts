import { describe, it, expect, vi } from "vitest";
import {
    applyCurrentHp,
    formatHitDicePools,
    getHitDicePools,
    getSheetMaxHp,
    hitDiceAfterLongRest,
    parseHpInput,
    spendHitDice,
} from "./hitDice";
import { classLevel, makeCharacter } from "../../tests/fixtures/characters";
import type { Character } from "@/interfaces/Characters";
import type { Edition } from "@/interfaces/Edition";
import { Fighter as Fighter2024 } from "@/data/2024/classes/Fighter";
import { Paladin as Paladin2024 } from "@/data/2024/classes/Paladin";
import { Wizard as Wizard2024 } from "@/data/2024/classes/Wizard";
import { Barbarian as Barbarian2024 } from "@/data/2024/classes/Barbarian";
import { Fighter as Fighter2014 } from "@/data/2014/classes/Fighter";
import { Wizard as Wizard2014 } from "@/data/2014/classes/Wizard";
import { Rogue as Rogue2014 } from "@/data/2014/classes/Rogue";

/** The Math.random() value that makes `rollDie(sides)` land on `face`. */
const face = (value: number, sides: number) => (value - 0.5) / sides;

function queueRandom(...values: number[]) {
    const spy = vi.spyOn(Math, "random");
    for (const value of values) spy.mockReturnValueOnce(value);
    return spy;
}

/** Fighter 3 / Paladin 2 / Wizard 1 (2024): 5d10 + 1d6. */
function multiclass(overrides: Partial<Character> = {}): Character {
    return makeCharacter({
        classes: [classLevel(Fighter2024, 3), classLevel(Paladin2024, 2), classLevel(Wizard2024, 1)],
        ...overrides,
    });
}

function withExpended(character: Character, expendedHitDice: Record<number, number>): Character {
    return { ...character, details: { ...character.details, expendedHitDice } };
}

function withCon(constitution: number, overrides: Partial<Character> = {}): Character {
    const base = makeCharacter(overrides);
    return { ...base, abilityScores: { ...base.abilityScores, constitution } };
}

describe("getHitDicePools", () => {
    it("gives a single-class character one pool equal to their level", () => {
        const character = makeCharacter({ classes: [classLevel(Fighter2024, 4)] });
        expect(getHitDicePools(character)).toEqual([{ hitDie: 10, total: 4, expended: 0, remaining: 4 }]);
    });

    it("groups dice by size across classes, largest die first", () => {
        const character = makeCharacter({
            classes: [classLevel(Wizard2024, 1), classLevel(Fighter2024, 3), classLevel(Barbarian2024, 2), classLevel(Paladin2024, 2)],
        });
        expect(getHitDicePools(character)).toEqual([
            { hitDie: 12, total: 2, expended: 0, remaining: 2 },
            { hitDie: 10, total: 5, expended: 0, remaining: 5 },
            { hitDie: 6, total: 1, expended: 0, remaining: 1 },
        ]);
    });

    it("subtracts expended dice per die size", () => {
        expect(getHitDicePools(withExpended(multiclass(), { 10: 2, 6: 1 }))).toEqual([
            { hitDie: 10, total: 5, expended: 2, remaining: 3 },
            { hitDie: 6, total: 1, expended: 1, remaining: 0 },
        ]);
    });

    it("clamps a stale expended count to 0..total", () => {
        expect(getHitDicePools(withExpended(multiclass(), { 10: 99, 6: -3 }))).toEqual([
            { hitDie: 10, total: 5, expended: 5, remaining: 0 },
            { hitDie: 6, total: 1, expended: 0, remaining: 1 },
        ]);
    });

    it("ignores expended dice of a size the character no longer has", () => {
        const pools = getHitDicePools(withExpended(makeCharacter(), { 8: 3 }));
        expect(pools).toEqual([{ hitDie: 10, total: 1, expended: 0, remaining: 1 }]);
    });
});

describe("formatHitDicePools", () => {
    const pools = getHitDicePools(withExpended(multiclass(), { 10: 2 }));

    it("shows remaining dice by default", () => {
        expect(formatHitDicePools(pools)).toBe("3d10 + 1d6");
    });

    it("shows totals on request", () => {
        expect(formatHitDicePools(pools, "total")).toBe("5d10 + 1d6");
    });

    it("keeps a fully spent pool as 0dN", () => {
        expect(formatHitDicePools(getHitDicePools(withExpended(makeCharacter(), { 10: 1 })))).toBe("0d10");
    });

    it("returns an empty string for no pools", () => {
        expect(formatHitDicePools([])).toBe("");
    });
});

describe("getSheetMaxHp", () => {
    it("matches the Max HP breakdown (level-1 Fighter with Con 10 has 10)", () => {
        expect(getSheetMaxHp(makeCharacter())).toBe(10);
    });
});

describe("applyCurrentHp", () => {
    // A level-1 Fighter with Con 10 has 10 max HP.
    it("sets HP within 0..max", () => {
        expect(applyCurrentHp(makeCharacter({ currentHP: 10 }), 6).currentHP).toBe(6);
    });

    it("clamps to max HP", () => {
        expect(applyCurrentHp(makeCharacter({ currentHP: 5 }), 25).currentHP).toBe(10);
    });

    it("uses the computed max HP, not a stale stored maxHP", () => {
        expect(applyCurrentHp(makeCharacter({ currentHP: 5, maxHP: 40 }), 25).currentHP).toBe(10);
    });

    it("clamps to 0", () => {
        expect(applyCurrentHp(makeCharacter({ currentHP: 5 }), -12).currentHP).toBe(0);
    });

    it("rounds fractional HP", () => {
        expect(applyCurrentHp(makeCharacter({ currentHP: 5 }), 4.6).currentHP).toBe(5);
        expect(applyCurrentHp(makeCharacter({ currentHP: 5 }), 4.4).currentHP).toBe(4);
    });

    it("resets death saves when healed from 0, keeping other details", () => {
        const character = makeCharacter({
            currentHP: 0,
            details: { inspiration: true, deathSaves: { successes: 2, failures: 1 }, expendedHitDice: { 10: 1 } },
        });
        expect(applyCurrentHp(character, 3)).toEqual({
            currentHP: 3,
            details: { inspiration: true, deathSaves: { successes: 0, failures: 0 }, expendedHitDice: { 10: 1 } },
        });
    });

    it("resets death saves when healed from 0 even with no details yet", () => {
        expect(applyCurrentHp(makeCharacter({ currentHP: 0 }), 1).details).toEqual({ deathSaves: { successes: 0, failures: 0 } });
    });

    it("leaves death saves alone when staying at 0", () => {
        const details = { deathSaves: { successes: 1, failures: 2 } };
        expect(applyCurrentHp(makeCharacter({ currentHP: 0, details }), 0).details).toBe(details);
        expect(applyCurrentHp(makeCharacter({ currentHP: 0, details }), -5).details).toBe(details);
    });

    it("leaves details untouched when HP changes above 0", () => {
        const details = { deathSaves: { successes: 1, failures: 0 } };
        expect(applyCurrentHp(makeCharacter({ currentHP: 7, details }), 2).details).toBe(details);
    });

    it("leaves details untouched when dropping to 0", () => {
        const details = { inspiration: true };
        expect(applyCurrentHp(makeCharacter({ currentHP: 4, details }), 0)).toEqual({ currentHP: 0, details });
    });
});

describe("parseHpInput", () => {
    it("treats a bare number as an absolute value", () => {
        expect(parseHpInput("17", 5)).toBe(17);
        expect(parseHpInput("0", 5)).toBe(0);
    });

    it("treats a leading minus as damage", () => {
        expect(parseHpInput("-8", 20)).toBe(12);
    });

    it("treats a leading plus as healing", () => {
        expect(parseHpInput("+5", 20)).toBe(25);
    });

    it("tolerates surrounding whitespace and a space after the sign", () => {
        expect(parseHpInput("  12 ", 3)).toBe(12);
        expect(parseHpInput(" + 5", 3)).toBe(8);
        expect(parseHpInput("- 2", 3)).toBe(1);
    });

    it("can go below zero (clamping is applyCurrentHp's job)", () => {
        expect(parseHpInput("-30", 10)).toBe(-20);
    });

    it("returns null for anything that isn't a whole number", () => {
        for (const text of ["", "   ", "abc", "5.5", "--5", "+-5", "5+", "1e3", "12 hp"]) {
            expect(parseHpInput(text, 10)).toBeNull();
        }
    });
});

describe("hitDiceAfterLongRest", () => {
    const fighter = (edition: Edition, level: number) =>
        makeCharacter({ edition, classes: [classLevel(edition === "2014" ? Fighter2014 : Fighter2024, level)] });

    describe("2024 rules", () => {
        it("recovers every spent Hit Die", () => {
            expect(hitDiceAfterLongRest(withExpended(fighter("2024", 10), { 10: 10 }))).toEqual({});
            expect(hitDiceAfterLongRest(withExpended(multiclass(), { 10: 5, 6: 1 }))).toEqual({});
        });
    });

    describe("2014 rules", () => {
        it("recovers up to half the character's total Hit Dice", () => {
            expect(hitDiceAfterLongRest(withExpended(fighter("2014", 5), { 10: 5 }))).toEqual({ 10: 3 });
            expect(hitDiceAfterLongRest(withExpended(fighter("2014", 8), { 10: 6 }))).toEqual({ 10: 2 });
        });

        it("recovers everything when fewer than half were spent", () => {
            expect(hitDiceAfterLongRest(withExpended(fighter("2014", 8), { 10: 3 }))).toEqual({});
        });

        it("recovers at least one die, even at level 1", () => {
            expect(hitDiceAfterLongRest(withExpended(fighter("2014", 1), { 10: 1 }))).toEqual({});
            expect(hitDiceAfterLongRest(withExpended(fighter("2014", 3), { 10: 3 }))).toEqual({ 10: 2 });
        });

        it("returns nothing spent when nothing was spent", () => {
            expect(hitDiceAfterLongRest(fighter("2014", 6))).toEqual({});
        });

        it("recovers the largest dice first when multiclassed", () => {
            // Fighter 3 (d10) / Wizard 3 (d6): 6 dice, so 3 come back.
            const character = makeCharacter({
                edition: "2014",
                classes: [classLevel(Fighter2014, 3), classLevel(Wizard2014, 3)],
            });
            expect(hitDiceAfterLongRest(withExpended(character, { 10: 2, 6: 3 }))).toEqual({ 6: 2 });
            expect(hitDiceAfterLongRest(withExpended(character, { 10: 3, 6: 3 }))).toEqual({ 6: 3 });
        });

        it("budgets across the total of all classes, rounding down", () => {
            // Fighter 2 (d10) / Rogue 3 (d8): 5 dice, so floor(5/2) = 2 come back.
            const character = makeCharacter({
                edition: "2014",
                classes: [classLevel(Fighter2014, 2), classLevel(Rogue2014, 3)],
            });
            expect(hitDiceAfterLongRest(withExpended(character, { 10: 1, 8: 3 }))).toEqual({ 8: 2 });
        });
    });
});

describe("spendHitDice", () => {
    it("heals each die's roll plus the Con modifier and records the spent dice", () => {
        // Con 14 (+2), Fighter 3: rolls of 6 and 3.
        const character = withCon(14, { classes: [classLevel(Fighter2024, 3)] });
        queueRandom(face(6, 10), face(3, 10));
        expect(spendHitDice(character, { 10: 2 })).toEqual({
            roll: { formula: "2d10+4", rolls: [6, 3], diceTotal: 9, modifier: 4, total: 13 },
            healed: 13,
            expendedHitDice: { 10: 2 },
        });
    });

    it("omits the Con part of the formula when the modifier is 0", () => {
        const character = makeCharacter({ classes: [classLevel(Fighter2024, 2)] });
        queueRandom(face(7, 10));
        expect(spendHitDice(character, { 10: 1 })).toMatchObject({
            roll: { formula: "1d10", rolls: [7], modifier: 0, total: 7 },
            healed: 7,
        });
    });

    it("never lets a single die heal less than 0 with a low Con", () => {
        // Con 3 (-4): a 1 would be -3, clamped to 0; a 10 heals 6.
        const character = withCon(3, { classes: [classLevel(Fighter2024, 2)] });
        queueRandom(face(1, 10), face(10, 10));
        expect(spendHitDice(character, { 10: 2 })).toEqual({
            roll: { formula: "2d10-8", rolls: [1, 10], diceTotal: 11, modifier: -5, total: 6 },
            healed: 6,
            expendedHitDice: { 10: 2 },
        });
    });

    it("heals 0 (not negative) when every die is floored", () => {
        const character = withCon(1, { classes: [classLevel(Fighter2024, 1)] });
        queueRandom(face(4, 10));
        expect(spendHitDice(character, { 10: 1 })).toMatchObject({ healed: 0, roll: { total: 0, diceTotal: 4, modifier: -4 } });
    });

    it("clamps the request to the dice still remaining", () => {
        const character = withExpended(makeCharacter({ classes: [classLevel(Fighter2024, 3)] }), { 10: 2 });
        queueRandom(face(5, 10));
        const result = spendHitDice(character, { 10: 5 });
        expect(result?.roll.rolls).toEqual([5]);
        expect(result?.expendedHitDice).toEqual({ 10: 3 });
    });

    it("spends several die sizes in one go, largest first, adding Con once per die", () => {
        const character = withCon(12, {
            classes: [classLevel(Wizard2024, 1), classLevel(Fighter2024, 2)],
        });
        queueRandom(face(8, 10), face(2, 10), face(4, 6));
        expect(spendHitDice(character, { 6: 1, 10: 2 })).toEqual({
            roll: { formula: "2d10+1d6+3", rolls: [8, 2, 4], diceTotal: 14, modifier: 3, total: 17 },
            healed: 17,
            expendedHitDice: { 10: 2, 6: 1 },
        });
    });

    it("keeps already-expended dice of sizes it didn't spend", () => {
        const character = withExpended(multiclass(), { 6: 1 });
        queueRandom(face(10, 10));
        expect(spendHitDice(character, { 10: 1 })?.expendedHitDice).toEqual({ 6: 1, 10: 1 });
    });

    it("rounds fractional requests down", () => {
        const character = makeCharacter({ classes: [classLevel(Fighter2024, 3)] });
        queueRandom(face(5, 10));
        expect(spendHitDice(character, { 10: 1.9 })?.roll.rolls).toEqual([5]);
    });

    it("returns null when nothing is actually spent", () => {
        const character = makeCharacter({ classes: [classLevel(Fighter2024, 3)] });
        expect(spendHitDice(character, {})).toBeNull();
        expect(spendHitDice(character, { 10: 0 })).toBeNull();
        expect(spendHitDice(character, { 10: -2 })).toBeNull();
        expect(spendHitDice(character, { 8: 2 })).toBeNull();
        expect(spendHitDice(withExpended(character, { 10: 3 }), { 10: 1 })).toBeNull();
    });

    it("does not mutate the character's stored expended dice", () => {
        const character = withExpended(makeCharacter({ classes: [classLevel(Fighter2024, 3)] }), { 10: 1 });
        queueRandom(face(5, 10));
        spendHitDice(character, { 10: 1 });
        expect(character.details?.expendedHitDice).toEqual({ 10: 1 });
    });
});
