import { CharacterClassLevel } from "@/interfaces/Characters";
import { Edition } from "@/interfaces/Edition";

/**
 * How many weapons a character can currently apply their mastery property
 * to. Weapon Mastery is a 2024-only mechanic, so this is always 0 under
 * the 2014 rules.
 */
export function getWeaponMasteryCount(classes: CharacterClassLevel[], edition: Edition): number {
    if (edition !== "2024") return 0;

    return classes.reduce((total, { class: charClass, level }) => {
        const table = charClass.weaponMasteryProgression;
        if (!table) return total;

        const unlockedLevels = Object.keys(table)
            .map(Number)
            .filter((unlockLevel) => unlockLevel <= level)
            .sort((a, b) => b - a);

        return total + (unlockedLevels.length ? table[unlockedLevels[0]] : 0);
    }, 0);
}
