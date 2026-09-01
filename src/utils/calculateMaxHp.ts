import { Character } from "@/interfaces/Characters";
import { calculateAbilityModifiers } from "./abilityModifiers";
import { StatLine, formatSigned } from "./statLine";

export type MaxHpBreakdown = {
    lines: StatLine[];
    total: number;
};

/**
 * Same RAW multiclass HP math as `calculateMaxHP` below, but returns one
 * line per class entry - used by the character sheet's HP info tooltip.
 * `calculateMaxHP` is implemented in terms of this so the two can never
 * disagree.
 */
export function getMaxHpBreakdown(character: Character): MaxHpBreakdown {
    const conMod = calculateAbilityModifiers(character.abilityScores).constitution;
    const lines: StatLine[] = [];
    let total = 0;

    character.classes.forEach(({ class: charClass, level }, classIndex) => {
        const isFirstClassTaken = classIndex === 0;
        const hitDieAverage = Math.floor(charClass.hitDie / 2) + 1;
        const perLevelHP = hitDieAverage + conMod;

        if (isFirstClassTaken) {
            const firstLevelHP = charClass.hitDie + conMod;
            total += firstLevelHP;
            lines.push({
                label: `${charClass.name} level 1 (first level taken)`,
                value: `${charClass.hitDie} + ${formatSigned(conMod)} = ${firstLevelHP}`,
            });

            const levelsAfterFirst = level - 1;
            if (levelsAfterFirst > 0) {
                const subtotal = levelsAfterFirst * perLevelHP;
                total += subtotal;
                lines.push({
                    label: `${charClass.name} levels 2–${level}`,
                    value: `${levelsAfterFirst} × (${hitDieAverage} + ${formatSigned(conMod)}) = ${subtotal}`,
                });
            }
        } else {
            const subtotal = level * perLevelHP;
            total += subtotal;
            lines.push({
                label: `${charClass.name} (${level} level${level === 1 ? "" : "s"}, multiclassed)`,
                value: `${level} × (${hitDieAverage} + ${formatSigned(conMod)}) = ${subtotal}`,
            });
        }
    });

    lines.push({ label: "Max HP", value: `${total}` });
    return { lines, total };
}

/**
 * Max HP across one or more classes. RAW: the very first level the
 * character ever took (character.classes[0]) uses its class's full hit
 * die + Con modifier; every level after that - in ANY class, multiclassed
 * or not - uses that class's own hit die average (floor(hitDie/2)+1) +
 * Con modifier.
 *
 * This replaces the previous single-class-only formula, which also had a
 * bug: it added the raw Constitution SCORE instead of the modifier,
 * overstating HP for anyone with Constitution above 10.
 */
export function calculateMaxHP(character: Character): number {
    return getMaxHpBreakdown(character).total;
}
