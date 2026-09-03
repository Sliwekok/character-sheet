import { Character } from "@/interfaces/Characters";
import { HpLevelEntry, HpMethod } from "@/interfaces/Hp";
import { calculateAbilityModifiers } from "./abilityModifiers";
import { StatLine, formatEquationTerm } from "./statLine";

export type MaxHpBreakdown = {
    lines: StatLine[];
    total: number;
};

/** RAW average hit-die value: floor(hitDie / 2) + 1 - e.g. a d8 averages to 5. */
export function averageHitDieValue(hitDie: number): number {
    return Math.floor(hitDie / 2) + 1;
}

/**
 * How many rolled-die results a class entry needs to store (see
 * `DraftClassEntry.hpRolls`) for a given level: every level in that class
 * EXCEPT the character's very first level ever (classes[0]'s level 1),
 * which always uses the max hit die instead of a roll.
 */
export function rollsNeededForClassEntry(level: number, isFirstClassTaken: boolean): number {
    return isFirstClassTaken ? Math.max(0, level - 1) : Math.max(0, level);
}

export interface HpClassInput {
    hitDie: number;
    level: number;
    hpMethod: HpMethod;
    /**
     * Pre-rolled d(hitDie) results for this class's non-first levels, in
     * ascending level order (see `rollsNeededForClassEntry`). Only consulted
     * when `hpMethod === "roll"`; a missing entry falls back to the RAW
     * average rather than rolling here - `buildHpHistory` is a pure
     * function of its inputs on purpose (see DraftClassEntry.hpRolls's
     * comment), so actually rolling dice is the caller's job (ClassStep for
     * the wizard, utils/randomCharacter.ts for the random generator).
     */
    rolls?: number[];
}

function buildLevelEntry(params: {
    classIndex: number;
    levelInClass: number;
    isFirstLevel: boolean;
    hitDie: number;
    conModifier: number;
    method: HpMethod;
    roll?: number;
}): HpLevelEntry {
    const { classIndex, levelInClass, isFirstLevel, hitDie, conModifier, method, roll } = params;
    const dieValue = isFirstLevel
        ? hitDie
        : method === "roll"
          ? roll ?? averageHitDieValue(hitDie)
          : averageHitDieValue(hitDie);

    return {
        classIndex,
        levelInClass,
        isFirstLevel,
        method: isFirstLevel ? "average" : method,
        hitDie,
        dieValue,
        roll: !isFirstLevel && method === "roll" ? dieValue : undefined,
        conModifier,
        // RAW minimum: a level up always grants at least 1 HP, even when a
        // very low Constitution modifier would otherwise push the
        // roll/average to zero or below (PHB, "Hit Points at Higher Levels").
        // We never DECREASE hp on level up - the worst case is +1.
        hpGained: Math.max(1, dieValue + conModifier),
    };
}

/**
 * Builds the full per-level HP history for a (possibly multiclassed)
 * character - one entry per level, across every class, in the order
 * gained. Pure: given the same `entries` and `conModifier` it always
 * returns the same result, which is what lets `finalizeDraft` call this
 * (indirectly, via `getMaxHpBreakdown`/`calculateMaxHP`) on every
 * ReviewStep render without HP drifting between "preview" and "Save" - any
 * actual die-rolling happens upstream of this function (see
 * `HpClassInput.rolls`'s comment).
 */
export function buildHpHistory(entries: HpClassInput[], conModifier: number): HpLevelEntry[] {
    const history: HpLevelEntry[] = [];

    entries.forEach((entry, classIndex) => {
        const isFirstClassTaken = classIndex === 0;

        for (let levelInClass = 1; levelInClass <= entry.level; levelInClass++) {
            const isFirstLevel = isFirstClassTaken && levelInClass === 1;
            // Index into entry.rolls: classes[0]'s level 2 is rolls[0] (level 1
            // has no roll); every other class's level 1 is already rolls[0].
            const rollIndex = isFirstClassTaken ? levelInClass - 2 : levelInClass - 1;
            const roll = !isFirstLevel && entry.hpMethod === "roll" ? entry.rolls?.[rollIndex] : undefined;

            history.push(
                buildLevelEntry({
                    classIndex,
                    levelInClass,
                    isFirstLevel,
                    hitDie: entry.hitDie,
                    conModifier,
                    method: entry.hpMethod,
                    roll,
                })
            );
        }
    });

    return history;
}

/**
 * Same per-level history `character.hpHistory` stores, but synthesized on
 * the fly for a character saved before that field existed - every level
 * treated as `"average"`, which is exactly the (only) method those
 * characters were ever computed with. Never called for a character that
 * already has `hpHistory` recorded.
 */
function synthesizeHpHistory(character: Character): HpLevelEntry[] {
    const conModifier = calculateAbilityModifiers(character.abilityScores).constitution;
    const entries: HpClassInput[] = character.classes.map(({ class: charClass, level, hpMethod }) => ({
        hitDie: charClass.hitDie,
        level,
        hpMethod: hpMethod ?? "average",
    }));
    return buildHpHistory(entries, conModifier);
}

/** One tooltip line describing a single level's HP gain. */
function describeLevel(entry: HpLevelEntry, className: string): StatLine {
    const rawSum = entry.dieValue + entry.conModifier;
    const clamped = rawSum < 1;
    const equation = `${entry.dieValue} ${formatEquationTerm(entry.conModifier)} = ${rawSum}`;
    const value = clamped ? `${equation} → 1 (minimum 1 HP per level)` : equation;

    if (entry.isFirstLevel) {
        return { label: `${className} level ${entry.levelInClass} (first level - max hit die)`, value };
    }
    if (entry.method === "roll") {
        return { label: `${className} level ${entry.levelInClass} (rolled d${entry.hitDie})`, value };
    }
    return { label: `${className} level ${entry.levelInClass} (average of d${entry.hitDie})`, value };
}

/**
 * Per-level breakdown of `character.maxHP`, for the character sheet's HP
 * info tooltip - one line per level actually gained, across every class,
 * so the player can see exactly how much HP each level up granted rather
 * than just a class-wide total (or method). Reads `character.hpHistory`
 * when present; falls back to synthesizing an all-"average" history for a
 * character saved before that existed (see `synthesizeHpHistory`), so old
 * characters still render a (correct) breakdown instead of crashing.
 *
 * `calculateMaxHP` is implemented in terms of this so the two can never
 * disagree.
 */
export function getMaxHpBreakdown(character: Character): MaxHpBreakdown {
    const history = character.hpHistory ?? synthesizeHpHistory(character);
    const lines: StatLine[] = [];
    let total = 0;

    history.forEach((entry) => {
        const className = character.classes[entry.classIndex]?.class.name ?? `Class ${entry.classIndex + 1}`;
        total += entry.hpGained;
        lines.push(describeLevel(entry, className));
    });

    lines.push({ label: "Max HP", value: `${total}` });
    return { lines, total };
}

/**
 * Max HP across one or more classes. RAW: the very first level the
 * character ever took (character.classes[0]'s level 1) always uses its
 * class's full hit die + Con modifier; every level after that - in ANY
 * class, multiclassed or not - either rolls that class's own hit die or
 * takes its fixed RAW average (whichever `hpMethod` says), plus the Con
 * modifier, floored to a minimum of 1 HP so a level up never grants zero
 * or negative hit points.
 */
export function calculateMaxHP(character: Character): number {
    return getMaxHpBreakdown(character).total;
}
