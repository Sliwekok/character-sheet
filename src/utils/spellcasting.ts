import { AbilityScores, Character, CharacterClassLevel } from "@/interfaces/Characters";
import { SpellSlots } from "@/interfaces/SpellSlots";
import { fullCasterProgression, halfCasterProgression, thirdCasterProgression } from "@/interfaces/SpellSlotsProgression";
import { CasterProgression, CharacterClass } from "@/interfaces/CharacterClass";
import { Subclass } from "@/interfaces/Subclass";
import { Spell } from "@/interfaces/Spell";
import { calculateAbilityModifiers } from "@/utils/abilityModifiers";

/** A single class/subclass/level - the shape both `Character.classes` (via a small field-name adapter) and `CharacterDraft.classes` reduce to for every calculation below. `characterClass` is optional to tolerate a draft row where the player hasn't picked a class yet. */
export type SpellcasterEntry = { characterClass?: CharacterClass; subclass?: Subclass; level: number };

/** A single class's own caster progression, honoring a subclass override (Eldritch Knight/Arcane Trickster grant 'third' on top of a base class - Fighter/Rogue - whose own `casterProgression` is 'none'). */
export function getEffectiveCasterProgression(
    characterClass: CharacterClass | undefined,
    subclass: Subclass | undefined
): CasterProgression {
    if (!characterClass) return "none";
    return subclass?.casterProgressionOverride ?? characterClass.casterProgression;
}

/** RAW per-class contribution to the SHARED multiclass caster level: full casters contribute their whole level; half casters (Paladin, Ranger) level/2 rounded down; third casters (Eldritch Knight, Arcane Trickster) level/3 rounded down, each rounded BEFORE summing. Warlock ('pact') and non-casters contribute nothing here - Pact Magic is entirely separate, see getPactSlotsForEntries. */
function roundedCasterContribution(progression: CasterProgression, level: number): number {
    switch (progression) {
        case "full":
            return level;
        case "half":
            return Math.floor(level / 2);
        case "third":
            return Math.floor(level / 3);
        default:
            return 0;
    }
}

function effectiveCasterLevelFor(entries: SpellcasterEntry[]): number {
    return entries.reduce((total, entry) => {
        if (!entry.characterClass) return total;
        return total + roundedCasterContribution(getEffectiveCasterProgression(entry.characterClass, entry.subclass), entry.level);
    }, 0);
}

/** Combined multiclass caster level (see `roundedCasterContribution`) for a `Character`'s actual `classes` array. */
export function getEffectiveCasterLevel(classes: CharacterClassLevel[]): number {
    return effectiveCasterLevelFor(toEntries(classes));
}

function toEntries(classes: CharacterClassLevel[]): SpellcasterEntry[] {
    return classes.map(({ class: characterClass, subclass, level }) => ({ characterClass, subclass, level }));
}

function levelsWithSlots(slots: SpellSlots | null | undefined): number[] {
    if (!slots) return [];
    return Object.entries(slots)
        .filter(([, count]) => (count ?? 0) > 0)
        .map(([level]) => Number(level));
}

function isNonPactCaster(entry: SpellcasterEntry): boolean {
    if (!entry.characterClass) return false;
    const progression = getEffectiveCasterProgression(entry.characterClass, entry.subclass);
    return progression !== "none" && progression !== "pact";
}

/**
 * The shared pool of spell slots (everything except Warlock Pact Magic) for
 * any set of class/subclass/level entries - one entry for a solo caster, or
 * several for a multiclassed one.
 *
 * A SOLO (single non-pact-caster-entry) full/half/third caster uses that
 * class's own hand-authored PHB table directly
 * (fullCasterProgression/halfCasterProgression/thirdCasterProgression,
 * keyed by ITS OWN level) - these do NOT line up with "floor(level/2) [or
 * /3] indexed into fullCasterProgression" at every level (e.g.
 * halfCasterProgression gets 3rd-level slots at character level 9, but
 * fullCasterProgression[floor(9/2)] = fullCasterProgression[4] has no
 * 3rd-level tier yet), because each class's solo table is its own official
 * PHB table, not derived from the multiclass formula.
 *
 * TWO OR MORE non-pact caster entries is real multiclassing, which RAW
 * genuinely does combine into fullCasterProgression via the summed,
 * per-class-rounded effective level - that combined-table lookup IS the
 * official multiclass rule (not an approximation), and is intentionally
 * less generous than adding up each class's own solo-table slots would be.
 */
