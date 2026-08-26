import {SpellcastingProgression} from "@/interfaces/SpellSlots";

// These slot-count tables are shared by the 2014 and 2024 rules - the
// underlying spell slot math hasn't changed between editions, so
// src/data/2014/* and src/data/2024/* both import from here rather than
// keeping their own copies.

export const fullCasterProgression: SpellcastingProgression = {
    1: { 1: 2 },
    2: { 1: 3 },
    3: { 1: 4, 2: 2 },
    4: { 1: 4, 2: 3 },
    5: { 1: 4, 2: 3, 3: 2 },
    6: { 1: 4, 2: 3, 3: 3 },
    7: { 1: 4, 2: 3, 3: 3, 4: 1 },
    8: { 1: 4, 2: 3, 3: 3, 4: 2 },
    9: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 },
    10: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 },
    11: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 },
    12: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 },
    13: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1 },
    14: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1 },
    15: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1 },
    16: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1 },
    17: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1, 9: 1 },
    18: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 1, 7: 1, 8: 1, 9: 1 },
    19: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 1, 8: 1, 9: 1 },
    20: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 2, 8: 1, 9: 1 }
};

/**
 * Half casters (Paladin, Ranger). No spellcasting until class level 2 -
 * level 1 is intentionally empty, not `{1: 2}`.
 */
export const halfCasterProgression: SpellcastingProgression = {
    1:  {},
    2:  { 1: 2 },
    3:  { 1: 3 },
    4:  { 1: 3 },
    5:  { 1: 4, 2: 2 },
    6:  { 1: 4, 2: 2 },
    7:  { 1: 4, 2: 3 },
    8:  { 1: 4, 2: 3 },
    9:  { 1: 4, 2: 3, 3: 2 },
    10: { 1: 4, 2: 3, 3: 2 },
    11: { 1: 4, 2: 3, 3: 3 },
    12: { 1: 4, 2: 3, 3: 3 },
    13: { 1: 4, 2: 3, 3: 3, 4: 1 },
    14: { 1: 4, 2: 3, 3: 3, 4: 1 },
    15: { 1: 4, 2: 3, 3: 3, 4: 2 },
    16: { 1: 4, 2: 3, 3: 3, 4: 2 },
    17: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 },
    18: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 },
    19: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 },
    20: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 },
};

/**
 * Third casters - the Eldritch Knight (Fighter) and Arcane Trickster
 * (Rogue) subclasses. No spellcasting until class level 3, and capped at
 * 4th-level spell slots (3rd-level spells) even at level 20. This was
 * previously a stale copy of the half-caster shape (started at level 1,
 * capped too high, too early) - fixed here to the class's own much
 * thinner table.
 *
 * These exact numbers are from training knowledge and were NOT
 * cross-checked against the PHB this session (web search was unavailable
 * when this was written) - worth a quick check against your book.
 */
export const thirdCasterProgression: SpellcastingProgression = {
    1: {},
    2: {},
    3: { 1: 2 },
    4: { 1: 3 },
    5: { 1: 3 },
    6: { 1: 3 },
    7: { 1: 4, 2: 2 },
    8: { 1: 4, 2: 2 },
    9: { 1: 4, 2: 2 },
    10: { 1: 4, 2: 2 },
    11: { 1: 4, 2: 3 },
    12: { 1: 4, 2: 3 },
    13: { 1: 4, 2: 3 },
    14: { 1: 4, 2: 3 },
    15: { 1: 4, 2: 3 },
    16: { 1: 4, 2: 3 },
    17: { 1: 4, 2: 3 },
    18: { 1: 4, 2: 3 },
    19: { 1: 4, 2: 3, 3: 2 },
    20: { 1: 4, 2: 3, 3: 2 },
};

/**
 * Warlock's Pact Magic - a wholly separate pool from every other class's
 * slots (see CharacterClass.spellcasting.pactMagic). All of a Warlock's
 * slots are always the same level, so each entry below has exactly one
 * key: the slot level. The slot LEVEL climbs even while the slot COUNT
 * plateaus. These slots recover on a short rest, not a long rest, and are
 * never combined with the tables above - not even when multiclassing.
 * Unchanged between the 2014 and 2024 rules as far as I'm aware.
 */
export const pactMagicProgression: SpellcastingProgression = {
    1: { 1: 1 },
    2: { 1: 2 },
    3: { 2: 2 },
    4: { 2: 2 },
    5: { 3: 2 },
    6: { 3: 2 },
    7: { 4: 2 },
    8: { 4: 2 },
    9: { 5: 2 },
    10: { 5: 2 },
    11: { 5: 3 },
    12: { 5: 3 },
    13: { 5: 3 },
    14: { 5: 3 },
    15: { 5: 3 },
    16: { 5: 3 },
    17: { 5: 4 },
    18: { 5: 4 },
    19: { 5: 4 },
    20: { 5: 4 },
};
