import { AbilityScores } from "@/interfaces/Characters";
import { SkillName } from "@/interfaces/Skill";

/**
 * AcroForm field names on `public/pdf-templates/2014-character-sheet.pdf` -
 * the official Wizards of the Coast "5E_CharacterSheet_Fillable.pdf" (2014
 * Player's Handbook edition). The template ships with 334 fields across its
 * 3 pages; the names below aren't documented anywhere, so they were
 * reverse-engineered by reading each field's `/Rect` position and matching
 * it against the sheet's visual layout (e.g. the six "Check Box NN" fields
 * sitting immediately left of "ST Strength".."ST Charisma" are the saving
 * throw proficiency dots, in that order).
 *
 * Deliberately NOT mapped here (see `exportCharacterPdf.ts`'s header
 * comment for the full reasoning):
 * - `HPCurrent`, `HPTemp`, and the six death-save checkboxes
 *   (`Check Box 12`-`17`) - explicitly out of scope for this export.
 * - `XP` - this app doesn't track experience points.
 * - `CHARACTER IMAGE` / `Faction Symbol Image` - image widgets, not text
 *   fields; this app has no character portrait/symbol image to place.
 * - `CharacterDetails.appearanceNotes` / `organizationSymbolName` - the
 *   official sheet has no free-text field for either (the "Character
 *   Appearance" and "Symbol" boxes are image-only on this template).
 * - Per-spell "prepared" checkboxes and every `SlotsRemaining *` field -
 *   this app doesn't track which spells are prepared or how many slots
 *   have been spent, only what's known/granted and the total per level.
 */

export const PDF_2014_TEXT_FIELDS = {
  characterName: "CharacterName",
  classLevel: "ClassLevel",
  background: "Background",
  playerName: "PlayerName",
  race: "Race ",
  alignment: "Alignment",
  inspiration: "Inspiration",
  proficiencyBonus: "ProfBonus",
  ac: "AC",
  initiative: "Initiative",
  speed: "Speed",
  hpMax: "HPMax",
  hitDiceTotal: "HDTotal",
  passivePerception: "Passive",
  attacksSpellcasting: "AttacksSpellcasting",
  equipment: "Equipment",
  personalityTraits: "PersonalityTraits ",
  ideals: "Ideals",
  bonds: "Bonds",
  flaws: "Flaws",
  featuresAndTraits: "Features and Traits",
  otherProficienciesLanguages: "ProficienciesLang",
} as const;

export const PDF_2014_ABILITY_SCORE_FIELDS: Record<keyof AbilityScores, string> = {
  strength: "STR",
  dexterity: "DEX",
  constitution: "CON",
  intelligence: "INT",
  wisdom: "WIS",
  charisma: "CHA",
};

export const PDF_2014_ABILITY_MOD_FIELDS: Record<keyof AbilityScores, string> = {
  strength: "STRmod",
  dexterity: "DEXmod ",
  constitution: "CONmod",
  intelligence: "INTmod",
  wisdom: "WISmod",
  charisma: "CHamod",
};

export const PDF_2014_SAVE_TEXT_FIELDS: Record<keyof AbilityScores, string> = {
  strength: "ST Strength",
  dexterity: "ST Dexterity",
  constitution: "ST Constitution",
  intelligence: "ST Intelligence",
  wisdom: "ST Wisdom",
  charisma: "ST Charisma",
};

export const PDF_2014_SAVE_PROFICIENCY_CHECKBOXES: Record<keyof AbilityScores, string> = {
  strength: "Check Box 11",
  dexterity: "Check Box 18",
  constitution: "Check Box 19",
  intelligence: "Check Box 20",
  wisdom: "Check Box 21",
  charisma: "Check Box 22",
};

/** Same 18-skill set as `printHelpers.ts`'s `SKILL_LIST` - every entry below was matched to its skill by row position on the template's skill list. */
export const PDF_2014_SKILL_TEXT_FIELDS: Record<SkillName, string> = {
  Acrobatics: "Acrobatics",
  "Animal Handling": "Animal",
  Arcana: "Arcana",
  Athletics: "Athletics",
  Deception: "Deception ",
  History: "History ",
  Insight: "Insight",
  Intimidation: "Intimidation",
  Investigation: "Investigation ",
  Medicine: "Medicine",
  Nature: "Nature",
  Perception: "Perception ",
  Performance: "Performance",
  Persuasion: "Persuasion",
  Religion: "Religion",
  "Sleight of Hand": "SleightofHand",
  Stealth: "Stealth ",
  Survival: "Survival",
};

export const PDF_2014_SKILL_PROFICIENCY_CHECKBOXES: Record<SkillName, string> = {
  Acrobatics: "Check Box 23",
  "Animal Handling": "Check Box 24",
  Arcana: "Check Box 25",
  Athletics: "Check Box 26",
  Deception: "Check Box 27",
  History: "Check Box 28",
  Insight: "Check Box 29",
  Intimidation: "Check Box 30",
  Investigation: "Check Box 31",
  Medicine: "Check Box 32",
  Nature: "Check Box 33",
  Perception: "Check Box 34",
  Performance: "Check Box 35",
  Persuasion: "Check Box 36",
  Religion: "Check Box 37",
  "Sleight of Hand": "Check Box 38",
  Stealth: "Check Box 39",
  Survival: "Check Box 40",
};

