import { Character } from "@/interfaces/Characters";
import { calculateAbilityModifiers } from "./abilityModifiers";
import { getMaxHpBreakdown } from "./calculateMaxHp";
import { DiceRollResult, rollDie } from "./dice";

/**
 * One die size's worth of Hit Dice (e.g. all of a Fighter 3 / Paladin 2's
 * d10s), grouped by size rather than by class - a d10 is a d10 whichever
 * class granted it, and that's how both PHBs present spending them.
 */
export interface HitDicePool {
    hitDie: number;
    /** One die per level across every class that grants this die size. */
    total: number;
    /** Spent since they were last recovered, clamped to `total`. */
    expended: number;
    remaining: number;
}

/**
 * Current Hit Dice pools, largest die first. Only the EXPENDED count is
 * stored (`CharacterDetails.expendedHitDice`, keyed by die size) - totals
 * always come from class levels, same convention as spell slots, so a level
 * up or a respec never leaves a stale maximum behind.
 */
export function getHitDicePools(character: Character): HitDicePool[] {
    const totals = new Map<number, number>();
    for (const entry of character.classes) {
        const die = entry.class.hitDie;
        totals.set(die, (totals.get(die) ?? 0) + entry.level);
    }
    const expendedByDie = character.details?.expendedHitDice ?? {};
    return [...totals.entries()]
        .sort(([a], [b]) => b - a)
        .map(([hitDie, total]) => {
            const expended = Math.min(total, Math.max(0, expendedByDie[hitDie] ?? 0));
            return { hitDie, total, expended, remaining: total - expended };
        });
}

/** e.g. "3d10 + 2d8" - remaining dice by default, or totals with `which: "total"`. */
export function formatHitDicePools(pools: HitDicePool[], which: "remaining" | "total" = "remaining"): string {
    return pools.map((pool) => `${which === "remaining" ? pool.remaining : pool.total}d${pool.hitDie}`).join(" + ");
}

/** The Max HP the sheet shows everywhere (the breakdown's own sum - see the header badge's comment on the page). */
export function getSheetMaxHp(character: Character): number {
    return getMaxHpBreakdown(character).total;
}

/**
 * Clamps a new current HP to 0..max and returns the patch to apply. RAW,
 * regaining any HP while at 0 ends the dying state, so death saves are
 * cleared whenever HP goes from 0 to above 0.
 */
export function applyCurrentHp(character: Character, nextHp: number): Pick<Character, "currentHP" | "details"> {
    const max = getSheetMaxHp(character);
    const currentHP = Math.max(0, Math.min(max, Math.round(nextHp)));
    const revived = character.currentHP <= 0 && currentHP > 0;
    return {
        currentHP,
        details: revived ? { ...character.details, deathSaves: { successes: 0, failures: 0 } } : character.details,
    };
}

/**
 * Parses the inline HP editor's text: a bare number sets HP outright
 * ("17"), a signed one is relative to the current value ("-8" damage,
 * "+5" healing). Returns null for anything else so the editor can just
 * cancel instead of writing garbage.
 */
export function parseHpInput(text: string, currentHp: number): number | null {
    const match = text.trim().match(/^([+-])?\s*(\d+)$/);
    if (!match) return null;
    const amount = Number(match[2]);
    if (match[1] === "+") return currentHp + amount;
    if (match[1] === "-") return currentHp - amount;
    return amount;
}

/**
 * Hit Dice regained on a Long Rest, as the new expended map:
 * - 2014 PHB: up to half the character's total Hit Dice (minimum 1).
 * - 2024 PHB: all of them.
 * With a 2014 budget smaller than what's spent, the largest dice come back
 * first (the player-favourable choice a player would make on paper).
 */
export function hitDiceAfterLongRest(character: Character): Record<number, number> {
    if (character.edition === "2024") return {};
    const pools = getHitDicePools(character);
    const totalDice = pools.reduce((sum, pool) => sum + pool.total, 0);
    let budget = Math.max(1, Math.floor(totalDice / 2));
    const next: Record<number, number> = {};
    for (const pool of pools) {
        const recovered = Math.min(pool.expended, budget);
        budget -= recovered;
        const stillSpent = pool.expended - recovered;
        if (stillSpent > 0) next[pool.hitDie] = stillSpent;
    }
    return next;
}

export interface HitDiceSpendResult {
    /** One merged roll for the roll history: every die rolled, Con modifier added once per die. */
    roll: DiceRollResult;
    healed: number;
    expendedHitDice: Record<number, number>;
}

/**
 * Spends `spend[die]` Hit Dice of each size (clamped to what's left):
 * each die heals its roll + Con modifier, never below 0 for a single die
 * (so a low Con can't make a Hit Die hurt). Returns null when nothing is
 * spent.
 */
export function spendHitDice(character: Character, spend: Record<number, number>): HitDiceSpendResult | null {
    const conModifier = calculateAbilityModifiers(character.abilityScores).constitution;
    const pools = getHitDicePools(character);
    const rolls: number[] = [];
    const formulaParts: string[] = [];
    const expendedHitDice: Record<number, number> = { ...(character.details?.expendedHitDice ?? {}) };
    let healed = 0;

    for (const pool of pools) {
        const count = Math.min(pool.remaining, Math.max(0, Math.floor(spend[pool.hitDie] ?? 0)));
        if (count === 0) continue;
        formulaParts.push(`${count}d${pool.hitDie}`);
        for (let i = 0; i < count; i++) {
            const roll = rollDie(pool.hitDie);
            rolls.push(roll);
            healed += Math.max(0, roll + conModifier);
        }
        expendedHitDice[pool.hitDie] = pool.expended + count;
    }

    if (rolls.length === 0) return null;

    const diceTotal = rolls.reduce((sum, roll) => sum + roll, 0);
    const conPart = conModifier === 0 ? "" : `${conModifier > 0 ? "+" : "-"}${Math.abs(conModifier) * rolls.length}`;
    return {
        roll: {
            formula: `${formulaParts.join("+")}${conPart}`,
            rolls,
            diceTotal,
            // Folds in the per-die floor, so `total` is always the HP actually healed.
            modifier: healed - diceTotal,
            total: healed,
        },
        healed,
        expendedHitDice,
    };
}
