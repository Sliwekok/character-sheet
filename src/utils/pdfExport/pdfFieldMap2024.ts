import { AbilityScores } from "@/interfaces/Characters";
import { SkillName } from "@/interfaces/Skill";
import { ConditionName } from "@/interfaces/Condition";

/**
 * Reverse-engineered AcroForm field map for the 2024 fillable character
 * sheet (`DnD_2024_CharacterSheet__DLTHEDM__Fillable.pdf`, 2 pages, 412
 * fields). Unlike the 2014 template (see pdfFieldMap2014.ts), most fields on
 * this one already have readable names (`"AC"`, `"ATHLETICS"`, `"Prof
 * Bonus"`...), so this map is mostly a direct lookup; only the generic
 * `"Text Field38"`.."Text Field181"` (weapon/spell table rows) and
 * `"Check Box0"`.."Check Box198"` (every diamond/circle toggle) needed
 * geometric reverse-engineering, done by rendering both pages to images and
 * cross-referencing each widget's `/Rect` against the named fields next to
 * it.
 *
 * Deliberately NOT mapped here (same policy as the 2014 map, applied
 * consistently):
 * - `Current HP`, `Temp HP`, `Spent HD` (hit dice used) - these are meant to
 *   be tracked live on the printed/PDF sheet as the session goes, the same
 *   reasoning that excludes Death Saves.
 * - The 6 Death Save checkboxes (Check Box1-6) and the "expended" spell slot
 *   diamonds (Check Box72-93) - same live-tracking reasoning; only slot
 *   *totals* are filled.
 * - `Experience Points` - the app doesn't track XP anywhere.
 * - `Appearance` (a pushbutton/image field for a character portrait) - an
 *   image widget, not something a snapshot of character data can fill.
 * - The Species Traits "SIZE" checkboxes (Check Box15/16, Small/Medium) -
 *   `Race` has no size field to source this from.
 * - The per-spell "prepared" checkbox doesn't exist on this template at all
 *   (only per-row concentration/ritual/component toggles do - see
 *   `PDF_2024_SPELL_ROW_COMPONENT_CHECKBOXES` - those ARE filled, since
 *   they're a property of the spell itself, not a live/session toggle).
 */

export const PDF_2024_TEXT_FIELDS = {
  background: "Background",
  class: "Class",
  species: "Species",
  subclass: "Subclass",
  level: "Level",
  ac: "AC",
  maxHp: "Max HP",
  maxHd: "MAX HD",
  profBonus: "Prof Bonus",
  speed: "SPEED",
  exhaustion: "EXHAUSTION",
} as const;

export const PDF_2024_ABILITY_SCORE_FIELDS: Record<keyof AbilityScores, string> = {
  strength: "STR SORE", // sic - typo in the real template, preserved
  dexterity: "DEX SCORE",
  constitution: "CON SCORE",
  intelligence: "INTR SCORE", // sic
  wisdom: "WIS SCORE",
  charisma: "CHA SCORE",
};

export const PDF_2024_ABILITY_MOD_FIELDS: Record<keyof AbilityScores, string> = {
  strength: "SRT MOD", // sic
  dexterity: "DEX MOD",
  constitution: "CON MOD",
  intelligence: "INT MOD",
  wisdom: "WIS MOD",
  charisma: "CHA MOD",
};

export const PDF_2024_SAVE_TEXT_FIELDS: Record<keyof AbilityScores, string> = {
  strength: "STR SAVE",
  dexterity: "DEX SAVE",
  constitution: "CON SAVE",
  intelligence: "INT SAVE",
  wisdom: "WIS SAVE",
  charisma: "CHA SAVE",
};

/** One circle per ability - the save row's proficiency toggle. */
export const PDF_2024_SAVE_PROFICIENCY_CHECKBOXES: Record<keyof AbilityScores, string> = {
  strength: "Check Box17",
  dexterity: "Check Box54",
  constitution: "Check Box56",
  intelligence: "Check Box59",
  wisdom: "Check Box58",
  charisma: "Check Box57",
};