function getSharedSlotsForEntries(entries: SpellcasterEntry[]): SpellSlots | null {
    const nonPact = entries.filter(isNonPactCaster);
    if (nonPact.length === 0) return null;

    if (nonPact.length === 1) {
        const entry = nonPact[0];
        const progression = getEffectiveCasterProgression(entry.characterClass, entry.subclass);
        const table = progression === "full" ? fullCasterProgression : progression === "half" ? halfCasterProgression : thirdCasterProgression;
        return table[entry.level] ?? null;
    }

    const combinedLevel = effectiveCasterLevelFor(nonPact);
    return combinedLevel > 0 ? fullCasterProgression[combinedLevel] ?? null : null;
}

/** Warlock's Pact Magic - its own pool, in or out of multiclassing, never combined with `getSharedSlotsForEntries` above. Only one Warlock entry is possible (ClassStep won't let the player add the same class twice), so no combining is needed here. */
function getPactSlotsForEntries(entries: SpellcasterEntry[]): SpellSlots | null {
    const pactEntry = entries.find(
        (entry) => entry.characterClass && getEffectiveCasterProgression(entry.characterClass, entry.subclass) === "pact"
    );
    if (!pactEntry?.characterClass?.spellcasting?.pactMagic) return null;
    return pactEntry.characterClass.spellcasting.pactMagic[pactEntry.level] ?? null;
}

/** The character's shared spell slots (everything except Warlock Pact Magic) - see `getSharedSlotsForEntries`'s header comment for the solo-vs-multiclass distinction. Returns null if nothing the character has contributes to this pool. */
export function getSpellSlots(character: Character): SpellSlots | null {
    return getSharedSlotsForEntries(toEntries(character.classes));
}

/** Warlock's separate Pact Magic pool, driven purely by the character's Warlock level. Returns null if the character has no Warlock levels. */
export function getPactMagicSlots(character: Character): SpellSlots | null {
    return getPactSlotsForEntries(toEntries(character.classes));
}

/**
 * Which spell levels (0 = cantrip, 1-9) are available to pick from right
 * now, across any set of class/subclass/level entries - one entry for a
 * solo caster, or several for a multiclassed one (see
 * `getSharedSlotsForEntries`). Drives the Spells step's level filter.
 *
 * Cantrips are only offered for 'full' and 'pact' progressions - 'half'
 * (Paladin/Ranger) and 'third' (Eldritch Knight/Arcane Trickster) casters
 * don't get any under either edition.
 */
export function getAvailableSpellLevelsForClasses(entries: SpellcasterEntry[]): number[] {
    const sharedSlots = getSharedSlotsForEntries(entries);
    const pactSlots = getPactSlotsForEntries(entries);
    const anyCantrips = entries.some((entry) => {
        if (!entry.characterClass) return false;
        const progression = getEffectiveCasterProgression(entry.characterClass, entry.subclass);
        return progression === "full" || progression === "pact";
    });

    const maxLevel = Math.max(0, ...levelsWithSlots(sharedSlots), ...levelsWithSlots(pactSlots));
    const levels = anyCantrips ? [0] : [];
    for (let level = 1; level <= maxLevel; level++) levels.push(level);
    return levels;
}

/** Single-class convenience wrapper around `getAvailableSpellLevelsForClasses`, for call sites (e.g. the random generator) that only ever deal with one class at a time. */
export function getAvailableSpellLevels(
    characterClass: CharacterClass | undefined,
    subclass: Subclass | undefined,
    level: number
): number[] {
    return getAvailableSpellLevelsForClasses([{ characterClass, subclass, level }]);
}

// --- Known/prepared spell count limits --------------------------------------------------
//
// None of this is in the app's data model (CharacterClass has no per-level
// "cantrips known"/"spells known" table, only spell SLOTS - see
// SpellSlotsProgression.ts), so the tables below are hand-authored,
// shared-across-classes approximations rather than each class's real PHB
// numbers (which do vary - e.g. Sorcerer starts with 4 cantrips, Bard with
// 2). Not cross-checked against the PHB - worth a check against your book
// if you need per-class precision. `preparation: "prepared"` classes
// (2014 Cleric/Druid/Paladin/Ranger/Wizard, and every 2024 caster - see
// data/2024/classes/Bard.ts's header comment) skip these tables entirely
// and use the real RAW formula (ability modifier + level) instead.

type SpellCountTable = Record<number, number>;

/** Cantrips known, for 'full'/'pact' progressions only - 'half' and 'third' casters don't get cantrips under either edition. */
const CANTRIPS_KNOWN: SpellCountTable = {
    1: 3, 2: 3, 3: 3, 4: 4, 5: 4, 6: 4, 7: 4, 8: 4, 9: 4,
    10: 5, 11: 5, 12: 5, 13: 5, 14: 5, 15: 5, 16: 5, 17: 5, 18: 5, 19: 5, 20: 5,
};

