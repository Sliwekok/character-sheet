import type { AbilityScores } from "@/interfaces/Characters";
import type { Background } from "@/interfaces/Background";
import type { AsiSlot } from "@/utils/abilityScoreImprovements";

/**
 * Reconstructs an imported character's missing background allocation (2024)
 * and Ability Score Improvements from the gap between the ability scores
 * D&D Beyond says the character has (`target`) and what this app would show
 * without them (`displayed` = base scores + this app's own race bonus).
 *
 * Example: D&D Beyond totals STR 18, this app shows STR 16, and the Fighter
 * has an unallocated level-4 ASI -> the ASI is recorded as `{ strength: 2 }`.
 *
 * Every point handed out here is returned as bookkeeping
 * (`backgroundAbilityBonuses` / `abilityScoreImprovements`) and the caller
 * bakes EXACTLY that amount into the final scores - never more - so
 * `draftFromCharacter` subtracts precisely what was added and a later
 * edit-and-save can't double-apply it (the bug fixed on 2026-09-14).
 *
 * Only complete, legal allocations are ever recorded:
 * - background: must match `abilityScoreOptions` exactly (+2/+1 or +1/+1/+1,
 *   only to the listed abilities), otherwise it's left unset;
 * - ASI slot: exactly 2 points (+2 to one ability or +1 to two). Any two
 *   missing points form a legal slot, so slots are filled while at least two
 *   points remain; a slot with nothing left to match is left unset.
 * Anything that doesn't fit (an odd point from a half-feat, a Primal
 * Champion-style bonus with no slot for it...) is reported as `leftover`
 * rather than forced into a slot.
 */

const ABILITY_KEYS: (keyof AbilityScores)[] = [
  "strength",
  "dexterity",
  "constitution",
  "intelligence",
  "wisdom",
  "charisma",
];

export interface AbilityScoreReconciliationInput {
  /** Scores this app would show with no background allocation and no ASIs applied. */
  displayed: AbilityScores;
  /** Final scores according to D&D Beyond. */
  target: AbilityScores;
  background: Background;
  /** Earned ASI slots, in the order they should be filled (see `getAsiSlots`). */
  asiSlots: AsiSlot[];
  /**
   * What D&D Beyond itself lists under its `background` modifiers group -
   * tried first (when it's a legal allocation that fits) so the recorded
   * background bonus matches D&D Beyond's, not just the totals.
   */
  preferredBackground?: Partial<AbilityScores>;
}

export interface AbilityScoreReconciliation {
  /** Points per ability D&D Beyond has on top of `displayed` (never negative). */
  missing: Partial<AbilityScores>;
  /** A complete, legal background allocation, or `undefined` if none could be matched (or the background has none). */
  backgroundAbilityBonuses?: Partial<AbilityScores>;
  /** Only slots that were fully matched - keyed by `AsiSlot.key`. */
  abilityScoreImprovements: Record<string, Partial<AbilityScores>>;
  filledSlots: AsiSlot[];
  unfilledSlots: AsiSlot[];
  /** Missing points that couldn't be placed into any legal allocation. */
  leftover: Partial<AbilityScores>;
  /** Abilities where this app already shows MORE than D&D Beyond (e.g. a reassigned racial bonus). */
  excess: Partial<AbilityScores>;
}

function total(scores: Partial<AbilityScores>): number {
  return ABILITY_KEYS.reduce((sum, key) => sum + (scores[key] ?? 0), 0);
}

function subtract(from: Partial<AbilityScores>, amount: Partial<AbilityScores>): Partial<AbilityScores> {
  const result: Partial<AbilityScores> = {};
  for (const key of ABILITY_KEYS) {
    const value = (from[key] ?? 0) - (amount[key] ?? 0);
    if (value !== 0) result[key] = value;
  }
  return result;
}

function fits(allocation: Partial<AbilityScores>, available: Partial<AbilityScores>): boolean {
  return ABILITY_KEYS.every((key) => (allocation[key] ?? 0) <= (available[key] ?? 0));
}

