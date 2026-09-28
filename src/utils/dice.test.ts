import { describe, it, expect, vi } from "vitest";
import {
    addParsedDice,
    describeDiceRoll,
    findDiceNotation,
    formatParsedDice,
    parseDiceExpression,
    pickRandom,
    pickRandomN,
    randomAbilityScores,
    roll4d6DropLowest,
    rollAbilityScoreSet,
    rollD20,
    rollDiceFormula,
    rollDie,
    rollParsedDice,
    type DiceRollResult,
} from "./dice";

/** The Math.random() value that makes `rollDie(sides)` land on `face`. */
const face = (value: number, sides: number) => (value - 0.5) / sides;

/** Queues Math.random() results, one per call, in order. */
function queueRandom(...values: number[]) {
    const spy = vi.spyOn(Math, "random");
    for (const value of values) spy.mockReturnValueOnce(value);
    return spy;
}

/** Queues die faces for dice that all have the same number of sides. */
function queueFaces(sides: number, ...faces: number[]) {
    return queueRandom(...faces.map((value) => face(value, sides)));
}

describe("rollDie", () => {
    it("maps the lowest random value to 1 and the highest to the die's size", () => {
        queueRandom(0, 0.999999);
        expect(rollDie(20)).toBe(1);
        expect(rollDie(20)).toBe(20);
    });

    it("rolls every face of a d6 for evenly spaced random values", () => {
        queueFaces(6, 1, 2, 3, 4, 5, 6);
        expect(Array.from({ length: 6 }, () => rollDie(6))).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it("always stays within 1..sides with real randomness", () => {
        for (let i = 0; i < 200; i++) {
            const roll = rollDie(8);
            expect(roll).toBeGreaterThanOrEqual(1);
            expect(roll).toBeLessThanOrEqual(8);
            expect(Number.isInteger(roll)).toBe(true);
        }
    });
});

describe("roll4d6DropLowest", () => {
    it("sums the three highest of four d6", () => {
        queueFaces(6, 1, 6, 3, 5);
        expect(roll4d6DropLowest()).toBe(14);
    });

    it("drops only one die when the lowest is tied", () => {
        queueFaces(6, 2, 2, 2, 2);
        expect(roll4d6DropLowest()).toBe(6);
    });

    it("gives 18 for four sixes and 3 for four ones", () => {
        queueFaces(6, 6, 6, 6, 6, 1, 1, 1, 1);
        expect(roll4d6DropLowest()).toBe(18);
        expect(roll4d6DropLowest()).toBe(3);
    });
});

describe("rollAbilityScoreSet", () => {
    it("returns six scores between 3 and 18", () => {
        const set = rollAbilityScoreSet();
        expect(set).toHaveLength(6);
        for (const score of set) {
            expect(score).toBeGreaterThanOrEqual(3);
            expect(score).toBeLessThanOrEqual(18);
        }
    });
});

describe("randomAbilityScores", () => {
    it("assigns a 3-18 score to each of the six abilities", () => {
        const scores = randomAbilityScores();
        expect(Object.keys(scores).sort()).toEqual(
            ["charisma", "constitution", "dexterity", "intelligence", "strength", "wisdom"]
        );
        for (const score of Object.values(scores)) {
            expect(score).toBeGreaterThanOrEqual(3);
            expect(score).toBeLessThanOrEqual(18);
        }
    });
});

describe("pickRandom", () => {
    it("picks the element the random value points at", () => {
        const items = ["a", "b", "c", "d"];
        queueRandom(0, 0.5, 0.99);
        expect(pickRandom(items)).toBe("a");
        expect(pickRandom(items)).toBe("c");
        expect(pickRandom(items)).toBe("d");
    });

    it("throws on an empty list", () => {
        expect(() => pickRandom([])).toThrow(/empty list/);
    });
});

describe("pickRandomN", () => {
    const items = [1, 2, 3, 4, 5];

    it("returns the requested number of distinct elements from the list", () => {
        const picked = pickRandomN(items, 3);
        expect(picked).toHaveLength(3);
        expect(new Set(picked).size).toBe(3);
        for (const item of picked) expect(items).toContain(item);
    });

    it("clamps a count larger than the list to the whole list", () => {
        expect(pickRandomN(items, 10).sort()).toEqual(items);
    });

    it("returns nothing for a zero or negative count, or an empty list", () => {
        expect(pickRandomN(items, 0)).toEqual([]);
        expect(pickRandomN(items, -2)).toEqual([]);
        expect(pickRandomN([], 3)).toEqual([]);
    });

    it("does not mutate the input list", () => {
        const input = [1, 2, 3, 4, 5];
        pickRandomN(input, 5);
        expect(input).toEqual([1, 2, 3, 4, 5]);
    });
});

describe("rollDiceFormula", () => {
    it("rolls NdM and sums the dice", () => {
        queueFaces(6, 4, 6);
        expect(rollDiceFormula("2d6")).toEqual({ formula: "2d6", rolls: [4, 6], diceTotal: 10, modifier: 0, total: 10 });
    });

    it("applies an embedded +K or -K modifier", () => {
        queueFaces(8, 5, 5);
        expect(rollDiceFormula("1d8+3")).toMatchObject({ rolls: [5], diceTotal: 5, modifier: 3, total: 8 });
        expect(rollDiceFormula("1d8-2")).toMatchObject({ rolls: [5], diceTotal: 5, modifier: -2, total: 3 });
    });

    it("adds an extra modifier on top of the embedded one", () => {
        queueFaces(8, 5);
        expect(rollDiceFormula("1d8+1", 3)).toMatchObject({ diceTotal: 5, modifier: 4, total: 9 });
    });

    it("tolerates whitespace and an uppercase D", () => {
        queueFaces(10, 7);
        const result = rollDiceFormula("  1 D 10 + 2 ");
        expect(result).toMatchObject({ rolls: [7], modifier: 2, total: 9 });
        expect(result.formula).toBe("  1 D 10 + 2 ");
    });

    it("treats a bare flat number as a single fixed 'roll'", () => {
        const random = vi.spyOn(Math, "random");
        expect(rollDiceFormula("1", 3)).toEqual({ formula: "1", rolls: [1], diceTotal: 1, modifier: 3, total: 4 });
        expect(random).not.toHaveBeenCalled();
    });

    it("falls back to a dice-less result for text it can't parse", () => {
        for (const garbage of ["", "fire damage", "1d8+1d6", "d20", "2d6 + x"]) {
            expect(rollDiceFormula(garbage, 2)).toEqual({ formula: garbage, rolls: [], diceTotal: 0, modifier: 2, total: 2 });
        }
    });

    it("keeps every die in the order rolled", () => {
        queueFaces(4, 1, 2, 3, 4);
        expect(rollDiceFormula("4d4").rolls).toEqual([1, 2, 3, 4]);
    });
});

describe("parseDiceExpression", () => {
    it("parses a single dice group", () => {
        expect(parseDiceExpression("8d6")).toEqual({ groups: [{ count: 8, sides: 6 }], flat: 0 });
    });

    it("parses dice plus a flat modifier", () => {
        expect(parseDiceExpression("1d4+1")).toEqual({ groups: [{ count: 1, sides: 4 }], flat: 1 });
        expect(parseDiceExpression("1d4-1")).toEqual({ groups: [{ count: 1, sides: 4 }], flat: -1 });
    });

    it("parses several dice groups and sums every flat term", () => {
        expect(parseDiceExpression("2d8 + 1d6 + 3 - 1")).toEqual({
            groups: [{ count: 2, sides: 8 }, { count: 1, sides: 6 }],
            flat: 2,
        });
    });

    it("treats a missing dice count as 1", () => {
        expect(parseDiceExpression("d20")).toEqual({ groups: [{ count: 1, sides: 20 }], flat: 0 });
    });

    it("parses a bare number as a flat value only", () => {
        expect(parseDiceExpression("70")).toEqual({ groups: [], flat: 70 });
        expect(parseDiceExpression("-3")).toEqual({ groups: [], flat: -3 });
    });

    it("returns an empty expression for empty or whitespace-only input", () => {
        expect(parseDiceExpression("")).toEqual({ groups: [], flat: 0 });
        expect(parseDiceExpression("   ")).toEqual({ groups: [], flat: 0 });
    });

    it("ignores subtracted dice and terms that aren't dice or numbers", () => {
        expect(parseDiceExpression("8d6-1d6")).toEqual({ groups: [{ count: 8, sides: 6 }], flat: 0 });
        expect(parseDiceExpression("1d8+fire+2")).toEqual({ groups: [{ count: 1, sides: 8 }], flat: 2 });
    });

    it("is case-insensitive about the d", () => {
        expect(parseDiceExpression("3D6")).toEqual({ groups: [{ count: 3, sides: 6 }], flat: 0 });
    });
});

describe("addParsedDice", () => {
    it("merges groups of the same die size", () => {
        expect(addParsedDice(parseDiceExpression("8d6"), parseDiceExpression("2d6"))).toEqual({
            groups: [{ count: 10, sides: 6 }],
            flat: 0,
        });
    });

    it("appends groups of a new die size and adds flat modifiers", () => {
        expect(addParsedDice(parseDiceExpression("2d8+1"), parseDiceExpression("1d6+2"))).toEqual({
            groups: [{ count: 2, sides: 8 }, { count: 1, sides: 6 }],
            flat: 3,
        });
    });

    it("multiplies the second expression by `times` (e.g. upcast levels)", () => {
        expect(addParsedDice(parseDiceExpression("8d6"), parseDiceExpression("1d6+1"), 3)).toEqual({
            groups: [{ count: 11, sides: 6 }],
            flat: 3,
        });
    });

    it("adds nothing when `times` is 0", () => {
        expect(addParsedDice(parseDiceExpression("3d4+1"), parseDiceExpression("1d8+5"), 0)).toEqual({
            groups: [{ count: 3, sides: 4 }],
            flat: 1,
        });
    });

    it("does not mutate either input", () => {
        const a = parseDiceExpression("8d6");
        const b = parseDiceExpression("2d6");
        addParsedDice(a, b, 2);
        expect(a).toEqual({ groups: [{ count: 8, sides: 6 }], flat: 0 });
        expect(b).toEqual({ groups: [{ count: 2, sides: 6 }], flat: 0 });
    });
});

describe("formatParsedDice", () => {
    it("formats dice groups joined with +", () => {
        expect(formatParsedDice({ groups: [{ count: 2, sides: 8 }, { count: 1, sides: 6 }], flat: 0 })).toBe("2d8 + 1d6");
    });

    it("appends a positive or negative flat modifier with spacing", () => {
        expect(formatParsedDice({ groups: [{ count: 1, sides: 4 }], flat: 1 })).toBe("1d4 + 1");
        expect(formatParsedDice({ groups: [{ count: 1, sides: 4 }], flat: -2 })).toBe("1d4 - 2");
    });

    it("shows a flat-only expression as just the number", () => {
        expect(formatParsedDice({ groups: [], flat: 70 })).toBe("70");
        expect(formatParsedDice({ groups: [], flat: -3 })).toBe("-3");
    });

    it("returns an empty string for an empty expression", () => {
        expect(formatParsedDice({ groups: [], flat: 0 })).toBe("");
    });

    it("round-trips what parseDiceExpression reads", () => {
        expect(formatParsedDice(parseDiceExpression("2d8+1d6+3"))).toBe("2d8 + 1d6 + 3");
    });
});

describe("rollParsedDice", () => {
    it("rolls every group in order and adds the flat part", () => {
        queueRandom(face(7, 8), face(2, 8), face(5, 6));
        expect(rollParsedDice(parseDiceExpression("2d8+1d6+3"), "Chaos Bolt")).toEqual({
            formula: "Chaos Bolt",
            rolls: [7, 2, 5],
            diceTotal: 14,
            modifier: 3,
            total: 17,
        });
    });

    it("rolls each instance separately and applies flat + extra modifier per instance", () => {
        // Magic Missile: three darts of 1d4+1 each.
        queueFaces(4, 1, 4, 2);
        expect(rollParsedDice(parseDiceExpression("1d4+1"), "3 x 1d4+1", 0, 3)).toMatchObject({
            rolls: [1, 4, 2],
            diceTotal: 7,
            modifier: 3,
            total: 10,
        });
    });

    it("applies an extra modifier once per instance", () => {
        queueFaces(6, 3, 3);
        expect(rollParsedDice(parseDiceExpression("1d6"), "x", 2, 2)).toMatchObject({ diceTotal: 6, modifier: 4, total: 10 });
    });

    it("treats zero or negative instances as a single instance", () => {
        queueFaces(6, 3, 4);
        expect(rollParsedDice(parseDiceExpression("1d6+1"), "x", 0, 0)).toMatchObject({ rolls: [3], modifier: 1, total: 4 });
        expect(rollParsedDice(parseDiceExpression("1d6+1"), "x", 0, -5)).toMatchObject({ rolls: [4], modifier: 1, total: 5 });
    });

    it("returns only the flat value for a dice-less expression", () => {
        expect(rollParsedDice(parseDiceExpression("70"), "70")).toEqual({ formula: "70", rolls: [], diceTotal: 0, modifier: 70, total: 70 });
    });
});

describe("rollD20", () => {
    it("rolls one d20 and adds the modifier", () => {
        queueFaces(20, 14);
        expect(rollD20(5)).toEqual({ formula: "1d20", rolls: [14], diceTotal: 14, modifier: 5, total: 19 });
    });

    it("defaults to no modifier", () => {
        queueFaces(20, 20);
        expect(rollD20()).toMatchObject({ modifier: 0, total: 20 });
    });

    it("with advantage rolls twice, keeps both dice, and totals the higher one", () => {
        queueFaces(20, 4, 17);
        expect(rollD20(3, true)).toEqual({
            formula: "1d20 (advantage)",
            rolls: [4, 17],
            diceTotal: 17,
            modifier: 3,
            total: 20,
        });
    });

    it("with advantage keeps the first die when it is the higher one", () => {
        queueFaces(20, 19, 2);
        expect(rollD20(-1, true)).toMatchObject({ rolls: [19, 2], diceTotal: 19, total: 18 });
    });
});

describe("findDiceNotation", () => {
    it("finds the first dice expression in free text", () => {
        expect(findDiceNotation("The target takes 3d6 fire damage, or 1d6 on a save.")).toBe("3d6");
    });

    it("includes a trailing modifier and strips whitespace", () => {
        expect(findDiceNotation("You regain 2d4 + 2 hit points")).toBe("2d4+2");
        expect(findDiceNotation("deals 1 d 8 - 1 damage")).toBe("1d8-1");
    });

    it("is case-insensitive", () => {
        expect(findDiceNotation("Roll 1D12")).toBe("1D12");
    });

    it("returns null when there is no dice notation", () => {
        expect(findDiceNotation("You gain advantage on your next attack.")).toBeNull();
        expect(findDiceNotation("")).toBeNull();
    });

    it("returns something rollDiceFormula can roll", () => {
        const notation = findDiceNotation("heals 1d8 + 4")!;
        queueFaces(8, 6);
        expect(rollDiceFormula(notation).total).toBe(10);
    });
});

describe("describeDiceRoll", () => {
    const result = (overrides: Partial<DiceRollResult>): DiceRollResult => ({
        formula: "x",
        rolls: [],
        diceTotal: 0,
        modifier: 0,
        total: 0,
        ...overrides,
    });

    it("shows a single die without brackets", () => {
        expect(describeDiceRoll(result({ rolls: [14], diceTotal: 14, modifier: 5, total: 19 }))).toBe("14 + 5 = 19");
    });

    it("shows several dice in brackets", () => {
        expect(describeDiceRoll(result({ rolls: [4, 6], diceTotal: 10, modifier: 3, total: 13 }))).toBe("[4, 6] + 3 = 13");
    });

    it("shows a negative modifier with a minus sign", () => {
        expect(describeDiceRoll(result({ rolls: [4, 6], diceTotal: 10, modifier: -2, total: 8 }))).toBe("[4, 6] - 2 = 8");
    });

    it("omits a zero modifier", () => {
        expect(describeDiceRoll(result({ rolls: [7], diceTotal: 7, total: 7 }))).toBe("7 = 7");
    });

    it("shows only the total for a dice-less result", () => {
        expect(describeDiceRoll(result({ modifier: 8, total: 8 }))).toBe("8");
    });

    it("shows a flat-number formula as a breakdown", () => {
        expect(describeDiceRoll(rollDiceFormula("1", 3))).toBe("1 + 3 = 4");
    });
});