/** Leveled spells KNOWN (as opposed to prepared) for 2014's "known" casters - Bard, Ranger, Sorcerer, Warlock - loosely modeled on the Sorcerer's own table and reused for all four rather than keeping a separate curve per class. 2024 dropped "known" casters entirely. */
const LEVELED_SPELLS_KNOWN: SpellCountTable = {
    1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 7: 8, 8: 9, 9: 10, 10: 11,
    11: 12, 12: 12, 13: 13, 14: 13, 15: 14, 16: 14, 17: 15, 18: 15, 19: 16, 20: 17,
};

/** Spells known for third casters (Eldritch Knight/Arcane Trickster) - much slower growth than a real "known" caster, and starting at level 3 (when the subclass is even chosen), not 1. */
const THIRD_CASTER_SPELLS_KNOWN: SpellCountTable = {
    1: 0, 2: 0, 3: 3, 4: 4, 5: 4, 6: 4, 7: 5, 8: 6, 9: 6, 10: 7,
    11: 8, 12: 8, 13: 9, 14: 10, 15: 10, 16: 11, 17: 11, 18: 11, 19: 12, 20: 13,
};

function tableValue(table: SpellCountTable, level: number): number {
    return table[Math.min(20, Math.max(1, level))] ?? 0;
}

/** How many cantrips and leveled spells ONE class/subclass/level entry can know or have prepared right now. */
function singleClassSpellCap(
    entry: SpellcasterEntry,
    abilityScores: AbilityScores
): { cantrips: number; leveled: number } {
    const { characterClass, subclass, level } = entry;
    if (!characterClass) return { cantrips: 0, leveled: 0 };

    const progression = getEffectiveCasterProgression(characterClass, subclass);
    if (progression === "none") return { cantrips: 0, leveled: 0 };

    const cantrips = progression === "full" || progression === "pact" ? tableValue(CANTRIPS_KNOWN, level) : 0;

    if (!characterClass.spellcasting) {
        // Third caster (Eldritch Knight/Arcane Trickster) - no
        // `spellcasting` block on the base class (Fighter/Rogue) to read an
        // ability from, so this uses the flat table above instead of the
        // ability-modifier formula below (no ability-modifier lookup
        // needed here at all).
        return { cantrips, leveled: tableValue(THIRD_CASTER_SPELLS_KNOWN, level) };
    }

    const ability = characterClass.spellcasting.ability;
    const modifier = calculateAbilityModifiers(abilityScores)[ability];
    const leveled =
        characterClass.spellcasting.preparation === "prepared"
            ? Math.max(1, modifier + level)
            : tableValue(LEVELED_SPELLS_KNOWN, level);

    return { cantrips, leveled };
}

export interface SpellLimits {
    /** Spell levels currently pick-able at all (0 = cantrip) - same as getAvailableSpellLevelsForClasses(). */
    availableLevels: number[];
    /** Max cantrips the character can know right now, summed across every caster entry. */
    maxCantrips: number;
    /** Max leveled (1-9) spells the character can know/have prepared right now, summed across every caster entry - each class tracks its own known/prepared list in RAW, so this sums independent per-class caps rather than sharing one pool the way spell SLOTS do. */
    maxLeveled: number;
}

/**
 * The full set of limits SpellsStep enforces selection against, and
 * utils/characterDraft.ts's `revalidateDraftForClasses` prunes an existing
 * `spellsKnown` list down to whenever a class, subclass, or level changes.
 * Works for both a solo class (`entries` of length 1) and a multiclassed
 * character (`entries` of length 2+).
 */
export function getSpellLimits(entries: SpellcasterEntry[], abilityScores: AbilityScores): SpellLimits {
    const availableLevels = getAvailableSpellLevelsForClasses(entries);
    const totals = entries.reduce(
        (sum, entry) => {
            const cap = singleClassSpellCap(entry, abilityScores);
            return { cantrips: sum.cantrips + cap.cantrips, leveled: sum.leveled + cap.leveled };
        },
        { cantrips: 0, leveled: 0 }
    );
    return { availableLevels, maxCantrips: totals.cantrips, maxLeveled: totals.leveled };
}

/** Trims `spells` down to `limits`, dropping anything at a no-longer-available level first, then keeping only the first `maxCantrips`/`maxLeveled` of what's left (in existing order - i.e. "keep whatever was picked first"). Used both live in SpellsStep and by the class-change revalidation in utils/characterDraft.ts. */
export function pruneSpellsToLimits(spells: Spell[], limits: SpellLimits): Spell[] {
    const inLevel = spells.filter((spell) => limits.availableLevels.includes(spell.level));
    const cantrips = inLevel.filter((spell) => spell.level === 0).slice(0, limits.maxCantrips);
    const leveled = inLevel.filter((spell) => spell.level > 0).slice(0, limits.maxLeveled);
    return [...cantrips, ...leveled];
}