export const PDF_2024_SKILL_TEXT_FIELDS: Record<SkillName, string> = {
  Acrobatics: "ACROBATICS",
  "Animal Handling": "ANIMAL HANDLING",
  Arcana: "ARCANA",
  Athletics: "ATHLETICS",
  Deception: "DECEPTION",
  History: "HISTORY",
  Insight: "INSIGHT",
  Intimidation: "INTIMIDATION",
  Investigation: "INVESTIGATION",
  Medicine: "MEDICINE",
  Nature: "NATURE",
  Perception: "PERCEPTION",
  Performance: "PERFORMANCE",
  Persuasion: "PERSUASION",
  Religion: "RELIGION",
  "Sleight of Hand": "SLEIGHT OF HAND",
  Stealth: "STEALTH",
  Survival: "SURVIVAL",
};

/**
 * Each skill row actually has TWO overlapping circles on this template (a
 * proficiency/expertise pair, matching the real 2024 sheet's design) - see
 * this file's header comment. The app has no concept of skill expertise
 * (only plain proficiency), so only ONE circle per skill is mapped here
 * (the geometrically "back/left" one of the pair); the other is left
 * permanently blank rather than guessed at.
 */
export const PDF_2024_SKILL_PROFICIENCY_CHECKBOXES: Record<SkillName, string> = {
  Athletics: "Check Box18",
  Acrobatics: "Check Box21",
  "Sleight of Hand": "Check Box23",
  Stealth: "Check Box25",
  Arcana: "Check Box27",
  History: "Check Box29",
  Investigation: "Check Box31",
  Nature: "Check Box33",
  Religion: "Check Box35",
  "Animal Handling": "Check Box37",
  Insight: "Check Box39",
  Medicine: "Check Box41",
  Perception: "Check Box43",
  Survival: "Check Box45",
  Deception: "Check Box47",
  Intimidation: "Check Box49",
  Performance: "Check Box51",
  Persuasion: "Check Box53",
};

/** Top-of-sheet toggles that aren't part of a repeating group. */
export const PDF_2024_MISC_CHECKBOXES = {
  /** The small diamond next to "SHIELD" under the AC shape. */
  shield: "Check Box0",
  /** The big X-in-a-diamond under "HEROIC INSPIRATION". */
  heroicInspiration: "Check Box7",
} as const;

/** "EQUIPMENT TRAINING & PROFICIENCIES" diamonds - matched to `armorProficiencies`/`weaponProficiencies` by a case-insensitive substring test, since the app stores those as free-text strings rather than a fixed enum. */
export const PDF_2024_ARMOR_TRAINING_CHECKBOXES: Record<"light" | "medium" | "heavy" | "shields", string> = {
  light: "Check Box8",
  medium: "Check Box9",
  heavy: "Check Box10",
  shields: "Check Box11",
};
export const PDF_2024_WEAPON_TRAINING_CHECKBOXES: Record<"simple" | "martial" | "improvised", string> = {
  simple: "Check Box12",
  martial: "Check Box13",
  improvised: "Check Box14",
};

/** The 12-condition grid (of the SRD's 14 - this template has no Grappled/Prone boxes). */
export const PDF_2024_CONDITION_CHECKBOXES: Partial<Record<ConditionName, string>> = {
  Blinded: "Check Box60",
  Charmed: "Check Box61",
  Deafened: "Check Box62",
  Invisible: "Check Box63",
  Incapacitated: "Check Box64",
  Frightened: "Check Box65",
  Poisoned: "Check Box66",
  Petrified: "Check Box67",
  Paralyzed: "Check Box68",
  Unconscious: "Check Box69",
  Stunned: "Check Box70",
  Restrained: "Check Box71",
};

export const PDF_2024_CURRENCY_FIELDS = {
  copper: "CP",
  silver: "SP",
  electrum: "EP",
  gold: "GP",
  platinum: "PP",
} as const;

/** One 4-column row per weapon slot in the "WEAPONS & DAMAGE CANTRIPS" table (6 rows on the real sheet). */
export const PDF_2024_WEAPON_FIELDS: { name: string; atkBonus: string; damage: string; notes: string }[] = [
  { name: "Text Field38", atkBonus: "Text Field39", damage: "Text Field40", notes: "Text Field41" },
  { name: "Text Field42", atkBonus: "Text Field43", damage: "Text Field44", notes: "Text Field45" },
  { name: "Text Field46", atkBonus: "Text Field47", damage: "Text Field48", notes: "Text Field49" },
  { name: "Text Field50", atkBonus: "Text Field51", damage: "Text Field52", notes: "Text Field53" },
  { name: "Text Field54", atkBonus: "Text Field55", damage: "Text Field56", notes: "Text Field57" },
  { name: "Text Field58", atkBonus: "Text Field59", damage: "Text Field60", notes: "Text Field61" },
];

