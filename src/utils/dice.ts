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

/** Rolls a d20 plus a flat modifier - the shared shape behind every attack roll (weapon or spell) on the character sheet. */
export function rollD20(modifier = 0): DiceRollResult {
    const roll = rollDie(20);
    return { formula: "1d20", rolls: [roll], diceTotal: roll, modifier, total: roll + modifier };
}

/**
 * Finds the first "NdM" (optionally "+K"/"-K") dice notation in free text.
 * Used to offer a "roll" button for a spell's damage/healing straight from
 * its `description` field, since interfaces/Spell.ts has no structured
 * damage-dice field the way Weapon does. Only ever returns the FIRST match
 * - a spell whose text has more than one dice notation (e.g. a scaling
 * "at higher levels" clause) only offers the first one, and any modifier
 * the spell text adds beyond that (e.g. "+ your spellcasting ability
 * modifier" on many healing spells) isn't applied automatically - the
 * button's tooltip says as much rather than silently guessing. Returns
 * `null` when nothing matches.
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
