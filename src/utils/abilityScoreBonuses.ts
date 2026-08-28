import { AbilityScores } from "@/interfaces/Characters";
import { Background } from "@/interfaces/Background";
import { pickRandomN } from "@/utils/dice";

const ABILITY_KEYS: (keyof AbilityScores)[] = [
    "strength",
    "dexterity",
    "constitution",
    "intelligence",
    "wisdom",
    "charisma",
];

/**
 * Combines a full set of base ability scores with any number of partial
 * bonus sets - racial modifiers (`Race.abilityModifiers`, 2014), a
 * background's ability score allocation (`Background.abilityScoreOptions`,
 * 2024), or anything else added later - treating a missing entry in any
 * bonus set as +0. This is the ONE place a "final" ability score is
 * computed: `utils/characterDraft.ts`'s `finalizeDraft()` and
 * `utils/randomCharacter.ts` both call this rather than adding bonuses in
 * by hand, which is what let the two get out of sync with each other
 * before (neither applied race or background bonuses at all).
 */
export function sumAbilityScores(base: AbilityScores, ...bonusSets: Partial<AbilityScores>[]): AbilityScores {
    return ABILITY_KEYS.reduce((totals, key) => {
        totals[key] = base[key] + bonusSets.reduce((sum, bonuses) => sum + (bonuses[key] ?? 0), 0);
        return totals;
    }, {} as AbilityScores);
}

/**
 * The inverse of `sumAbilityScores` - recovers the base (pre-bonus) scores
 * from a final score by subtracting known bonuses. Used by
 * `draftFromCharacter()` to reconstruct what the player originally
 * assigned at the Ability Scores step, so re-opening a character for
 * editing doesn't show their race/background bonuses baked into the "base"
 * numbers.
 */
export function subtractAbilityScores(final: AbilityScores, ...bonusSets: Partial<AbilityScores>[]): AbilityScores {
    return ABILITY_KEYS.reduce((totals, key) => {
        totals[key] = final[key] - bonusSets.reduce((sum, bonuses) => sum + (bonuses[key] ?? 0), 0);
        return totals;
    }, {} as AbilityScores);
}

/**
 * Whether `bonuses` is a legal allocation of `background`'s
 * `abilityScoreOptions` (2024 only), OR - for a background with none
 * (every 2014 background, and "no background chosen yet") - that nothing
 * has been allocated at all. Gates both `AbilityScoresStep`'s background
 * bonus picker and `isDraftReadyToFinalize()`/`finalizeDraft()`, so a 2024
 * character can't be saved without its background bonus assigned, and a
 * 2014 character never has one to assign.
 */
export function isValidBackgroundAllocation(
    background: Background | undefined,
    bonuses: Partial<AbilityScores>
): boolean {
    const options = background?.abilityScoreOptions;
    const chosen = Object.entries(bonuses).filter(([, value]) => (value ?? 0) !== 0) as [
        keyof AbilityScores,
        number
    ][];

    if (!options) return chosen.length === 0;
    if (!chosen.every(([ability]) => options.from.includes(ability))) return false;

    if (options.allocation === "2-1") {
        if (chosen.length !== 2) return false;
        const values = chosen.map(([, value]) => value).sort((a, b) => b - a);
        return values[0] === 2 && values[1] === 1;
    }

    // "1-1-1"
    return chosen.length === 3 && chosen.every(([, value]) => value === 1);
}

/**
 * Randomly allocates a background's ability score bonus (2024 only) - the
 * random generator has no player to ask, so it rolls the allocation the
 * same way it rolls everything else. Returns `{}` for a background with no
 * `abilityScoreOptions` (every 2014 background).
 */
export function randomBackgroundAllocation(background: Background): Partial<AbilityScores> {
    const options = background.abilityScoreOptions;
    if (!options) return {};

    if (options.allocation === "2-1") {
        const [plusTwo, plusOne] = pickRandomN(options.from, 2);
        const bonuses: Partial<AbilityScores> = {};
        if (plusTwo) bonuses[plusTwo] = 2;
        if (plusOne) bonuses[plusOne] = 1;
        return bonuses;
    }

    // "1-1-1"
    return pickRandomN(options.from, 3).reduce(
        (bonuses, ability) => ({ ...bonuses, [ability]: 1 }),
        {} as Partial<AbilityScores>
    );
}
