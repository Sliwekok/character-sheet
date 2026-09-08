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

/**
 * One spell a class/subclass feature grants outright - the classic
 * "innate/bonus spell" mechanic (e.g. a Warlock's Mystic Arcanum, a Psi
 * Warrior's Telekinetic Master, a Wizard's Improved Minor Illusion): a
 * permanent addition to the character's known spells that the feature
 * itself also lets you cast without expending a spell slot (usually with a
 * per-rest limit, sometimes at-will for a cantrip). NOT the same as a
 * "Domain Spells"/"Expanded Spell List"/"Circle Spells" table - those stay
 * plain description text, since they're always-prepared but still cost a
 * normal slot to cast, and NOT a temporary/situational spell-like ability
 * that's just one of several menu options (e.g. a Diviner's "The Third
 * Eye") - those aren't modeled here either. See utils/grantedSpells.ts for
 * how this is turned into an actual bonus known spell.
 */
export interface GrantedSpell {
  /**
   * Exact `Spell.name` this grant provides, when the feature names a fixed
   * spell (the common case - e.g. "Telekinesis", "Polymorph"). Omitted
   * when `choice` describes a player-picked spell instead (a feature can't
   * set both).
   */
  spellName?: string;
  /**
   * Present when the feature instead lets the player pick which spell
   * fills the grant, scoped by level only - e.g. a Warlock's Mystic
   * Arcanum ("choose one 6th-level spell"). This app has no per-class
   * spell list (see utils/spellcasting.ts's header comment on
   * getSpellLimits), so - same simplification used everywhere else spell
   * limits are enforced - `count` extra known spells of exactly
   * `spellLevel` simply become pickable in the Spells step, from the full
   * spell list, on top of the character's normal known/prepared caps.
   */
  choice?: { count: number; spellLevel: number };
  /** Short human-readable note on the free-cast limit, e.g. "once per long rest", "at will (cantrip)", "twice per long rest, scales with level". Purely descriptive - shown next to the spell, never enforced mechanically (this app doesn't track resource/rest state at all). */
  limit?: string;
  /**
   * Overrides the enclosing `ClassFeature.level` for gating THIS grant
   * specifically - e.g. Circle of the Land's terrain spells unlock
   * progressively at 3rd/5th/7th/9th level even though the "Circle
   * Spells"/"Circle of the Land Spells" feature that grants them is itself
   * listed at an earlier level (the level the subclass - and so this
   * choice of terrain - is gained at). Defaults to the feature's own
   * `level` when unset, same as every other grant.
   */
  atLevel?: number;
}

/**
 * The mechanically-tracked benefit of one Fighting Style option (Archery,
 * Defense, Dueling, ...) - set on the `FeatureChoiceOption` for any style
 * this app actually folds into a stat, so `utils/fightingStyles.ts` can
 * apply it wherever the corresponding number is calculated
 * (utils/calculateArmorClass.ts, utils/attackCalculations.ts) instead of
 * leaving it as descriptive-only text. Not every real Fighting Style has an
 * entry here - Great Weapon Fighting's damage-die reroll, Protection's
 * reaction, Blind Fighting's blindsight, Interception's reaction, and
 * Unarmed Fighting's bigger unarmed-strike die all stay text-only, the same
 * "not modeled mechanically here" simplification this app already uses for
 * things like a Ranger's Druidic Warrior cantrips (see grantedSpells
 * instead) or a Divine Order's proficiency grant.
 */
export interface FightingStyleEffect {
  /** Player-facing style name (e.g. "Defense") - used to label the stat-breakdown line this bonus produces, kept alongside the numbers rather than re-derived from the enclosing option's `label`. */
  styleName: string;
  /** Defense: +1 (RAW) bonus to AC while wearing armor - applies with or without a shield, and isn't affected by which armor it is. */
  armorClassBonusWhileArmored?: number;
  /** Archery: +2 (RAW) bonus to attack rolls made with ranged weapons. */
  rangedAttackRollBonus?: number;
  /** Dueling: +2 (RAW) bonus to damage rolls with a one-handed melee weapon, while wielding no other weapon. */
  meleeOneHandedDamageBonus?: number;
  /** Thrown Weapon Fighting (2024): +2 (RAW) bonus to damage rolls with a weapon that has the thrown property, while wielding no other weapon. */
  thrownWeaponDamageBonus?: number;
}

