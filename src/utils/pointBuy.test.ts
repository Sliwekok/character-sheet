import { describe, it, expect } from "vitest";
import {
    POINT_BUY_BUDGET,
    POINT_BUY_COSTS,
    isValidPointBuyScore,
    pointBuyCost,
    pointBuyRemaining,
    pointBuyStartingScores,
} from "./pointBuy";
import type { AbilityScores } from "@/interfaces/Characters";

const scores = (str: number, dex: number, con: number, int: number, wis: number, cha: number): AbilityScores => ({
    strength: str,
    dexterity: dex,
    constitution: con,
    intelligence: int,
    wisdom: wis,
    charisma: cha,
});

describe("point buy costs", () => {
    it("matches the PHB cost table", () => {
        expect(POINT_BUY_COSTS).toEqual({ 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 });
        expect(POINT_BUY_BUDGET).toBe(27);
    });
});

describe("pointBuyStartingScores", () => {
    it("starts every ability at 8 with the full budget left", () => {
        const start = pointBuyStartingScores();
        expect(start).toEqual(scores(8, 8, 8, 8, 8, 8));
        expect(pointBuyCost(start)).toBe(0);
        expect(pointBuyRemaining(start)).toBe(27);
    });

    it("returns a fresh object each time", () => {
        const a = pointBuyStartingScores();
        a.strength = 15;
        expect(pointBuyStartingScores().strength).toBe(8);
    });
});

describe("pointBuyCost / pointBuyRemaining", () => {
    it("spends exactly 27 points on the standard array (15, 14, 13, 12, 10, 8)", () => {
        const standard = scores(15, 14, 13, 12, 10, 8);
        expect(pointBuyCost(standard)).toBe(27);
        expect(pointBuyRemaining(standard)).toBe(0);
    });

    it("spends exactly 27 points on 15, 15, 15, 8, 8, 8", () => {
        expect(pointBuyRemaining(scores(15, 15, 15, 8, 8, 8))).toBe(0);
    });

    it("goes negative when over budget", () => {
        const overspent = scores(15, 15, 15, 15, 8, 8);
        expect(pointBuyCost(overspent)).toBe(36);
        expect(pointBuyRemaining(overspent)).toBe(-9);
    });

    it("charges the escalating cost above 13", () => {
        expect(pointBuyCost(scores(13, 8, 8, 8, 8, 8))).toBe(5);
        expect(pointBuyCost(scores(14, 8, 8, 8, 8, 8))).toBe(7);
        expect(pointBuyCost(scores(15, 8, 8, 8, 8, 8))).toBe(9);
    });
});

describe("isValidPointBuyScore", () => {
    it("accepts 8 through 15", () => {
        for (let score = 8; score <= 15; score++) expect(isValidPointBuyScore(score)).toBe(true);
    });

    it("rejects scores outside 8-15", () => {
        for (const score of [0, 3, 7, 16, 18, 20]) expect(isValidPointBuyScore(score)).toBe(false);
    });
});
