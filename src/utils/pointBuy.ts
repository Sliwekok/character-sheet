import { AbilityScores } from "@/interfaces/Characters";

/** Standard PHB 27-point buy: every ability starts at 8 (cost 0) and can be raised to 15. */
export const POINT_BUY_BUDGET = 27;
export const POINT_BUY_MIN_SCORE = 8;
export const POINT_BUY_MAX_SCORE = 15;

/** Cost to raise a single ability TO this score (not the delta) - costs escalate faster above 13. */
export const POINT_BUY_COSTS: Record<number, number> = {
    8: 0,
    9: 1,
    10: 2,
    11: 3,
    12: 4,
    13: 5,
    14: 7,
    15: 9,
};

export function pointBuyStartingScores(): AbilityScores {
    return {
        strength: POINT_BUY_MIN_SCORE,
        dexterity: POINT_BUY_MIN_SCORE,
        constitution: POINT_BUY_MIN_SCORE,
        intelligence: POINT_BUY_MIN_SCORE,
        wisdom: POINT_BUY_MIN_SCORE,
        charisma: POINT_BUY_MIN_SCORE,
    };
}

/** Total points spent across all six abilities at their current scores. */
export function pointBuyCost(scores: AbilityScores): number {
    return Object.values(scores).reduce((total, score) => total + (POINT_BUY_COSTS[score] ?? 0), 0);
}

export function pointBuyRemaining(scores: AbilityScores): number {
    return POINT_BUY_BUDGET - pointBuyCost(scores);
}

/** Whether `score` is a legal point-buy value at all (regardless of budget). */
export function isValidPointBuyScore(score: number): boolean {
    return score >= POINT_BUY_MIN_SCORE && score <= POINT_BUY_MAX_SCORE;
}