/**
 * One option in a `FeatureChoice` (see its header comment) - a small,
 * fixed, named alternative the player picks between, e.g. "Pact of the
 * Tome" as one of a Warlock's three Pact Boon options, or "Protector" as
 * one of a Cleric's two Divine Order options. `grantedSpells` is optional -
 * an option can grant nothing mechanically tracked here (e.g. Divine
 * Order's "Protector" just grants weapon/armor proficiency, which this app
 * doesn't model at the feature-choice level - only the option's NAME is
 * shown for those). `fightingStyleEffect` is the same idea for a Fighting
 * Style option - see its header comment.
 */
export interface FeatureChoiceOption {
  /** Stable identifier for this option, used as the value stored in `CharacterDraft.featureChoices`/`Character.featureChoices` - e.g. "tome", "protector". Never shown to the player directly; see `label` for that. */
  id: string;
  /** Player-facing name, e.g. "Pact of the Tome", "Protector". */
  label: string;
  /** Short note on what choosing this option does, shown alongside the option in the picker (and, once chosen, next to the feature) - e.g. "Learn 3 cantrips from any class's spell list, cast at will" or "Martial weapon and heavy armor proficiency". Purely descriptive, same spirit as GrantedSpell.limit. */
  summary?: string;
  grantedSpells?: GrantedSpell[];
  /** Set only on a Fighting Style option whose benefit this app tracks as a real stat bonus - see `FightingStyleEffect`'s header comment. */
  fightingStyleEffect?: FightingStyleEffect;
}

/**
 * A feature that requires the player to pick exactly one of a small, fixed
 * set of named options before its mechanical benefit (if any is modeled
 * here) applies - e.g. a Warlock's Pact Boon (Chain/Blade/Tome), a
 * Ranger's Fighting Style (a combat feat, or the spell-granting "Druidic
 * Warrior" option), a Path of the Giant barbarian's Giant Power
 * (Druidcraft or Thaumaturgy), a Cleric's Divine Order or a Druid's Primal
 * Order (Protector/Thaumaturge, Warden/Magician), or a Circle of the Land
 * druid's terrain (arid/polar/temperate/tropical, or the 2014 8-terrain
 * list) - each of which decides which spells that class/subclass feature
 * grants. The player's pick is stored in `CharacterDraft.featureChoices`/
 * `Character.featureChoices`, keyed by `utils/grantedSpells.ts`'s
 * `featureChoiceKey()`; see that file for how a pick turns into actual
 * granted spells (and `utils/spellcasting.ts`'s bonus-cap folding for
 * choice-type grants).
 */
export interface FeatureChoice {
  /** Stable identifier for this choice WITHIN its feature (a feature only ever has one `choice`, but the key still needs to be distinct from other data shape changes over time) - used as part of `featureChoiceKey()`'s stored key. */
  key: string;
  /** Shown as the picker's label, e.g. "Choose your Pact Boon", "Choose a terrain". */
  prompt: string;
  options: FeatureChoiceOption[];
}

/**
 * One named mechanical benefit a class or subclass grants at a given
 * level - shared shape for `CharacterClass.features` and
 * `Subclass.features` (see each field's own header comment for how they're
 * ordered/merged). `grantedSpells` is optional and only set on the small
 * number of features that grant a bonus known spell unconditionally - see
 * `GrantedSpell`'s header comment for exactly which features qualify.
 * `choice` is optional and only set when the grant (or a class of grants)
 * is instead gated behind a small named player choice - see
 * `FeatureChoice`'s header comment. A feature can have both (e.g. an
 * unconditional grant alongside a separate choice-gated one), though none
 * of the currently-tagged data does.
 */
export interface ClassFeature {
  name: string;
  level: number;
  description: string;
  grantedSpells?: GrantedSpell[];
  choice?: FeatureChoice;
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
  features: ClassFeature[];
}