/** Every legal allocation of a background's `abilityScoreOptions`. */
export function backgroundAllocationCandidates(background: Background): Partial<AbilityScores>[] {
  const options = background.abilityScoreOptions;
  if (!options) return [];
  const from = options.from.filter((key, index) => options.from.indexOf(key) === index);
  const candidates: Partial<AbilityScores>[] = [];

  if (options.allocation === "2-1") {
    for (const plusTwo of from) {
      for (const plusOne of from) {
        if (plusOne !== plusTwo) candidates.push({ [plusTwo]: 2, [plusOne]: 1 });
      }
    }
    return candidates;
  }

  // "1-1-1": every 3-ability combination of `from` (usually exactly one).
  for (let a = 0; a < from.length; a++) {
    for (let b = a + 1; b < from.length; b++) {
      for (let c = b + 1; c < from.length; c++) {
        candidates.push({ [from[a]]: 1, [from[b]]: 1, [from[c]]: 1 });
      }
    }
  }
  return candidates;
}

/**
 * Greedily fills ASI slots (in order) from `available`: +2 to the ability
 * with the most missing points when it has at least 2, otherwise +1 to the
 * two abilities with the most missing points. Stops as soon as fewer than
 * two points remain.
 */
function fillAsiSlots(
  slots: AsiSlot[],
  available: Partial<AbilityScores>,
): { allocations: Record<string, Partial<AbilityScores>>; filled: AsiSlot[]; unfilled: AsiSlot[]; rest: Partial<AbilityScores> } {
  let rest = { ...available };
  const allocations: Record<string, Partial<AbilityScores>> = {};
  const filled: AsiSlot[] = [];
  const unfilled: AsiSlot[] = [];

  for (const slot of slots) {
    if (total(rest) < 2) {
      unfilled.push(slot);
      continue;
    }

    // Stable sort: most missing points first, ties in STR..CHA order.
    const ranked = ABILITY_KEYS.filter((key) => (rest[key] ?? 0) > 0).sort(
      (a, b) => (rest[b] ?? 0) - (rest[a] ?? 0),
    );
    const [first, second] = ranked;
    const allocation: Partial<AbilityScores> =
      (rest[first] ?? 0) >= 2 ? { [first]: 2 } : { [first]: 1, [second]: 1 };

    allocations[slot.key] = allocation;
    filled.push(slot);
    rest = subtract(rest, allocation);
  }

  return { allocations, filled, unfilled, rest };
}

export function reconcileAbilityScores({
  displayed,
  target,
  background,
  asiSlots,
  preferredBackground,
}: AbilityScoreReconciliationInput): AbilityScoreReconciliation {
  const missing: Partial<AbilityScores> = {};
  const excess: Partial<AbilityScores> = {};
  for (const key of ABILITY_KEYS) {
    const diff = target[key] - displayed[key];
    if (diff > 0) missing[key] = diff;
    if (diff < 0) excess[key] = -diff;
  }

  // Try "no background allocation" plus every legal background allocation
  // that fits inside the missing points, and keep whichever lets the most
  // points be applied overall. A background that's supposed to have an
  // allocation is preferred on ties, since D&D Beyond always applies it.
  const candidates = backgroundAllocationCandidates(background).filter((candidate) => fits(candidate, missing));
  const preferred = preferredBackground
    ? candidates.find((candidate) => ABILITY_KEYS.every((key) => (candidate[key] ?? 0) === (preferredBackground[key] ?? 0)))
    : undefined;
  const options: (Partial<AbilityScores> | undefined)[] = [
    ...(preferred ? [preferred] : []),
    ...candidates.filter((candidate) => candidate !== preferred),
    undefined,
  ];

  let best: AbilityScoreReconciliation | undefined;
  let bestApplied = -1;

  for (const backgroundAllocation of options) {
    const afterBackground = backgroundAllocation ? subtract(missing, backgroundAllocation) : { ...missing };
    const asi = fillAsiSlots(asiSlots, afterBackground);
    const applied = total(missing) - total(asi.rest);

    if (applied > bestApplied) {
      bestApplied = applied;
      best = {
        missing,
        backgroundAbilityBonuses: backgroundAllocation,
        abilityScoreImprovements: asi.allocations,
        filledSlots: asi.filled,
        unfilledSlots: asi.unfilled,
        leftover: asi.rest,
        excess,
      };
    }
  }

  return best!;
}

const SHORT_NAMES: Record<keyof AbilityScores, string> = {
  strength: "STR",
  dexterity: "DEX",
  constitution: "CON",
  intelligence: "INT",
  wisdom: "WIS",
  charisma: "CHA",
};

/** "+2 STR, +1 CON" - for import warnings. */
export function formatAbilityBonuses(bonuses: Partial<AbilityScores>, sign = "+"): string {
  return ABILITY_KEYS.filter((key) => (bonuses[key] ?? 0) !== 0)
    .map((key) => `${sign}${bonuses[key]} ${SHORT_NAMES[key]}`)
    .join(", ");
}
