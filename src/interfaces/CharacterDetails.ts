import { ConditionName } from "@/interfaces/Condition";

export interface CharacterAppearance {
  age?: string;
  height?: string;
  weight?: string;
  eyes?: string;
  skin?: string;
  hair?: string;
}

export interface CharacterFlavor {
  personalityTraits?: string;
  ideals?: string;
  bonds?: string;
  flaws?: string;
}

export interface DeathSaves {
  successes: number;
  failures: number;
}

/**
 * Everything the official character sheet's printable layout wants beyond
 * the core `Character` model - purely descriptive/flavor fields, plus a
 * handful of trackers (inspiration, death saves, conditions, exhaustion,
 * concentration) that have no mechanical effect anywhere else in the app:
 * toggling "Prone" here doesn't touch the AC/attack calculations, for
 * instance, and nothing here is auto-applied - the player is expected to
 * apply a condition's/exhaustion level's effect at the table the same way
 * they always would on paper (see utils/conditions.ts for what each one
 * does). Every field is optional: a character created before this existed,
 * or one from the random generator, simply prints/shows these boxes blank -
 * exactly like a fresh paper sheet - rather than breaking.
 */
export interface CharacterDetails {
  playerName?: string;
  inspiration?: boolean;
  deathSaves?: DeathSaves;
  /** Currently active SRD conditions - see utils/conditions.ts (`CONDITIONS`/`CONDITION_DESCRIPTIONS`) for the full list and the effect-summary text shown in each toggle's tooltip. Toggled from the character sheet's Status card. */
  conditions?: ConditionName[];
  /** 0-6 exhaustion level - see utils/conditions.ts's `getExhaustionEffectLines` for the (edition-dependent) effect text at each level. Toggled from the character sheet's Status card. */
  exhaustionLevel?: number;
  /**
   * Name of the spell currently being concentrated on, if any (see
   * `Spell.concentration`). Set/cleared via a "Concentrate" toggle next to
   * each concentration spell on the character sheet - starting to
   * concentrate on a new spell simply overwrites this, since the app
   * doesn't otherwise enforce "only one concentration spell at a time" or
   * concentration checks.
   */
  concentratingOn?: string;
  /**
   * Spell slots used since the last Long Rest, keyed by slot level (e.g.
   * `{ 1: 2, 3: 1 }` = two 1st-level and one 3rd-level slot spent). Only
   * the EXPENDED count is stored - the maximum always comes from the class
   * tables (utils/spellcasting.ts's `getSpellSlots`), so levelling up never
   * leaves stale totals behind. Toggled by the clickable slot pips and each
   * spell's "Cast" button on the Spells tab; cleared by "Long rest".
   */
  expendedSpellSlots?: Record<number, number>;
  /** Same as `expendedSpellSlots`, for the Warlock's separate Pact Magic pool (`getPactMagicSlots`). Cleared by both "Short rest" and "Long rest". */
  expendedPactSlots?: Record<number, number>;
  /** Freeform notes appended below the auto-generated proficiencies/languages list on the core sheet. */
  otherProficienciesNotes?: string;
  /** Freeform notes for the core sheet's "Features & Traits" box, alongside feats. */
  featuresAndTraitsNotes?: string;
  flavor?: CharacterFlavor;
  appearance?: CharacterAppearance;
  /** Physical description paragraph - the "Character Appearance" box on the details sheet. */
  appearanceNotes?: string;
  backstory?: string;
  alliesAndOrganizations?: string;
  organizationSymbolName?: string;
  additionalFeaturesAndTraits?: string;
  treasure?: string;
}
