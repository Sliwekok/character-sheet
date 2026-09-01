import { AbilityScores } from "@/interfaces/Characters";
import { SpellcastingProgression } from "@/interfaces/SpellSlots";
import { SkillName } from "@/interfaces/Skill";
import { Edition } from "@/interfaces/Edition";

export type CasterProgression = "full" | "half" | "third" | "pact" | "none";

export interface ClassProficiencies {
  armor: string[];
  weapons: string[];
  tools?: string[];
  savingThrows: (keyof AbilityScores)[];
  skills: { choose: number; from: SkillName[] };
}

export interface ClassSpellcasting {
  ability: keyof AbilityScores;
  preparation: "prepared" | "known";
  ritualCasting?: boolean;
  spellSaveDC?: (abilityScores: AbilityScores, proficiencyBonus: number) => number;
  spellAttackBonus?: (abilityScores: AbilityScores, proficiencyBonus: number) => number;
  /**
   * Slots keyed by this class's OWN level. Used directly for a single-class
   * character; when multiclassing, full/half/third casters instead go
   * through utils/spellcasting.ts's combined-caster-level calculation,
   * which also reads this table (via the shared full-caster progression).
   */
  progression?: SpellcastingProgression;
  /**
   * Warlock's Pact Magic - a wholly separate pool from every other class's
   * `progression` table above. Never combined with other classes' slots,
   * in or out of multiclassing, and recovers on a short rest instead of a
   * long rest. Only ever set when `casterProgression` is 'pact'.
   */
  pactMagic?: SpellcastingProgression;
}

export interface CharacterClass {
  name: string;
  edition: Edition;
  hitDie: number;
  proficiencies: ClassProficiencies;
  /**
   * The reduced set of proficiencies granted when this class is gained via
   * multiclassing rather than as a character's starting class. Undefined
   * means "same as `proficiencies`" hasn't been filled in yet, NOT "grants
   * everything" - always fall back to a conservative subset if unset.
   */
  multiclassProficiencies?: Partial<ClassProficiencies>;
  primaryAbility: keyof AbilityScores;
  /**
   * How this class contributes to the SHARED multiclass spell slot table
   * (see utils/spellcasting.ts). 'pact' (Warlock) contributes nothing to
   * that shared table - its slots come from `spellcasting.pactMagic`
   * instead, calculated purely from Warlock level.
   */
  casterProgression: CasterProgression;
  spellcasting?: ClassSpellcasting;
  /** Character level (within this class) at which a subclass is chosen. */
  subclassLevel: number;
  /**
   * 2024 weapon mastery: number of weapons whose mastery property this
   * class can use, keyed by the level it's gained/increased at. Undefined
   * for 2014 classes and for classes with no weapon mastery feature.
   */
  weaponMasteryProgression?: Record<number, number>;
  /**
   * Every named mechanical benefit this BASE class grants (not counting
   * subclass features - see Subclass.features for those), in the order a
   * character gains them, e.g. Fighter has "Fighting Style"/"Second Wind"
   * at 1, "Action Surge" at 2, "Extra Attack" at 5, etc. `level` is the
   * character's level in this class at which the feature is gained - the
   * same convention Subclass.features uses, so both lists can be merged
   * and sorted together. A generic "Ability Score Improvement" entry is
   * included at every level a class grants one (4/8/12/16/19, plus a
   * class's own extra ASI levels) since it's a real row on the class
   * table, same as any other feature. This is the intended place to show
   * every feature a class will EVER grant - including ones above the
   * character's current level, marked as not yet reached by comparing
   * `level` to the character's class level - not just the ones already
   * unlocked.
   */
  features: { name: string; level: number; description: string }[];
}
