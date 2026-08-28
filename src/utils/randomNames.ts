import { pickRandom } from "@/utils/dice";

/**
 * A small, generic fantasy-name word list for the random generator - not
 * tied to any particular race/culture, just enough variety that two
 * "all random" characters in a row don't look identical. Worth swapping
 * for per-race name lists later if that matters more than it does today.
 */
const FIRST_NAMES = [
    "Aeliana", "Bram", "Cassia", "Doran", "Elowen", "Fendrel", "Galia", "Halric",
    "Ithil", "Jorah", "Kaelith", "Lyra", "Mordecai", "Nessa", "Orin", "Perrin",
    "Quilla", "Rowan", "Seraphine", "Thane", "Ulric", "Vesna", "Wrenna", "Yorick",
];

const SURNAMES = [
    "Blackwood", "Cinderfall", "Dawnstrider", "Emberhart", "Frostbourne", "Greycastle",
    "Hollowmere", "Ironvale", "Lightbringer", "Moonshadow", "Nightingale", "Oakensworn",
    "Ravenscroft", "Stormwake", "Thistledown", "Vaelric", "Wyndham", "Yellowthorn",
];

export function randomCharacterName(): string {
    return `${pickRandom(FIRST_NAMES)} ${pickRandom(SURNAMES)}`;
}

export const ALIGNMENTS = [
    "Lawful Good",
    "Neutral Good",
    "Chaotic Good",
    "Lawful Neutral",
    "True Neutral",
    "Chaotic Neutral",
    "Lawful Evil",
    "Neutral Evil",
    "Chaotic Evil",
] as const;

export function randomAlignment(): string {
    return pickRandom(ALIGNMENTS);
}
