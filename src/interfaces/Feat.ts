import { AbilityScores } from "@/interfaces/Characters";
import { Edition } from "@/interfaces/Edition";
import { SkillName } from "@/interfaces/Skill";

export type FeatCategory =
  | "origin"
  | "general"
  | "fighting-style"
  | "epic-boon"
  /** Eberron (ERLW/EGW) dragonmark feats - "no other dragonmark" is a common prerequisite among them. */
  | "dragonmark"
  /** Ravenloft (VRGR) Dark Gift feats, granted by the setting's Dark Gift mechanic rather than normal feat progression. */
  | "dark-gift";

type AbilityKey = keyof AbilityScores;

/**
 * One prerequisite alternative - every field set on it must hold. A feat's
 * `prerequisites` list is OR'd together (any one entry satisfied is enough),
 * matching how 5etools encodes "Strength 13 or Dexterity 13". Evaluated by
 * utils/feats.ts's `checkFeatPrerequisites`; `campaigns`/`backgrounds`/
 * `other` can't be checked automatically and are only shown to the player.
 */
export interface FeatPrerequisite {
  /** Minimum total character level (or, with `className`, level in that class). */
  level?: number;
  className?: string;
  /** Alternatives: meeting any ONE of these minimum-score sets is enough. */
  abilities?: Partial<AbilityScores>[];
  /** "The ability to cast at least one spell" / Spellcasting or Pact Magic feature. */
  spellcasting?: boolean;
  /** Names of feats the character must already have. */
  feats?: string[];
  /** Species/race names (base name, optionally "Elf (Drow)"). Any one matches. */
  races?: string[];
  /** Class feature names the character must have (e.g. "Fighting Style"). */
  features?: string[];
  armorProficiency?: string;
  weaponProficiency?: string;
  campaigns?: string[];
  backgrounds?: string[];
  /** e.g. "dragonmark" - the character can't already have a feat of this category. */
  noOtherFeatOfCategory?: FeatCategory;
  other?: string;
}

/** A "choose N from this list" (or from everything, when `from` is omitted). */
export interface FeatPick<T extends string = string> {
  from?: T[];
  count: number;
}

/**
 * Filter for a "choose a spell" grant - every set field narrows the pool.
 * `classes` is checked against data/spellClassLists.json (the compendium's
 * Spell type has no class list of its own), `spellAttack` against
 * `Spell.mechanics.attack`.
 */
export interface FeatSpellFilter {
  levels?: number[];
  classes?: string[];
  schools?: string[];
  ritual?: boolean;
  spellAttack?: boolean;
  /** Pick from exactly these spell names. */
  fromList?: string[];
}

/** One spell (or one "choose a spell") a feat grants. */
export interface FeatSpellGrant {
  /** Compendium spell name - set for a fixed grant. */
  spell?: string;
  /** Set for a "choose" grant instead of `spell`. */
  choose?: FeatSpellFilter;
  count: number;
  /** "known" = learned (cantrips), "prepared" = always prepared, "innate" = cast without a slot. */
  usage: "known" | "prepared" | "innate";
  /** "At will", "1/long rest", "1/long rest each", ... */
  frequency?: string;
  /** Only gained from this character level on. */
  atLevel?: number;
  /** Only gained once the character has spell slots of this level (2024 "Adept" feats). */
  slotLevel?: number;
}

/**
 * One self-contained way of taking a feat's spells. Most spell feats have
 * exactly one; feats like Magic Initiate or Ritual Caster have one per
 * spell list and the player picks which (see `FeatSelection.choices.spellOption`).
 */
export interface FeatSpellOption {
  name?: string;
  /** Fixed spellcasting ability, or "inherit" (the ability this feat increased). */
  ability?: AbilityKey | "inherit";
  /** The player picks the spellcasting ability from these. */
  abilityChoice?: AbilityKey[];
  grants: FeatSpellGrant[];
}

/**
 * Everything a feat does that the app can apply to a character. Generated
 * into data/featMechanics.json by scripts/feats/build_feat_mechanics.py
 * (from 5etools' structured feat data plus a small hand-curated table for
 * flat speed/initiative/HP/AC bonuses), attached to each `Feat` when the
 * ruleset loads (data/featMechanics.ts). Every field is optional - a feat
 * whose benefits are purely situational (most combat feats) has none.
 *
 * Applied by utils/feats.ts: ability increases, skills, expertise, saves and
 * languages are baked into the saved character (with bookkeeping, same as
 * ASIs); HP / initiative / speed / AC / passive bonuses are computed live on
 * the sheet; granted spells are added to `grantedSpells`. Tools, armor,
 * weapons, resistances and senses are listed on the sheet.
 */
