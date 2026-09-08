import { AbilityScores } from "@/interfaces/Characters";
import { CharacterClass } from "@/interfaces/CharacterClass";
import { pickRandom, pickRandomN } from "@/utils/dice";

const ABILITY_KEYS: (keyof AbilityScores)[] = [
    "strength",
    "dexterity",
    "constitution",
    "intelligence",
    "wisdom",
    "charisma",
];

/**
 * Minimal shape `getAsiSlots` needs from a class-and-level entry - both
 * `DraftClassEntry` (interfaces/CharacterDraft.ts, `characterClass` optional)
 * and `CharacterClassLevel` (interfaces/Characters.ts, `class` field instead)
 * satisfy this once mapped to it, so callers on either side of
 * `finalizeDraft`/`draftFromCharacter` can share this same logic.
 */
export interface AsiClassInput {
    characterClass?: CharacterClass;
    level: number;
}

/** One Ability Score Improvement a character has earned from class level progression. */
export interface AsiSlot {
    /** Stable key identifying this slot within an `abilityScoreImprovements` record - `${classIndex}:${level}`, e.g. `"0:4"` for the main class's first ASI. */
    key: string;
    classIndex: number;
    className: string;
    level: number;
}

/**
 * Every Ability Score Improvement a character has earned so far - one slot
 * per "Ability Score Improvement" entry in a class's `features` (see
 * CharacterClass.ts) at or below that class entry's current level. Each
 * class grants its own ASIs on its own progression, so a multiclass
 * character can have several at different total levels, and a class with a
 * bonus ASI (Fighter at 6, Rogue at 10) just has an extra same-named
 * `features` entry - nothing here needs to know about that as a special
 * case, since it's already baked into the class data.
 */
export function getAsiSlots(classes: AsiClassInput[]): AsiSlot[] {
    const slots: AsiSlot[] = [];
    classes.forEach((entry, classIndex) => {
        if (!entry.characterClass) return;
        entry.characterClass.features
            .filter((feature) => feature.name === "Ability Score Improvement" && feature.level <= entry.level)
            .forEach((feature) => {
                slots.push({
                    key: `${classIndex}:${feature.level}`,
                    classIndex,
                    className: entry.characterClass!.name,
                    level: feature.level,
                });
            });
    });
    return slots;
}

/**
 * Whether one slot's allocation is a complete, legal ASI choice: +2 to a
 * single ability, or +1 to two different abilities. `undefined`/`{}` (not
 * yet chosen) is NOT complete - same "absent means not done" convention as
 * `isValidBackgroundAllocation` (utils/abilityScoreBonuses.ts).
 */
export function isValidAsiAllocation(allocation: Partial<AbilityScores> | undefined): boolean {
    const chosen = Object.entries(allocation ?? {}).filter(([, value]) => (value ?? 0) !== 0) as [
        keyof AbilityScores,
        number
    ][];

    if (chosen.length === 1) return chosen[0][1] === 2;
    if (chosen.length === 2) return chosen.every(([, value]) => value === 1);
    return false;
}

/** Whether every earned ASI slot has a complete, legal allocation - gates moving past the Ability Scores step and finalizing the draft, the same role `isValidBackgroundAllocation` plays for the background bonus. */
export function areAsiSlotsComplete(slots: AsiSlot[], allocations: Record<string, Partial<AbilityScores>>): boolean {
    return slots.every((slot) => isValidAsiAllocation(allocations[slot.key]));
}

/**
 * Combines every slot's allocation into one bonus set, for feeding into
 * `sumAbilityScores`/`subtractAbilityScores` (utils/abilityScoreBonuses.ts)
 * alongside the race and background bonuses. A slot with no (or an
 * incomplete) allocation simply contributes nothing yet.
 */
export function sumAsiAllocations(
    slots: AsiSlot[],
    allocations: Record<string, Partial<AbilityScores>>
): Partial<AbilityScores> {
    const totals: Partial<AbilityScores> = {};
    for (const slot of slots) {
        const allocation = allocations[slot.key];
        if (!allocation) continue;
        for (const key of ABILITY_KEYS) {
            const value = allocation[key];
            if (!value) continue;
            totals[key] = (totals[key] ?? 0) + value;
        }
    }
    return totals;
}

/**
 * Drops any stored allocation whose slot no longer exists - a class was
 * removed or swapped, or its level dropped below the ASI's level. Called
 * whenever the class selection changes, the same trigger
 * `revalidateDraftForClasses` (utils/characterDraft.ts) already runs on.
 */
export function pruneAsiAllocations(
    slots: AsiSlot[],
    allocations: Record<string, Partial<AbilityScores>>
): Record<string, Partial<AbilityScores>> {
    const validKeys = new Set(slots.map((slot) => slot.key));
    const next: Record<string, Partial<AbilityScores>> = {};
    for (const [key, allocation] of Object.entries(allocations)) {
        if (validKeys.has(key)) next[key] = allocation;
    }
    return next;
}

/**
 * Randomly allocates every earned ASI slot - for each, a coin flip between
 * "+2 to one random ability" and "+1 to two different random abilities",
 * the same two legal shapes `isValidAsiAllocation` accepts. Mirrors
 * `randomBackgroundAllocation` (utils/abilityScoreBonuses.ts) for the same
 * reason: the random generator has no player to ask.
 */
export function randomAsiAllocations(slots: AsiSlot[]): Record<string, Partial<AbilityScores>> {
    const allocations: Record<string, Partial<AbilityScores>> = {};
    for (const slot of slots) {
        if (Math.random() < 0.5) {
            const ability = pickRandom(ABILITY_KEYS);
            allocations[slot.key] = { [ability]: 2 };
        } else {
            const [first, second] = pickRandomN(ABILITY_KEYS, 2);
            allocations[slot.key] = { [first]: 1, [second]: 1 };
        }
    }
    return allocations;
}
