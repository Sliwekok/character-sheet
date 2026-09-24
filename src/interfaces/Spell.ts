import type { AbilityScores } from "@/interfaces/Characters";

/**
 * What a spell is FOR, used to decide which roll buttons / badges the
 * character sheet shows. A spell can have several (primary first) - e.g.
 * Ice Knife is ["damage"], Hold Person ["control"], Bless ["buff"], Cure
 * Wounds ["healing"], Spike Growth ["control", "damage"].
 */
export type SpellRole = "damage" | "healing" | "buff" | "debuff" | "control" | "defense" | "summon" | "utility";

/**
 * One rollable set of dice a spell produces (a damage roll, a heal, a
 * Temporary HP roll, a Bless die, ...). Values are for the spell's BASE
 * level (cantrips: character levels 1-4); upcasting and cantrip upgrades
 * are expressed as increments on top so the sheet can compute the dice for
 * any slot/character level - see utils/spellRolls.ts.
 */
export interface SpellDiceRoll {
  /** Short button label for spells with several rolls or a conditional one, e.g. "Initial", "Missing HP", "Per dart". */
  label?: string;
  /** Base dice: "8d6", "1d4+1", "2d8+1d6", a flat number like "70", or "" when nothing is rolled until a cantrip upgrade adds dice. */
  dice: string;
  /** "Fire", "Radiant", or a caster-choice list like "Acid/Cold/Fire". */
  damageType?: string;
  /** Add the caster's spellcasting ability modifier to this roll (e.g. Cure Wounds, Spiritual Weapon). */
  addModifier?: boolean;
  /** Separate instances each rolled on their own (Magic Missile darts, Scorching Ray rays). Defaults to 1. */
  count?: number;
  /** Dice/flat amount added per slot level above the spell's own level (or per `upcastEvery` levels). */
  upcastDice?: string;
  /** Only for "for every two slot levels above ..." wording. Defaults to 1. */
  upcastEvery?: number;
  /** Extra instances per slot level above the spell's own level (Magic Missile: +1 dart). */
  upcastCount?: number;
  /** Cantrips: dice added at each upgrade tier (character levels 5, 11, 17). */
  cantripDice?: string;
  /** Cantrips: extra instances per upgrade tier (Eldritch Blast: +1 beam). */
  cantripCount?: number;
}

/** Structured, hand-reviewed roll data for a spell - see data/spells/Spells.ts. */
export interface SpellMechanics {
  roles: SpellRole[];
  /** The caster makes a melee/ranged spell attack roll. */
  attack?: "melee" | "ranged";
  /** The saving throw the target makes against the caster's spell save DC. */
  save?: keyof AbilityScores;
  damage?: SpellDiceRoll[];
  healing?: SpellDiceRoll[];
  /** Other dice worth a roll button: Temporary HP, bonus/penalty dice, HP pools, duration/table rolls. */
  effects?: SpellDiceRoll[];
  /** Plain-language upcast effect not captured by the dice fields, e.g. "+1 target per slot level above 1st." */
  upcastNote?: string;
}

export interface Spell {
  name: string;
  level: number; // 0 = Cantrip, 1-9 = spell levels
  school: string;
  description: string;
  castingTime: string;
  range: string;
  components: string[]; // e.g., ['V', 'S', 'M']
  duration: string;
  ritual: boolean;
  concentration: boolean;
  /**
   * Optional so characters saved before this existed (whose `spellsKnown`
   * are frozen copies without it) and custom/imported spells still type-
   * check - the sheet re-hydrates it from the compendium by name (see
   * utils/spellRolls.ts's `useSpellMechanicsLookup`).
   */
  mechanics?: SpellMechanics;
}
