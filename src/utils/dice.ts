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

export type DiceRollResult = {
    /** The formula that was rolled, e.g. "1d8" or "1d20". */
    formula: string;
    /** Individual die results, in the order rolled. Empty if `formula` didn't parse. */
    rolls: number[];
    /** Sum of just the dice, before `modifier`. */
    diceTotal: number;
    /** Flat modifier applied on top of the dice (any embedded in `formula` plus any passed in separately). */
    modifier: number;
    /** `diceTotal + modifier` - the number to actually use. */
    total: number;
};

/**
 * Parses and rolls a small subset of dice notation: "NdM", optionally with
 * a trailing "+K"/"-K" (whitespace-tolerant, case-insensitive "d"). Built
 * only to roll the app's own weapon/spell dice strings (e.g. "1d8", "2d6"),
 * not as a general-purpose dice-notation parser - multiple dice groups
 * ("1d8+1d6") and advantage/disadvantage aren't supported. Falls back to a
 * dice-less result (just `extraModifier` as the total) if `formula` doesn't
 * match at all, rather than throwing, since one caller (SpellEntry) passes
 * in text pulled from a spell description via `findDiceNotation`, which
 * isn't guaranteed to be clean.
 */
export function rollDiceFormula(formula: string, extraModifier = 0): DiceRollResult {
    // A bare flat number - e.g. the "1" base damage of an Unarmed Strike
    // with no class feature (like a Monk's Martial Arts) replacing it with
    // a real die - isn't "NdM" notation, but it's still a deterministic
    // value rather than a dice-less fallback: treat it as a single "roll"
    // of that fixed value so describeDiceRoll() still shows a breakdown
    // (e.g. "1 + 3 = 4") instead of collapsing straight to the total.
    const flatMatch = formula.trim().match(/^(\d+)$/);
    if (flatMatch) {
        const flat = Number(flatMatch[1]);
        return { formula, rolls: [flat], diceTotal: flat, modifier: extraModifier, total: flat + extraModifier };
    }

    const match = formula.trim().match(/^(\d+)\s*d\s*(\d+)\s*(?:([+-])\s*(\d+))?$/i);
    if (!match) {
        return { formula, rolls: [], diceTotal: 0, modifier: extraModifier, total: extraModifier };
    }

    const count = Number(match[1]);
    const sides = Number(match[2]);
    const embeddedModifier = match[3] ? Number(`${match[3]}${match[4]}`) : 0;
    const rolls = Array.from({ length: count }, () => rollDie(sides));
    const diceTotal = rolls.reduce((sum, roll) => sum + roll, 0);
    const modifier = embeddedModifier + extraModifier;

    return { formula, rolls, diceTotal, modifier, total: diceTotal + modifier };
}

/** One "NdM" group of a parsed dice expression. */
export type DiceGroup = { count: number; sides: number };

/** A parsed dice expression: any number of "NdM" groups plus one summed flat modifier. */
export type ParsedDice = { groups: DiceGroup[]; flat: number };

/**
 * Parses "8d6", "1d4+1", "2d8+1d6+3", "70" or "" into dice groups plus a
 * flat modifier (terms may be joined by "+" or "-"; subtracted dice aren't
 * supported and are ignored). Unlike `rollDiceFormula` this accepts
 * multiple dice groups, which spell damage needs (Chaos Bolt's "2d8+1d6",
 * or base dice combined with upcast dice of a different size).
 */
export function parseDiceExpression(formula: string): ParsedDice {
    const parsed: ParsedDice = { groups: [], flat: 0 };
    const cleaned = formula.replace(/\s+/g, "");
    if (!cleaned) return parsed;
    for (const term of cleaned.match(/[+-]?[^+-]+/g) ?? []) {
        const sign = term.startsWith("-") ? -1 : 1;
        const body = term.replace(/^[+-]/, "");
        const dice = body.match(/^(\d*)d(\d+)$/i);
        if (dice) {
            if (sign > 0) parsed.groups.push({ count: Number(dice[1] || 1), sides: Number(dice[2]) });
        } else if (/^\d+$/.test(body)) {
            parsed.flat += sign * Number(body);
        }
    }
    return parsed;
}

