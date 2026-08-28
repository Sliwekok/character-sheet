import { AbilityScores } from "@/interfaces/Characters";

/** Rolls one die with the given number of sides, e.g. `rollDie(20)` for a d20. */
export function rollDie(sides: number): number {
    return Math.floor(Math.random() * sides) + 1;
}

/** Classic ability-score roll: 4d6, drop the lowest, sum the rest. */
export function roll4d6DropLowest(): number {
    const rolls = [rollDie(6), rollDie(6), rollDie(6), rollDie(6)].sort((a, b) => b - a);
    return rolls[0] + rolls[1] + rolls[2];
}

/** Six 4d6-drop-lowest results, in rolled order - unassigned to any particular ability. Used by both the manual "Roll" method and every random-generation path. */
export function rollAbilityScoreSet(): number[] {
    return Array.from({ length: 6 }, () => roll4d6DropLowest());
}

/** Picks one random element. Throws on an empty array - callers should never pass one (a ruleset with zero races/classes/etc. is a data bug, not a runtime case to handle quietly). */
export function pickRandom<T>(items: readonly T[]): T {
    if (items.length === 0) {
        throw new Error("pickRandom() called with an empty list");
    }
    return items[Math.floor(Math.random() * items.length)];
}

/** Picks `count` distinct random elements (no repeats), order not significant. `count` is clamped to `items.length`. */
export function pickRandomN<T>(items: readonly T[], count: number): T[] {
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.max(0, Math.min(count, items.length)));
}

const ABILITY_ORDER: (keyof AbilityScores)[] = [
    "strength",
    "dexterity",
    "constitution",
    "intelligence",
    "wisdom",
    "charisma",
];

/**
 * Rolls six 4d6-drop-lowest scores and assigns them to abilities in random
 * order. This is a simplification worth calling out: a player rolling for
 * real would usually assign their best rolls to the abilities their class
 * needs most, not at random. "All random" generation (see
 * utils/randomCharacter.ts) intentionally skips that judgment call - if
 * this ever needs to bias toward a class's `primaryAbility`, this is the
 * function to change.
 */
export function randomAbilityScores(): AbilityScores {
    const rolls = pickRandomN(rollAbilityScoreSet(), 6);
    return ABILITY_ORDER.reduce((scores, ability, index) => {
        scores[ability] = rolls[index];
        return scores;
    }, {} as AbilityScores);
}