export interface FeatMechanics {
  /** 5etools source code, e.g. "PHB", "XPHB", "TCE". */
  source?: string;
  repeatable?: boolean;
  prerequisites?: FeatPrerequisite[];
  abilityIncrease?: {
    fixed?: Partial<AbilityScores>;
    /** Pick `count` different abilities from `from`, each gets +`amount`. */
    choose?: { from: AbilityKey[]; count: number; amount: number };
    /** Score cap - 20 normally, 30 for epic boons. */
    max: number;
  };
  skills?: {
    fixed?: SkillName[];
    choose?: FeatPick<SkillName>;
    /** 2024 Keen Mind/Observant: a chosen skill you're already proficient in becomes Expertise instead. */
    expertiseIfProficient?: boolean;
  };
  /** `choose` picks from skills the character is proficient in. */
  expertise?: { fixed?: SkillName[]; choose?: { count: number } };
  /** Skilled: any combination of skills or tools. */
  skillsOrTools?: { count: number };
  savingThrows?: {
    fixed?: AbilityKey[];
    choose?: FeatPick<AbilityKey>;
    /** Resilient: the save is whatever ability the feat increased - no separate pick. */
    matchAbilityIncrease?: boolean;
  };
  tools?: { fixed?: string[]; choose?: FeatPick & { kind?: "any" | "artisan" | "instrument" } };
  languages?: { fixed?: string[]; choose?: { count: number } };
  /** "light" / "medium" / "heavy" / "shield". */
  armor?: string[];
  weapons?: { fixed?: string[]; choose?: { count: number; description: string } };
  resistances?: { fixed?: string[]; choose?: FeatPick };
  immunities?: string[];
  conditionImmunities?: string[];
  /** Ranges in feet. */
  senses?: Partial<Record<"darkvision" | "blindsight" | "truesight" | "tremorsense", number>>;
  speedBonus?: number;
  /** Flat bonus (2014 Alert: +5). */
  initiativeBonus?: number;
  /** Add the proficiency bonus to initiative (2024 Alert). */
  initiativeProficiency?: boolean;
  /** Extra max HP per character level (Tough). */
  hpPerLevel?: number;
  /** Flat extra max HP (Boon of Fortitude). */
  hpFlat?: number;
  passiveBonus?: { perception?: number; investigation?: number };
  /** Medium Armor Master: medium armor's Dex cap becomes this (when Dex is 16+). */
  mediumArmorDexCap?: number;
  /** Dragon Hide: unarmored AC = this + Dex (a shield still adds). */
  unarmoredBaseAc?: number;
  /** Defense (2024 fighting-style feat): +N AC while wearing armor. */
  armoredAcBonus?: number;
  spellOptions?: FeatSpellOption[];
  /** Eldritch Invocations / Maneuvers / Metamagic picked by the feat - shown, not tracked. */
  optionalFeatures?: { name: string; count: number }[];
  /** Effects the sheet can't apply automatically, shown next to the feat. */
  notes?: string[];
}

export interface Feat {
  name: string;
  edition: Edition;
  category: FeatCategory;
  prerequisite?: string;
  description: string;
  abilityScoreIncrease?: { choose: number; from: (keyof AbilityScores)[] };
  /** Structured effects - see `FeatMechanics`. Attached when the ruleset loads; a feat saved on a character keeps the copy it was saved with. */
  mechanics?: FeatMechanics;
}

/**
 * Where a feat came from - decides which feats may fill it (see
 * utils/feats.ts's `getFeatSlots`).
 *
 * - "asi": a class's Ability Score Improvement level, taken as a feat instead
 *   of the +2/+1+1 (key `asi:<classIndex>:<level>`, same suffix as
 *   `AsiSlot.key`).
 * - "epic-boon": a 2024 class's level 19 Epic Boon feature (`epic:<classIndex>:<level>`).
 * - "origin": the 2024 background's Origin feat (`origin`).
 * - "species": a species/race trait granting a feat - 2024 Human's Versatile,
 *   2014 Variant Human / Custom Lineage (`species`).
 * - "bonus": an extra feat the DM granted (`bonus:<n>`).
 */
export type FeatSlotKind = "asi" | "epic-boon" | "origin" | "species" | "bonus";

/**
 * The player's resolved pick for one feat slot. `abilityBonuses` is the
 * bookkeeping record of exactly what this feat added to `abilityScores`
 * (same invariant as `abilityScoreImprovements`: utils/characterDraft.ts
 * adds it on save and subtracts it on edit), so it's stored rather than
 * re-derived from feat data that might change between app versions.
 *
 * `choices` holds every other pick, keyed by what it's for (values are
 * lists even for single picks):
 * - "ability"        abilities given the `abilityIncrease.choose` bonus
 * - "skills" / "expertise" / "savingThrows" / "tools" / "languages" / "resistances"
 * - "skillsOrTools"  Skilled's mixed picks (skill names or tool names)
 * - "spellOption"    index (as a string) into `mechanics.spellOptions`
 * - "spellAbility"   chosen spellcasting ability for the spell option
 * - "spells:<n>"     spell names picked for grant n of the chosen option
 */
export interface FeatSelection {
  /** Stable slot id - see `FeatSlotKind`. */
  slot: string;
  featName: string;
  abilityBonuses?: Partial<AbilityScores>;
  choices?: Record<string, string[]>;
}
