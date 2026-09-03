export type HpMethod = "average" | "roll";

/**
 * One level's worth of hit points, exactly as granted - not just the
 * method used, but the actual number(s) involved. Stored on the character
 * itself (`Character.hpHistory`), not recomputed from scratch on every
 * render, because "roll" is genuinely random: the app has to remember what
 * was rolled, or re-opening the character sheet (or resaving it) would
 * silently reroll - and change - HP the player already locked in.
 *
 * Used for two things: summing to `Character.maxHP`, and rendering the
 * per-level breakdown in the HP info tooltip (see
 * utils/calculateMaxHp.ts's `getMaxHpBreakdown`).
 */
export interface HpLevelEntry {
  /** Index into `Character.classes` this level belongs to. */
  classIndex: number;
  /** The level *within that class* this entry represents (1-based) - NOT the character's total level across all classes. */
  levelInClass: number;
  /**
   * True only for `classes[0]`'s level 1 - the very first level the
   * character ever took. RAW always grants the FULL hit die value there,
   * never the average/rolled value, regardless of `method`.
   */
  isFirstLevel: boolean;
  /** The method this level actually used. Always `"average"` when `isFirstLevel` is true - a first level has no method to speak of, this is just a safe default. */
  method: HpMethod;
  hitDie: number;
  /** The raw, pre-Con-modifier value this level used: the hit die's max (first level), its fixed RAW average, or an actual die roll - whichever `isFirstLevel`/`method` picked. */
  dieValue: number;
  /**
   * Set only when `method === "roll"` and `isFirstLevel` is false - equal
   * to `dieValue`, but kept as a separate field so a breakdown can tell
   * "rolled a 4" apart from "averaged to 4" even on the levels where the
   * numbers happen to coincide.
   */
  roll?: number;
  /** The character's Constitution modifier at the time this breakdown was built. Recomputed fresh each time (see calculateMaxHp.ts), so a later change to Constitution is reflected across every level uniformly, same simplification the app already made before per-level history existed. */
  conModifier: number;
  /**
   * `dieValue + conModifier`, floored to a minimum of 1 - RAW never lets a
   * level up grant 0 or negative HP, however low the Constitution modifier
   * is (PHB, "Hit Points at Higher Levels").
   */
  hpGained: number;
}