/** Adds two parsed expressions, merging groups of the same die size ("8d6" + "2d6" = "10d6"). */
export function addParsedDice(a: ParsedDice, b: ParsedDice, times = 1): ParsedDice {
    const groups = a.groups.map((group) => ({ ...group }));
    for (const group of b.groups) {
        const existing = groups.find((candidate) => candidate.sides === group.sides);
        if (existing) existing.count += group.count * times;
        else if (group.count * times > 0) groups.push({ count: group.count * times, sides: group.sides });
    }
    return { groups: groups.filter((group) => group.count > 0), flat: a.flat + b.flat * times };
}

/** "10d6", "1d4 + 1", "2d8 + 1d6", "70" - the display form of a parsed expression ("" when there's nothing at all). */
export function formatParsedDice(parsed: ParsedDice): string {
    const dice = parsed.groups.map((group) => `${group.count}d${group.sides}`).join(" + ");
    if (!parsed.flat) return dice;
    if (!dice) return `${parsed.flat}`;
    return `${dice} ${parsed.flat >= 0 ? "+" : "-"} ${Math.abs(parsed.flat)}`;
}

/**
 * Rolls a parsed expression `instances` times (Magic Missile's darts, each
 * rolled separately) plus `extraModifier` per instance, merged into one
 * DiceRollResult: `rolls` holds every die in order, `modifier` the summed
 * flat part. `formula` is supplied by the caller for display.
 */
export function rollParsedDice(parsed: ParsedDice, formula: string, extraModifier = 0, instances = 1): DiceRollResult {
    const rolls: number[] = [];
    for (let i = 0; i < Math.max(1, instances); i++) {
        for (const group of parsed.groups) {
            for (let j = 0; j < group.count; j++) rolls.push(rollDie(group.sides));
        }
    }
    const diceTotal = rolls.reduce((sum, roll) => sum + roll, 0);
    const modifier = (parsed.flat + extraModifier) * Math.max(1, instances);
    return { formula, rolls, diceTotal, modifier, total: diceTotal + modifier };
}

/**
 * Rolls a d20 plus a flat modifier - the shared shape behind every attack
 * roll (weapon or spell) on the character sheet. Pass `advantage: true` to
 * roll twice and keep the higher result (e.g. for a Vex Weapon Mastery
 * follow-up attack) - `rolls` still holds both dice so the UI can show which
 * one was kept, but `diceTotal`/`total` only ever reflect the higher one.
 */
export function rollD20(modifier = 0, advantage = false): DiceRollResult {
    if (!advantage) {
        const roll = rollDie(20);
        return { formula: "1d20", rolls: [roll], diceTotal: roll, modifier, total: roll + modifier };
    }

    const rollA = rollDie(20);
    const rollB = rollDie(20);
    const best = Math.max(rollA, rollB);
    return { formula: "1d20 (advantage)", rolls: [rollA, rollB], diceTotal: best, modifier, total: best + modifier };
}

/**
 * Finds the first "NdM" (optionally "+K"/"-K") dice notation in free text.
 * No longer what drives spell roll buttons - compendium spells carry
 * structured `mechanics` (see interfaces/Spell.ts, utils/spellRolls.ts).
 * Only used as the last-resort fallback for a custom/imported spell the
 * compendium doesn't know (utils/spellRolls.ts's `fallbackMechanics`).
 * Returns `null` when nothing matches.
 */
export function findDiceNotation(text: string): string | null {
    const match = text.match(/\d+\s*d\s*\d+(?:\s*[+-]\s*\d+)?/i);
    return match ? match[0].replace(/\s+/g, "") : null;
}

/**
 * Human-readable summary of a roll, e.g. "[14] + 5 = 19" or
 * "[4, 6] + 3 = 13" or "8 = 8" (a flat, dice-less result). Shared by every
 * "Roll ..." button on the character sheet so results render consistently.
 */
export function describeDiceRoll(result: DiceRollResult): string {
    if (result.rolls.length === 0) return `${result.total}`;
    const rollsText = result.rolls.length > 1 ? `[${result.rolls.join(", ")}]` : `${result.rolls[0]}`;
    const modifierText = result.modifier ? ` ${result.modifier >= 0 ? "+" : "-"} ${Math.abs(result.modifier)}` : "";
    return `${rollsText}${modifierText} = ${result.total}`;
}
