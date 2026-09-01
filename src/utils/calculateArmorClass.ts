import { Character } from '@/interfaces/Characters';
import { calculateAbilityModifiers } from './abilityModifiers';
import { StatLine, formatSigned } from './statLine';

export type ArmorClassBreakdown = {
    lines: StatLine[];
    total: number;
};

/**
 * Same math as `calculateArmorClass` below, but returns the individual line
 * items too - used by the character sheet's AC info tooltip so the player
 * can see exactly where the number came from instead of just the total.
 * `calculateArmorClass` is implemented in terms of this (not the other way
 * around) so the tooltip can never drift out of sync with the real
 * calculation.
 */
export function getArmorClassBreakdown(character: Character): ArmorClassBreakdown {
    const armor = character.equippedArmor;
    const shield = character.shield;
    const dexMod = calculateAbilityModifiers(character.abilityScores).dexterity;
    const lines: StatLine[] = [];
    let total: number;

    if (armor) {
        total = armor.baseAC;
        lines.push({ label: `${armor.name} base AC`, value: `${armor.baseAC}` });

        if (armor.dexterityModifier?.enabled) {
            const dexCap = armor.dexterityModifier.max;
            const applied = dexCap !== undefined ? Math.min(dexMod, dexCap) : dexMod;
            total += applied;
            lines.push({
                label: `Dexterity modifier${dexCap !== undefined ? ` (capped at +${dexCap})` : ""}`,
                value: formatSigned(applied),
            });
        }

        if (armor.bonus) {
            total += armor.bonus;
            lines.push({ label: "Armor magic bonus", value: formatSigned(armor.bonus) });
        }
    } else {
        // unarmored: 10 + full Dex modifier. (Previously added the raw Dex
        // SCORE here instead of the modifier - a second bug alongside the
        // getModifiers() one below, found while fixing this file.)
        total = 10 + dexMod;
        lines.push({ label: "Unarmored base", value: "10" });
        lines.push({ label: "Dexterity modifier", value: formatSigned(dexMod) });
    }

    if (shield) {
        total += shield.baseAC;
        lines.push({ label: shield.name, value: formatSigned(shield.baseAC) });
        if (shield.bonus) {
            total += shield.bonus;
            lines.push({ label: "Shield magic bonus", value: formatSigned(shield.bonus) });
        }
    }

    lines.push({ label: "Total AC", value: `${total}` });
    return { lines, total };
}

export function calculateArmorClass(character: Character): number {
    return getArmorClassBreakdown(character).total;
}
