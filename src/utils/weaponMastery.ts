import { Character, CharacterClassLevel } from "@/interfaces/Characters";
import { Edition } from "@/interfaces/Edition";
import { Weapon, WeaponMasteryProperty } from "@/interfaces/Weapon";
import { StatLine, formatSigned } from "@/utils/statLine";
import { calculateProficiencyBonus } from "@/utils/calculateProficiencyBonus";

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

/**
 * The character's currently chosen weapon-mastery slot assignments (indexes
 * into `character.weapons`), cleaned up to only what's actually valid right
 * now: an index has to (a) exist in `character.weapons`, (b) point at a
 * weapon that still carries a `mastery` property (e.g. the weapon wasn't
 * swapped out for a different one at the same array position), and (c) fit
 * within the character's CURRENT `getWeaponMasteryCount` cap - a class
 * change, multiclass, or de-level can shrink that cap below what was
 * previously chosen, and a stale saved index shouldn't silently keep acting
 * as "active" once it no longer fits. Every other function in this file
 * reads the chosen set through this rather than
 * `character.chosenWeaponMasteryIndexes` directly, so a stale/out-of-range
 * value on disk can never grant more mastery access than the character
 * currently has.
 */
export function getChosenWeaponMasteryIndexes(character: Character): number[] {
    const cap = getWeaponMasteryCount(character.classes, character.edition);
    if (cap <= 0) return [];

    const stored = character.chosenWeaponMasteryIndexes ?? [];
    const valid = stored.filter((index) => character.weapons[index]?.mastery !== undefined);
    return valid.slice(0, cap);
}

/**
 * Whether THIS specific weapon (identified by its index in
 * `character.weapons`) currently has its mastery property active for this
 * character - i.e. one of their limited, class/level-gated mastery slots
 * (see `getWeaponMasteryCount`) is actually spent on it right now, not just
 * "the character has masteries available in general." A weapon whose
 * `mastery` property the player hasn't (or can no longer) assign a slot to
 * is inert: its special effect can't be triggered and its tooltip won't
 * show character-specific numbers (see `getWeaponMasteryLines`) - only the
 * static rules text.
 */
export function isWeaponMasteryActive(character: Character, weaponIndex: number): boolean {
    return getChosenWeaponMasteryIndexes(character).includes(weaponIndex);
}

/**
 * Toggles whether `weaponIndex` is one of the character's chosen mastery
 * slots, returning the new `chosenWeaponMasteryIndexes` to save back onto
 * the character (see `saveCharacter` in utils/storage.ts). Turning a slot
 * OFF always succeeds. Turning one ON is a safe no-op - returns the
 * unchanged list - when the weapon has no `mastery` property to assign at
 * all, or when the character is already at their `getWeaponMasteryCount`
 * cap; callers (e.g. a checkbox's `onChange`) don't need to pre-check
 * either condition themselves, since attempting to exceed the cap can never
 * silently grant an extra slot.
 */
export function toggleWeaponMasteryChoice(character: Character, weaponIndex: number): number[] {
    const weapon = character.weapons[weaponIndex];
    const current = getChosenWeaponMasteryIndexes(character);
    if (!weapon?.mastery) return current;

    if (current.includes(weaponIndex)) {
        return current.filter((index) => index !== weaponIndex);
    }

    const cap = getWeaponMasteryCount(character.classes, character.edition);
    if (current.length >= cap) return current;

    return [...current, weaponIndex];
}

/** Whether triggering a mastery's special effect means rolling more dice, and if so what kind. */
export type WeaponMasteryRollKind = "attackRoll" | "advantageAttackRoll" | "none";

export interface WeaponMasteryEffect {
    /** Full rules text, adapted from the 2024 Player's Handbook. */
    description: string;
    rollKind: WeaponMasteryRollKind;
    /** Label for the "Roll ..." button shown when `rollKind !== "none"`. */
    rollLabel?: string;
}

/**
 * The eight 2024 Weapon Mastery properties and what triggering each one
 * actually means at the table. Cleave and Nick both grant a genuine extra
 * attack roll; Vex grants advantage on your NEXT attack against the same
 * target, modeled here as "roll with advantage" for convenience rather than
 * tracking a persistent per-target flag. The rest (Graze, Push, Sap, Slow,
 * Topple) don't need their own dice roll - Graze/Topple's character-specific
 * numbers are surfaced separately via `getWeaponMasteryLines` below.
 */
export const WEAPON_MASTERY_EFFECTS: Record<WeaponMasteryProperty, WeaponMasteryEffect> = {
    Cleave: {
        description:
            "If you hit a creature with a Melee weapon Attack, you can make another Melee Attack roll against a second creature within 5 feet of the first that is also within your weapon's reach. If the second attack hits, that creature takes the weapon's damage, but without adding your ability modifier to the damage unless it's negative.",
        rollKind: "attackRoll",
        rollLabel: "Roll Cleave attack",
    },
    Graze: {
        description:
            "If your attack roll with this weapon misses a creature, you can deal damage to that creature equal to the ability modifier you used to make the attack roll (this damage doesn't have a type).",
        rollKind: "none",
    },
    Nick: {
        description:
            "When you take the Attack action and attack with this Light weapon, you can make one of your extra attacks with a second Light weapon as part of that same action instead of as a Bonus Action - usable only once per turn.",
        rollKind: "attackRoll",
        rollLabel: "Roll Nick attack",
    },
    Push: {
        description: "If you hit a creature with this weapon and it is Large or smaller, you can push it up to 10 feet straight away from yourself.",
        rollKind: "none",
    },
    Sap: {
        description: "If you hit a creature with this weapon, that creature has Disadvantage on its next attack roll before the start of your next turn.",
        rollKind: "none",
    },
    Slow: {
        description: "If you hit a creature with this weapon and deal damage to it, you can reduce its Speed by 10 feet until the start of your next turn.",
        rollKind: "none",
    },
    Topple: {
        description: "If you hit a creature with this weapon, you can force it to make a Constitution saving throw. On a failed save, the creature has the Prone condition.",
        rollKind: "none",
    },
    Vex: {
        description: "If you hit a creature with this weapon and deal damage to it, you gain Advantage on your next attack roll against that same creature before the end of your next turn.",
        rollKind: "advantageAttackRoll",
        rollLabel: "Roll Vex attack (advantage)",
    },
};

/**
 * Character-specific numeric lines to fold into a weapon's mastery tooltip -
 * Graze's flat damage-on-a-miss and Topple's save DC both depend on this
 * character's ability modifier/proficiency bonus, so unlike the static
 * `description` text above they're computed per-character here. Empty for
 * every other mastery (and for a weapon with no mastery at all).
 */
export function getWeaponMasteryLines(character: Character, weapon: Weapon, abilityModifier: number): StatLine[] {
    if (!weapon.mastery) return [];

    const lines: StatLine[] = [];
    if (weapon.mastery === "Graze") {
        lines.push({ label: "Bonus damage on a miss", value: formatSigned(abilityModifier) });
    }
    if (weapon.mastery === "Topple") {
        const saveDC = 8 + calculateProficiencyBonus(character) + abilityModifier;
        lines.push({ label: "Save DC (Constitution)", value: `${saveDC}` });
    }
    return lines;
}