export const PDF_2024_PAGE1_FIELDS = {
  toolsAndOtherWeapons: "TOOLS",
  masteries: "MASTERIES",
  classFeaturesPrimary: "CLASS FEATURES 1",
  classFeaturesOverflow: "CLASS FEATURES 2",
  feats: "FEATS",
  speciesTraits: "TRAITS",
  languages: "LANGUAGES",
} as const;

export const PDF_2024_SPELLCASTING_FIELDS = {
  ability: "SPELLCASTING ABILITY",
  modifier: "SPELLCASTING MOD",
  saveDC: "SPELL SAVE DC",
  attackBonus: "SPELL ATTK BONUS",
} as const;

/** "Total" column only - the "Expended" diamonds next to them are live-tracked, see header comment. */
export const PDF_2024_SPELL_SLOT_TOTAL_FIELDS: Record<number, string> = {
  1: "SPELL SLOT TOTAL 1",
  2: "SPELL SLOT TOTAL 2",
  3: "SPELL SLOT TOTAL 3",
  4: "SPELL SLOT TOTAL 4",
  5: "SPELL SLOT TOTAL 5",
  6: "SPELL SLOT TOTAL 6",
  7: "SPELL SLOT TOTAL 7",
  8: "SPELL SLOT TOTAL 8",
  9: "SPELL SLOT TOTAL 9",
};

export type Pdf2024SpellRowFields = {
  level: string;
  name: string;
  castingTime: string;
  range: string;
  notes: string;
};

export type Pdf2024SpellRowCheckboxes = {
  concentration: string;
  ritual: string;
  verbal: string;
  somatic: string;
  material: string;
};

/** The 20-row "CANTRIPS & PREPARED SPELLS" table - one unified table (no per-level columns like the 2014 sheet). */
export const PDF_2024_SPELL_ROW_FIELDS: Pdf2024SpellRowFields[] = [
  { level: "Text Field82", name: "Text Field83", castingTime: "Text Field84", range: "Text Field85", notes: "Text Field86" },
  { level: "Text Field87", name: "Text Field88", castingTime: "Text Field89", range: "Text Field90", notes: "Text Field91" },
  { level: "Text Field92", name: "Text Field93", castingTime: "Text Field94", range: "Text Field95", notes: "Text Field96" },
  { level: "Text Field97", name: "Text Field98", castingTime: "Text Field99", range: "Text Field100", notes: "Text Field101" },
  { level: "Text Field102", name: "Text Field103", castingTime: "Text Field104", range: "Text Field105", notes: "Text Field106" },
  { level: "Text Field107", name: "Text Field108", castingTime: "Text Field109", range: "Text Field110", notes: "Text Field111" },
  { level: "Text Field112", name: "Text Field113", castingTime: "Text Field114", range: "Text Field115", notes: "Text Field116" },
  { level: "Text Field117", name: "Text Field118", castingTime: "Text Field119", range: "Text Field120", notes: "Text Field121" },
  { level: "Text Field122", name: "Text Field123", castingTime: "Text Field124", range: "Text Field125", notes: "Text Field126" },
  { level: "Text Field127", name: "Text Field128", castingTime: "Text Field129", range: "Text Field130", notes: "Text Field131" },
  { level: "Text Field132", name: "Text Field133", castingTime: "Text Field134", range: "Text Field135", notes: "Text Field136" },
  { level: "Text Field137", name: "Text Field138", castingTime: "Text Field139", range: "Text Field140", notes: "Text Field141" },
  { level: "Text Field142", name: "Text Field143", castingTime: "Text Field144", range: "Text Field145", notes: "Text Field146" },
  { level: "Text Field147", name: "Text Field148", castingTime: "Text Field149", range: "Text Field150", notes: "Text Field151" },
  { level: "Text Field152", name: "Text Field153", castingTime: "Text Field154", range: "Text Field155", notes: "Text Field156" },
  { level: "Text Field157", name: "Text Field158", castingTime: "Text Field159", range: "Text Field160", notes: "Text Field161" },
  { level: "Text Field162", name: "Text Field163", castingTime: "Text Field164", range: "Text Field165", notes: "Text Field166" },
  { level: "Text Field167", name: "Text Field168", castingTime: "Text Field169", range: "Text Field170", notes: "Text Field171" },
  { level: "Text Field172", name: "Text Field173", castingTime: "Text Field174", range: "Text Field175", notes: "Text Field176" },
  { level: "Text Field177", name: "Text Field178", castingTime: "Text Field179", range: "Text Field180", notes: "Text Field181" },
];

