import { Character, CharacterClassLevel } from "@/interfaces/Characters";
import { SpellSlots } from "@/interfaces/SpellSlots";
import { fullCasterProgression } from "@/interfaces/SpellSlotsProgression";

/**
 * RAW multiclass caster level: full casters contribute their whole class
 * level; half casters (Paladin, Ranger) contribute level/2 rounded down;
 * third casters (Eldritch Knight, Arcane Trickster - always via a
 * subclass override, see CharacterClassLevel.subclass) contribute level/3
 * rounded down. Each class's contribution is rounded down BEFORE summing,
 * not after. Warlock ('pact') and non-casters ('none') contribute nothing
 * here - Warlock's Pact Magic is calculated separately by
 * getPactMagicSlots below, and is never combined with this total.
 */
export function getEffectiveCasterLevel(classes: CharacterClassLevel[]): number {
    return classes.reduce((total, { class: charClass, subclass, level }) => {
        const progression = subclass?.casterProgressionOverride ?? charClass.casterProgression;

        switch (progression) {
            case "full":
                return total + level;
            case "half":
                return total + Math.floor(level / 2);
            case "third":
                return total + Math.floor(level / 3);
            default:
                // 'pact' and 'none' contribute nothing to the shared table.
                return total;
        }
    }, 0);
}

/**
 * The character's shared spell slots (everything except Warlock Pact
 * Magic) - correct for both a single-class caster and a multiclassed one,
 * since a single-class character is just a `classes` array of length 1
 * and the combined-level math degenerates to that class's own level.
 * Returns null if nothing the character has contributes to this pool.
 */
export function getSpellSlots(character: Character): SpellSlots | null {
    const effectiveLevel = getEffectiveCasterLevel(character.classes);
    if (effectiveLevel <= 0) return null;
    return fullCasterProgression[effectiveLevel] ?? null;
}

/**
 * Warlock's separate Pact Magic pool, driven purely by the character's
 * Warlock level - never combined with `getSpellSlots` above, in or out of
 * multiclassing. Returns null if the character has no Warlock levels.
 */
export function getPactMagicSlots(character: Character): SpellSlots | null {
    const warlockEntry = character.classes.find(
        ({ class: charClass }) => charClass.casterProgression === "pact"
    );
    if (!warlockEntry?.class.spellcasting?.pactMagic) return null;
    return warlockEntry.class.spellcasting.pactMagic[warlockEntry.level] ?? null;
}
