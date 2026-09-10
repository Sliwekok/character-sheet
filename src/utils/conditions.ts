import { CONDITIONS, ConditionName } from "@/interfaces/Condition";
import { Edition } from "@/interfaces/Edition";

export { CONDITIONS };
export type { ConditionName };

/**
 * One-line effect summaries for each SRD condition, shown in a Tooltip next
 * to its toggle on the character sheet. Written from training knowledge
 * without a live rules source to check against - the same caveat this
 * codebase already flags for its spell-slot and weapon-mastery tables (see
 * spellcasting.ts and weaponMastery.ts's header comments) - so treat this as
 * a quick table reminder, not a verified quote, and check your book if the
 * exact wording matters.
 */
export const CONDITION_DESCRIPTIONS: Record<ConditionName, string> = {
  Blinded:
    "Can't see, automatically fails checks that require sight. Attack rolls against you have advantage; your attack rolls have disadvantage.",
  Charmed:
    "Can't attack the charmer or target them with harmful abilities/effects; the charmer has advantage on social checks against you.",
  Deafened: "Can't hear, automatically fails checks that require hearing.",
  Frightened:
    "Disadvantage on ability checks and attack rolls while the source of fear is in line of sight; can't willingly move closer to it.",
  Grappled:
    "Speed becomes 0. Ends if the grappler is incapacitated, or if you're removed from the grappler's reach.",
  Incapacitated: "Can't take actions or reactions.",
  Invisible:
    "Impossible to see without special senses; treated as heavily obscured for hiding. Attack rolls against you have disadvantage; your attack rolls have advantage.",
  Paralyzed:
    "Incapacitated, can't move or speak. Automatically fails Strength/Dexterity saves. Attacks against you have advantage, and a hit from within 5 ft is a critical hit.",
  Petrified:
    "Transformed, along with nonmagical objects worn/carried, into a solid substance; incapacitated, can't move or speak, unaware of surroundings. Resistant to all damage, immune to poison and disease.",
  Poisoned: "Disadvantage on attack rolls and ability checks.",
  Prone:
    "Can only crawl unless it stands up. Disadvantage on attack rolls. Attacks against you have advantage from within 5 ft, otherwise disadvantage.",
  Restrained:
    "Speed becomes 0. Disadvantage on attack rolls and Dexterity saves. Attack rolls against you have advantage.",
  Stunned:
    "Incapacitated, can't move, can speak only falteringly. Automatically fails Strength/Dexterity saves. Attacks against you have advantage.",
  Unconscious:
    "Incapacitated, can't move or speak, unaware of surroundings, drops what it's holding and falls prone. Automatically fails Strength/Dexterity saves. Attacks against you have advantage, and a hit from within 5 ft is a critical hit.",
};

/** Top of the exhaustion track both editions use - the per-level effects (and what happens at the cap) differ, see `getExhaustionEffectLines`. */
export const MAX_EXHAUSTION_LEVEL = 6;

/**
 * Effect text for a given exhaustion level, worded per the edition's own
 * table - 2024 replaced 2014's escalating list of distinct effects with a
 * flat, cumulative d20-test penalty. Same "not verified against a live
 * rules source" caveat as `CONDITION_DESCRIPTIONS` above.
 */
export function getExhaustionEffectLines(level: number, edition: Edition): string[] {
  if (level <= 0) return ["No exhaustion."];

  if (edition === "2024") {
    const lines = [
      `-${level} to every d20 Test (ability checks, attack rolls, and saving throws).`,
      `Speed reduced by ${level * 5} ft.`,
    ];
    if (level >= MAX_EXHAUSTION_LEVEL) lines.push("At level 6, the character dies.");
    return lines;
  }

  const levels2014 = [
    "Disadvantage on ability checks.",
    "Speed halved.",
    "Disadvantage on attack rolls and saving throws.",
    "Hit point maximum halved.",
    "Speed reduced to 0.",
    "Death.",
  ];
  return levels2014.slice(0, level);
}