/** Per-row C(oncentration)/R(itual)/V/S/M toggles, geometrically matched to each spell row above (see this file's header comment for the two-y-band clustering used to tell them apart). */
export const PDF_2024_SPELL_ROW_COMPONENT_CHECKBOXES: Pdf2024SpellRowCheckboxes[] = [
  { concentration: "Check Box95", ritual: "Check Box94", verbal: "Check Box97", somatic: "Check Box98", material: "Check Box96" },
  { concentration: "Check Box99", ritual: "Check Box100", verbal: "Check Box103", somatic: "Check Box101", material: "Check Box102" },
  { concentration: "Check Box104", ritual: "Check Box105", verbal: "Check Box108", somatic: "Check Box106", material: "Check Box107" },
  { concentration: "Check Box109", ritual: "Check Box110", verbal: "Check Box113", somatic: "Check Box111", material: "Check Box112" },
  { concentration: "Check Box114", ritual: "Check Box115", verbal: "Check Box118", somatic: "Check Box116", material: "Check Box117" },
  { concentration: "Check Box119", ritual: "Check Box120", verbal: "Check Box123", somatic: "Check Box121", material: "Check Box122" },
  { concentration: "Check Box124", ritual: "Check Box125", verbal: "Check Box128", somatic: "Check Box126", material: "Check Box127" },
  { concentration: "Check Box129", ritual: "Check Box130", verbal: "Check Box133", somatic: "Check Box131", material: "Check Box132" },
  { concentration: "Check Box134", ritual: "Check Box135", verbal: "Check Box138", somatic: "Check Box136", material: "Check Box137" },
  { concentration: "Check Box139", ritual: "Check Box140", verbal: "Check Box143", somatic: "Check Box141", material: "Check Box142" },
  { concentration: "Check Box144", ritual: "Check Box145", verbal: "Check Box148", somatic: "Check Box146", material: "Check Box147" },
  { concentration: "Check Box149", ritual: "Check Box150", verbal: "Check Box153", somatic: "Check Box151", material: "Check Box152" },
  { concentration: "Check Box154", ritual: "Check Box155", verbal: "Check Box158", somatic: "Check Box156", material: "Check Box157" },
  { concentration: "Check Box159", ritual: "Check Box160", verbal: "Check Box163", somatic: "Check Box161", material: "Check Box162" },
  { concentration: "Check Box164", ritual: "Check Box165", verbal: "Check Box168", somatic: "Check Box166", material: "Check Box167" },
  { concentration: "Check Box169", ritual: "Check Box170", verbal: "Check Box173", somatic: "Check Box171", material: "Check Box172" },
  { concentration: "Check Box174", ritual: "Check Box175", verbal: "Check Box178", somatic: "Check Box176", material: "Check Box177" },
  { concentration: "Check Box179", ritual: "Check Box180", verbal: "Check Box183", somatic: "Check Box181", material: "Check Box182" },
  { concentration: "Check Box184", ritual: "Check Box185", verbal: "Check Box188", somatic: "Check Box186", material: "Check Box187" },
  { concentration: "Check Box189", ritual: "Check Box190", verbal: "Check Box193", somatic: "Check Box191", material: "Check Box192" },
];

export const PDF_2024_PAGE2_FIELDS = {
  armorWorn: "ARMOR WORN",
  weapons: "WEAPONS",
  equipment: "EQUIPMENT",
  backstoryAndPersonality: "BACKSTORY AND PERSONALITY",
} as const;

/** 5 attunement-slot lines, top to bottom. */
export const PDF_2024_MAGIC_ITEM_FIELDS: string[] = ["MAGIC ITEM 1", "MAGIC ITEM 2", "MAGIC ITEM 3", "MAGIC ITEM 4", "MAGIC ITEM 5"];
export const PDF_2024_MAGIC_ITEM_ATTUNED_CHECKBOXES: string[] = [
  "Check Box194",
  "Check Box195",
  "Check Box196",
  "Check Box197",
  "Check Box198",
];