/** The core sheet only has three named weapon/attack rows; anything beyond that (plus, redundantly, the full list) goes into the free-text `AttacksSpellcasting` box instead - see `exportCharacterPdf.ts`. */
export const PDF_2014_WEAPON_FIELDS = [
  { name: "Wpn Name", atkBonus: "Wpn1 AtkBonus", damage: "Wpn1 Damage" },
  { name: "Wpn Name 2", atkBonus: "Wpn2 AtkBonus ", damage: "Wpn2 Damage " },
  { name: "Wpn Name 3", atkBonus: "Wpn3 AtkBonus  ", damage: "Wpn3 Damage " },
] as const;

export const PDF_2014_CURRENCY_FIELDS = {
  copper: "CP",
  silver: "SP",
  electrum: "EP",
  gold: "GP",
  platinum: "PP",
} as const;

export const PDF_2014_PAGE2_FIELDS = {
  characterName: "CharacterName 2",
  age: "Age",
  height: "Height",
  weight: "Weight",
  eyes: "Eyes",
  skin: "Skin",
  hair: "Hair",
  allies: "Allies",
  factionName: "FactionName",
  backstory: "Backstory",
  additionalFeaturesAndTraits: "Feat+Traits",
  treasure: "Treasure",
} as const;

export const PDF_2014_SPELLCASTING_FIELDS = {
  className: "Spellcasting Class 2",
  ability: "SpellcastingAbility 2",
  saveDC: "SpellSaveDC  2",
  attackBonus: "SpellAtkBonus 2",
} as const;

/**
 * Total-slots field, keyed by spell level 1-9 - the template's spell page
 * groups levels 1-2, 3-5, and 6-9 into its three printed columns, and this
 * table was built by reading each `SlotsTotal *` field's position against
 * that layout.
 */
export const PDF_2014_SLOTS_TOTAL_FIELDS: Record<number, string> = {
  1: "SlotsTotal 19",
  2: "SlotsTotal 20",
  3: "SlotsTotal 21",
  4: "SlotsTotal 22",
  5: "SlotsTotal 23",
  6: "SlotsTotal 24",
  7: "SlotsTotal 25",
  8: "SlotsTotal 26",
  9: "SlotsTotal 27",
};

/**
 * One spell-name text field per printable row, in top-to-bottom sheet
 * order, keyed by spell level (0 = cantrips). Row count varies by level
 * purely because of how much vertical space the printed template gives
 * each level's block - a level with more rows than the character has
 * spells just prints blank rows, same as a fresh paper sheet, and a level
 * with more known spells than rows simply can't show the rest (a fixed
 * paper layout has no "overflow" - same limitation the official PDF itself
 * has).
 */
export const PDF_2014_SPELL_ROW_FIELDS: Record<number, string[]> = {
  0: [
    "Spells 1014", "Spells 1016", "Spells 1017", "Spells 1018",
    "Spells 1019", "Spells 1020", "Spells 1021", "Spells 1022",
  ],
  1: [
    "Spells 1015", "Spells 1023", "Spells 1024", "Spells 1025", "Spells 1026", "Spells 1027",
    "Spells 1028", "Spells 1029", "Spells 1030", "Spells 1031", "Spells 1032", "Spells 1033",
  ],
  2: [
    "Spells 1046", "Spells 1034", "Spells 1035", "Spells 1036", "Spells 1037", "Spells 1038",
    "Spells 1039", "Spells 1040", "Spells 1041", "Spells 1042", "Spells 1043", "Spells 1044", "Spells 1045",
  ],
  3: [
    "Spells 1048", "Spells 1047", "Spells 1049", "Spells 1050", "Spells 1051", "Spells 1052",
    "Spells 1053", "Spells 1054", "Spells 1055", "Spells 1056", "Spells 1057", "Spells 1058", "Spells 1059",
  ],
  4: [
    "Spells 1061", "Spells 1060", "Spells 1062", "Spells 1063", "Spells 1064", "Spells 1065",
    "Spells 1066", "Spells 1067", "Spells 1068", "Spells 1069", "Spells 1070", "Spells 1071", "Spells 1072",
  ],
  5: [
    "Spells 1074", "Spells 1073", "Spells 1075", "Spells 1076",
    "Spells 1077", "Spells 1078", "Spells 1079", "Spells 1080", "Spells 1081",
  ],
  6: [
    "Spells 1083", "Spells 1082", "Spells 1084", "Spells 1085",
    "Spells 1086", "Spells 1087", "Spells 1088", "Spells 1089", "Spells 1090",
  ],
  7: [
    "Spells 1092", "Spells 1091", "Spells 1093", "Spells 1094",
    "Spells 1095", "Spells 1096", "Spells 1097", "Spells 1098", "Spells 1099",
  ],
  8: [
    "Spells 10101", "Spells 10100", "Spells 10102",
    "Spells 10103", "Spells 10104", "Spells 10105", "Spells 10106",
  ],
  9: [
    "Spells 10108", "Spells 10107", "Spells 10109",
    "Spells 101010", "Spells 101011", "Spells 101012", "Spells 101013",
  ],
};
