/**
 * Partial types for the raw JSON returned by D&D Beyond's character data
 * endpoint (see README.md in this folder for what that is and why it's
 * "unofficial"). This only types the fields convert.ts actually reads -
 * the real response has a lot more (avatar URLs, source-book references,
 * rules text for every trait, etc.) that we don't need and don't type.
 *
 * A few fields here (`modifiers`, `feats`, `classSpells`) are typed loosely
 * (`unknown`/optional) because their exact shape wasn't directly confirmed
 * against a live character during development - see README.md's "Best
 * effort" section. convert.ts only reads through these with runtime type
 * guards (see readModifiers.ts), never assumes the shape blindly, so a
 * mismatch degrades to "skipped, with a warning" rather than a crash.
 */

export interface DdbStatEntry {
  id: number;
  name: string | null;
  value: number | null;
}

export interface DdbSourceRef {
  sourceId: number | null;
  pageNumber: number | null;
  sourceType?: number;
}

export interface DdbRacialTraitDefinition {
  id: number;
  name: string;
  description?: string;
  snippet?: string;
}

export interface DdbRace {
  isSubRace?: boolean;
  baseRaceName: string;
  fullName: string;
  baseName?: string;
  racialTraits?: { definition: DdbRacialTraitDefinition }[];
}

export interface DdbGrantedFeatRef {
  id: number;
  name: string;
  featIds: number[];
}

export interface DdbBackgroundDefinition {
  id: number;
  name: string;
  skillProficienciesDescription?: string;
  toolProficienciesDescription?: string;
  equipmentDescription?: string;
  featureName?: string;
  featureDescription?: string;
  grantedFeats?: DdbGrantedFeatRef[];
}

export interface DdbBackground {
  hasCustomBackground?: boolean;
  definition?: DdbBackgroundDefinition;
}

export interface DdbClassFeatureDefinition {
  id: number;
  name: string;
  requiredLevel?: number | null;
  description?: string;
}

export interface DdbClassFeature {
  definition?: DdbClassFeatureDefinition;
  levelScale?: unknown;
}

export interface DdbClassDefinition {
  id: number;
  name: string;
  spellCastingAbilityId?: number | null;
}

export interface DdbSubclassDefinition {
  id: number;
  name: string;
}

export interface DdbClassEntry {
  id: number;
  level: number;
  isStartingClass?: boolean;
  definition: DdbClassDefinition;
  subclassDefinition?: DdbSubclassDefinition | null;
}

export interface DdbInventoryProperty {
  id?: number;
  name: string;
}

export interface DdbGrantedModifier {
  type?: string;
  subType?: string;
  value?: number | null;
  fixedValue?: number | null;
  statId?: number | null;
  dice?: { diceCount?: number; diceValue?: number; diceString?: string } | null;
  isGranted?: boolean;
}

export interface DdbItemDefinition {
  id: number;
  name: string;
  magic?: boolean;
  type?: string | null;
  filterType?: string;
  rarity?: string;
  canAttune?: boolean;
  attunementDescription?: string;
  description?: string;
  damage?: { diceCount?: number; diceValue?: number; diceString?: string } | null;
  damageType?: string | null;
  properties?: DdbInventoryProperty[] | null;
  armorClass?: number | null;
  armorTypeId?: number | null;
  baseArmorName?: string | null;
  strengthRequirement?: number | null;
  stealthCheck?: number | null;
  grantedModifiers?: DdbGrantedModifier[];
  weight?: number;
  categoryId?: number | null;
  attackType?: number | null;
}

export interface DdbInventoryItem {
  id: number;
  definition: DdbItemDefinition;
  equipped?: boolean;
  isAttuned?: boolean;
  quantity?: number;
}

export interface DdbCurrencies {
  cp?: number;
  sp?: number;
  ep?: number;
  gp?: number;
  pp?: number;
}

export interface DdbNotes {
  allies?: string | null;
  personalPossessions?: string | null;
  otherHoldings?: string | null;
  organizations?: string | null;
  enemies?: string | null;
  backstory?: string | null;
  otherNotes?: string | null;
}

export interface DdbTraits {
  personalityTraits?: string | null;
  ideals?: string | null;
  bonds?: string | null;
  flaws?: string | null;
  appearance?: string | null;
}

/**
 * `modifiers` on the real endpoint groups bonus/proficiency/etc. grants by
 * source ("race" | "class" | "background" | "feat" | "item" | "condition"),
 * each entry shaped like `DdbGrantedModifier` above (same shape inventory
 * items use for `grantedModifiers`). Left as `unknown` here since this
 * project never got to confirm the exact key set live - see
 * readModifiers.ts, which validates this shape at runtime before trusting
 * any of it.
 */
export type DdbModifierGroups = Record<string, DdbGrantedModifier[] | undefined>;

export interface DdbCharacterData {
  id: number;
  name: string;
  alignmentId?: number | null;
  inspiration?: boolean;
  baseHitPoints?: number | null;
  bonusHitPoints?: number | null;
  overrideHitPoints?: number | null;
  removedHitPoints?: number | null;
  temporaryHitPoints?: number | null;
  age?: string | number | null;
  hair?: string | null;
  eyes?: string | null;
  skin?: string | null;
  height?: string | null;
  weight?: string | number | null;
  stats: DdbStatEntry[];
  bonusStats?: DdbStatEntry[];
  overrideStats?: DdbStatEntry[];
  background?: DdbBackground;
  race?: DdbRace;
  notes?: DdbNotes;
  traits?: DdbTraits;
  inventory?: DdbInventoryItem[];
  currencies?: DdbCurrencies;
  classes: DdbClassEntry[];
  modifiers?: DdbModifierGroups;
  feats?: unknown;
  classSpells?: unknown;
}

export interface DdbApiResponse {
  success: boolean;
  message?: string;
  data: DdbCharacterData;
}
