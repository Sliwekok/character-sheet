import { Edition } from "@/interfaces/Edition";
import { AbilityScores, CharacterClassLevel } from "@/interfaces/Characters";
import { StoredCharacter } from "@/interfaces/StoredCharacter";
import { Currency } from "@/interfaces/Currency";
import { CharacterAppearance, CharacterDetails, CharacterFlavor } from "@/interfaces/CharacterDetails";
import { MagicItem, MagicItemCategory, MagicItemRarity } from "@/interfaces/MagicItem";
import { Weapon } from "@/interfaces/Weapon";
import { Armor } from "@/interfaces/Armor";
import { Ruleset, getRulesetAsync } from "@/data";
import { generateId } from "@/utils/id";
import { enchantArmor, enchantWeapon, createCustomMagicItem } from "@/utils/customMagicItems";
import { sumAbilityScores } from "@/utils/abilityScoreBonuses";
import { AsiSlot, getAsiSlots, sumAsiAllocations } from "@/utils/abilityScoreImprovements";
import { Background } from "@/interfaces/Background";
import { buildOwnedArmors } from "@/utils/armor";

import {DdbActions, DdbCharacterData, DdbClassEntry, DdbClassSpellsEntry, DdbGrantedModifier, DdbInventoryItem, DdbSourceRef, DdbSpells} from "./types";
import { findByName } from "./matchCompendium";
import { htmlToPlainText } from "./textUtils";
import {
  hasReadableModifiers,
  PERMANENT_ABILITY_BONUS_GROUPS,
  readAbilityScoreBonuses,
  readSkillProficiencies,
} from "./readModifiers";
import { AbilityScoreReconciliation, formatAbilityBonuses, reconcileAbilityScores } from "./reconcileAbilityScores";
import { readActionSpellNames, readClassEmbeddedSpellNames, readGrantedSpellNames, readKnownSpellNames } from "./readSpells";
import {Spell} from "@/interfaces/Spell";

export interface ConvertResult {
  character: StoredCharacter;
  warnings: string[];
  edition: Edition;
}

export type ConvertOutcome = ConvertResult | { error: string };

function isConvertError(outcome: ConvertOutcome): outcome is { error: string } {
  return "error" in outcome;
}

const ALIGNMENT_NAMES: Record<number, string> = {
  1: "Lawful Good",
  2: "Neutral Good",
  3: "Chaotic Good",
  4: "Lawful Neutral",
  5: "Neutral",
  6: "Chaotic Neutral",
  7: "Lawful Evil",
  8: "Neutral Evil",
  9: "Chaotic Evil",
};

const ABILITY_ORDER: (keyof AbilityScores)[] = [
  "strength",
  "dexterity",
  "constitution",
  "intelligence",
  "wisdom",
  "charisma",
];

const WEAPON_BONUS_SUBTYPES = ["magic", "weapon-attacks", "weapon-damage", "weapon-attack-and-damage-rolls"];
const ARMOR_BONUS_SUBTYPES = ["armor-class"];

const MAGIC_ITEM_CATEGORY_BY_FILTER_TYPE: Record<string, MagicItemCategory> = {
  "Wondrous Item": "wondrous item",
  Ring: "ring",
  Rod: "rod",
  Staff: "staff",
  Wand: "wand",
  Potion: "potion",
  Scroll: "scroll",
  Ammunition: "ammunition",
};

function raceDisplayName(data: DdbCharacterData): string | undefined {
  return data.race?.fullName || data.race?.baseRaceName || undefined;
}

/** Sum of every `type: "bonus"` grant in `modifiers` whose `subType` is one of `subtypes` - the flat "+N" this app's Weapon/Armor `bonus` field wants. Anything the grant does mechanically beyond a flat number (extra elemental damage, etc.) isn't captured here - see this folder's README "Best effort" section. */
function extractFlatBonus(modifiers: DdbGrantedModifier[] | undefined, subtypes: string[]): number {
  if (!modifiers) return 0;
  return modifiers
    .filter((modifier) => modifier.type === "bonus" && modifier.subType && subtypes.includes(modifier.subType))
    .reduce((sum, modifier) => sum + (modifier.value ?? modifier.fixedValue ?? 0), 0);
}

function rarityFromDdb(rarity: string | undefined): MagicItemRarity {
  const normalized = (rarity ?? "").toLowerCase();
  const known: MagicItemRarity[] = ["common", "uncommon", "rare", "very rare", "legendary", "artifact", "varies"];
  return (known as string[]).includes(normalized) ? (normalized as MagicItemRarity) : "varies";
}

function attunementFromDdb(item: DdbInventoryItem): boolean | string {
  const description = item.definition.attunementDescription?.trim();
  if (description) return description;
  return !!item.definition.canAttune;
}

/** One equipped weapon -> this app's `Weapon`, matched against the base mundane weapon by D&D Beyond's `type` (e.g. "Greatsword") and, if magic, layered with `enchantWeapon`. `undefined` (plus a warning) when the base type isn't in this app's weapon table at all - homebrew weapons aren't supported. */
function mapWeapon(item: DdbInventoryItem, ruleset: Ruleset, warnings: string[]): Weapon | undefined {
  const def = item.definition;
  const baseName = def.type ?? undefined;
  const base = findByName(ruleset.weapons, baseName);

  if (!base) {
    warnings.push(
      `Couldn't match equipped weapon "${def.name}" to a base weapon type in this app's compendium` +
        (baseName ? ` ("${baseName}")` : "") +
        " - add it to the sheet by hand.",
    );
    return undefined;
  }

  if (!def.magic) return base;

  return enchantWeapon(base, {
    nameOverride: def.name,
    bonus: extractFlatBonus(def.grantedModifiers, WEAPON_BONUS_SUBTYPES) || undefined,
    rarity: rarityFromDdb(def.rarity),
    requiresAttunement: attunementFromDdb(item),
    magicDescription: htmlToPlainText(def.description),
  });
}

/** One equipped armor/shield item -> this app's `Armor`, same base-match-then-enchant approach as `mapWeapon`. */
function mapArmor(item: DdbInventoryItem, ruleset: Ruleset, warnings: string[]): Armor | undefined {
  const def = item.definition;
  const baseName = def.baseArmorName || def.type || undefined;
  const base = findByName(ruleset.armor, baseName);

  if (!base) {
    warnings.push(
      `Couldn't match equipped armor "${def.name}" to a base armor type in this app's compendium` +
        (baseName ? ` ("${baseName}")` : "") +
        " - add it to the sheet by hand.",
    );
    return undefined;
  }

  if (!def.magic) return base;

  return enchantArmor(base, {
    nameOverride: def.name,
    bonus: extractFlatBonus(def.grantedModifiers, ARMOR_BONUS_SUBTYPES) || undefined,
    rarity: rarityFromDdb(def.rarity),
    requiresAttunement: attunementFromDdb(item),
    magicDescription: htmlToPlainText(def.description),
  });
}

/** Every distinct spell name this character has, pooled across all four of D&D Beyond's spell-bearing groupings - see `mapSpells`'s header comment for what each one covers and why they're read as independent sources rather than assumed to overlap. */
function allSpellNames(
  spells: DdbSpells | undefined,
  classSpells: DdbClassSpellsEntry[] | undefined,
  actions: DdbActions | undefined,
  classes: DdbClassEntry[] | undefined,
): Set<string> {
  return new Set<string>([
    ...readKnownSpellNames(classSpells),
    ...readGrantedSpellNames(spells),
    ...readActionSpellNames(actions),
    ...readClassEmbeddedSpellNames(classes),
  ]);
}

/**
 * Every known/prepared or granted spell this character has, matched
 * against this app's own spell compendium by name - draws on every spell-
 * bearing part of D&D Beyond's payload this importer knows about:
 * `classSpells` (each class's own known/prepared list - see readSpells.ts's
 * `readKnownSpellNames`), `spells` (race/feat/item-granted spells, not
 * chosen as part of a class's list - see `readGrantedSpellNames`),
 * `actions` (the Actions tab's own race/class/feat/item grouping, since
 * some innate spellcasting shows up there instead of under `spells` - see
 * `readActionSpellNames`), and any spells embedded directly on a class
 * entry or its subclass definition (e.g. a Cleric domain's bonus spells -
 * see `readClassEmbeddedSpellNames`). Every source is pooled into one
 * de-duplicated name set rather than kept separate, since this app doesn't
 * distinguish "why" a spell is known/available, only that it is.
 *
 * A name that doesn't match anything in this app's compendium - homebrew, a
 * name one of the readers got slightly wrong, or any grouping's shape
 * turning out to differ from what's assumed in types.ts - is simply dropped
 * rather than guessed at: this app's `Spell` needs real mechanical fields
 * (level, school, casting time, components, duration, save/attack) an
 * unmatched name can't supply, so only spells this app can already vouch
 * for (secure/confirmed matches, from its own compendium) end up in the
 * imported list. Returns the matched spells alongside how many distinct
 * names were found in total, so the caller can report a "matched X of Y"
 * count rather than just "empty vs. not".
 */
function mapSpells(
  ruleset: Ruleset,
  spells: DdbSpells | undefined,
  classSpells: DdbClassSpellsEntry[] | undefined,
  actions: DdbActions | undefined,
  classes: DdbClassEntry[] | undefined,
): { spells: Spell[]; namesFound: number } {
  const names = allSpellNames(spells, classSpells, actions, classes);

  const matched: Spell[] = [];
  for (const name of names) {
    const match = findByName(ruleset.spells, name);
    if (match) matched.push(match);
  }

  return { spells: matched, namesFound: names.size };
}

/** A non-armor/non-weapon magic item (wondrous item, ring, rod, staff, wand, potion, scroll) -> this app's `MagicItem`, matched by name against the compendium first, falling back to a synthesized custom entry built from D&D Beyond's own description/rarity/attunement so nothing equipped/attuned is silently dropped. */
function mapMagicItem(item: DdbInventoryItem, ruleset: Ruleset): MagicItem {
  const def = item.definition;
  const existing = findByName(ruleset.magicItems, def.name);
  if (existing) return existing;

  const category = (def.filterType && MAGIC_ITEM_CATEGORY_BY_FILTER_TYPE[def.filterType]) || "other";
  return createCustomMagicItem({
    name: def.name,
    category,
    rarity: rarityFromDdb(def.rarity),
    requiresAttunement: attunementFromDdb(item),
    description: htmlToPlainText(def.description) || "Imported from D&D Beyond - description unavailable.",
  });
}

/** Determines which ruleset (2014 vs 2024 content) best matches this character's race/background/classes by name, since D&D Beyond's own payload doesn't label its ruleset version directly. Ties favor 2024 (D&D Beyond's current default for new characters). */
async function detectEdition(data: DdbCharacterData): Promise<Edition> {
  const [ruleset2014, ruleset2024] = await Promise.all([getRulesetAsync("2014"), getRulesetAsync("2024")]);

  const scoreOf = (ruleset: Ruleset): number => {
    let score = 0;
    if (findByName(ruleset.races, raceDisplayName(data))) score += 1;
    if (findByName(ruleset.backgrounds, data.background?.definition?.name)) score += 1;
    for (const entry of data.classes) {
      if (findByName(ruleset.classes, entry.definition?.name)) score += 1;
    }
    return score;
  };

  return scoreOf(ruleset2024) >= scoreOf(ruleset2014) ? "2024" : "2014";
}

/**
 * The character's ability scores exactly as D&D Beyond has them entered
 * directly - `stats` (the base score the player assigned) plus `bonusStats`
 * (a manual flat adjustment D&D Beyond itself supports per ability) -
 * BEFORE any racial modifier, background allocation, or Ability Score
 * Improvement. `overrideStats` is handled separately (see
 * `overriddenAbilityScores`), since an override is a FINAL score, not a base.
 */
function baseAbilityScores(data: DdbCharacterData): AbilityScores {
  const result = {} as AbilityScores;

  ABILITY_ORDER.forEach((key, index) => {
    const id = index + 1;
    const base = data.stats.find((stat) => stat.id === id)?.value ?? 10;
    const manualBonus = data.bonusStats?.find((stat) => stat.id === id)?.value ?? 0;
    result[key] = base + manualBonus;
  });

  return result;
}

/** D&D Beyond's per-ability "override" escape hatch - when set, that number IS the final score, replacing everything else. */
function overriddenAbilityScores(data: DdbCharacterData): Partial<AbilityScores> {
  const result: Partial<AbilityScores> = {};
  ABILITY_ORDER.forEach((key, index) => {
    const override = data.overrideStats?.find((stat) => stat.id === index + 1)?.value;
    if (override != null) result[key] = override;
  });
  return result;
}

/** D&D Beyond caps ability scores at 20 unless something already pushed them past it. */
const DEFAULT_ABILITY_SCORE_MAX = 20;

/**
 * The final ability scores D&D Beyond itself shows for this character:
 * base + manual bonus + every permanent ability-score bonus in `modifiers`
 * (race, class ASIs, background, feats - not items/conditions, see
 * readModifiers.ts), capped at 20 like D&D Beyond does, with overrides
 * winning outright. Only used as the TARGET for reconcileAbilityScores.ts -
 * never baked straight into the imported scores.
 */
function targetAbilityScores(
  data: DdbCharacterData,
  base: AbilityScores,
  displayed: AbilityScores,
  overrides: Partial<AbilityScores>,
): AbilityScores {
  const bonuses = readAbilityScoreBonuses(data.modifiers, PERMANENT_ABILITY_BONUS_GROUPS);
  const result = {} as AbilityScores;
  for (const key of ABILITY_ORDER) {
    const override = overrides[key];
    if (override != null) {
      result[key] = override;
      continue;
    }
    const raw = base[key] + (bonuses[key] ?? 0);
    result[key] = Math.min(raw, Math.max(DEFAULT_ABILITY_SCORE_MAX, displayed[key]));
  }
  return result;
}

function buildDetails(data: DdbCharacterData): CharacterDetails | undefined {
  const details: CharacterDetails = {};

  if (data.inspiration) details.inspiration = true;

  const appearance: CharacterAppearance = {};
  if (data.age != null && data.age !== "") appearance.age = String(data.age);
  if (data.height) appearance.height = data.height;
  if (data.weight != null && data.weight !== "") appearance.weight = String(data.weight);
  if (data.eyes) appearance.eyes = data.eyes;
  if (data.skin) appearance.skin = data.skin;
  if (data.hair) appearance.hair = data.hair;
  if (Object.keys(appearance).length > 0) details.appearance = appearance;

  const flavor: CharacterFlavor = {};
  if (data.traits?.personalityTraits) flavor.personalityTraits = htmlToPlainText(data.traits.personalityTraits);
  if (data.traits?.ideals) flavor.ideals = htmlToPlainText(data.traits.ideals);
  if (data.traits?.bonds) flavor.bonds = htmlToPlainText(data.traits.bonds);
  if (data.traits?.flaws) flavor.flaws = htmlToPlainText(data.traits.flaws);
  if (Object.keys(flavor).length > 0) details.flavor = flavor;

  if (data.traits?.appearance) details.appearanceNotes = htmlToPlainText(data.traits.appearance);
  if (data.notes?.backstory) details.backstory = htmlToPlainText(data.notes.backstory);

  const alliesText = [data.notes?.allies, data.notes?.organizations].filter(Boolean).map((t) => htmlToPlainText(t));
  if (alliesText.length > 0) details.alliesAndOrganizations = alliesText.join("\n\n");

  const treasureText = [data.notes?.personalPossessions, data.notes?.otherHoldings]
    .filter(Boolean)
    .map((t) => htmlToPlainText(t));
  if (treasureText.length > 0) details.treasure = treasureText.join("\n\n");

  if (data.notes?.enemies) {
    details.additionalFeaturesAndTraits = htmlToPlainText(data.notes.enemies);
  }

  return Object.keys(details).length > 0 ? details : undefined;
}

function slotList(slots: AsiSlot[]): string {
  return slots.map((slot) => `${slot.className} ${slot.level}`).join(", ");
}

/** Import-preview warnings describing what reconcileAbilityScores.ts applied and what's still left for the player. */
function abilityScoreWarnings(result: AbilityScoreReconciliation, background: Background): string[] {
  const warnings: string[] = [];
  const applied: string[] = [];

  if (result.backgroundAbilityBonuses) {
    applied.push(`"${background.name}" background: ${formatAbilityBonuses(result.backgroundAbilityBonuses)}`);
  }
  for (const slot of result.filledSlots) {
    applied.push(`ASI ${slot.className} ${slot.level}: ${formatAbilityBonuses(result.abilityScoreImprovements[slot.key])}`);
  }
  if (applied.length > 0) {
    warnings.push(
      `Ability score bonuses were matched against D&D Beyond's totals and applied - ${applied.join("; ")}. You can change these any time in the Ability Scores step.`,
    );
  }

  if (background.abilityScoreOptions && !result.backgroundAbilityBonuses) {
    warnings.push(
      `The "${background.name}" background's ability score bonus couldn't be matched to D&D Beyond's totals, so it hasn't been applied. Open this character for editing and the Ability Scores step will ask you to allocate it before you can save.`,
    );
  }

  if (result.unfilledSlots.length > 0) {
    const plural = result.unfilledSlots.length > 1;
    warnings.push(
      `${result.unfilledSlots.length} Ability Score Improvement${plural ? "s" : ""} (${slotList(result.unfilledSlots)}) had no missing points left to match - on D&D Beyond ${plural ? "they were" : "it was"} probably taken as a feat instead. ${plural ? "They're" : "It's"} left unallocated; the Ability Scores step will ask for ${plural ? "them" : "it"} when you next edit this character.`,
    );
  }

  const leftover = formatAbilityBonuses(result.leftover);
  if (leftover) {
    warnings.push(
      `D&D Beyond has ${leftover} more than this sheet that couldn't be placed into a legal background/ASI allocation (e.g. a half-feat's +1) - not applied. Adjust by hand if needed.`,
    );
  }

  const excess = formatAbilityBonuses(result.excess);
  if (excess) {
    warnings.push(
      `This sheet shows ${excess} more than D&D Beyond - usually a racial bonus assigned differently there than in this app's race data. Double-check against the D&D Beyond sheet.`,
    );
  }

  return warnings;
}

/**
 * Converts one D&D Beyond character JSON payload (`data`, the `data` object
 * inside the API response - see types.ts) into a `StoredCharacter` this
 * app's own "Import" screen can load, matching every race/class/subclass/
 * background/feat/weapon/armor by name against this app's own bundled
 * compendium (`@/data`) rather than fabricating new compendium entries -
 * see this folder's README for what that means for homebrew content.
 *
 * Never throws: an unrecoverable problem (missing name/classes, or a race/
 * class/background this app doesn't have) comes back as `{ error }`;
 * anything recoverable-but-uncertain (ability score bonuses, skill
 * proficiencies, spells, equipment that couldn't be matched) is silently
 * best-effort'd and reported in `warnings` instead, so a character with
 * some homebrew gear still imports rather than failing outright.
 */
export async function convertDndBeyondCharacter(
  data: DdbCharacterData,
  editionOverride?: Edition,
): Promise<ConvertOutcome> {
  const warnings: string[] = [];

  if (!data.name?.trim()) {
    return { error: "This character has no name - is it fully created on D&D Beyond?" };
  }
  if (!Array.isArray(data.classes) || data.classes.length === 0) {
    return { error: "This character has no classes - is it fully created on D&D Beyond?" };
  }

  const edition = editionOverride ?? (await detectEdition(data));
  const ruleset = await getRulesetAsync(edition);

  const raceName = raceDisplayName(data);
  const race = findByName(ruleset.races, raceName);
  if (!race) {
    return {
      error:
        `Could not find race "${raceName ?? "(unknown)"}" in this app's ${edition} compendium. ` +
        "This importer only knows the races/classes/backgrounds already built into the character sheet app - homebrew or non-SRD content isn't supported yet.",
    };
  }

  const backgroundName = data.background?.definition?.name;
  const background = findByName(ruleset.backgrounds, backgroundName);
  if (!background) {
    return { error: `Could not find background "${backgroundName ?? "(unknown)"}" in this app's ${edition} compendium.` };
  }

  const classEntries: { ddb: DdbClassEntry; built: CharacterClassLevel }[] = [];
  for (const entry of data.classes) {
    const className = entry.definition?.name;
    const characterClass = findByName(ruleset.classes, className);
    if (!characterClass) {
      return { error: `Could not find class "${className ?? "(unknown)"}" in this app's ${edition} compendium.` };
    }

    let subclass;
    let subclassName = entry.subclassDefinition?.name;
    if (subclassName) {
      // trimming because it's subclass name (expansion) that we need to trim.
      subclassName = subclassName.split('(')[0].trim();
      subclass = findByName(
        ruleset.subclasses.filter((candidate) => candidate.parentClass === characterClass.name),
        subclassName,
      );
      if (!subclass) {
        warnings.push(`Subclass "${subclassName}" (${className}) wasn't found - you'll need to pick it again on the sheet.`);
      }
    }

    classEntries.push({
      ddb: entry,
      built: { class: characterClass, subclass, level: entry.level, hpMethod: "average" },
    });
  }

  // This app's convention (see interfaces/Characters.ts's CharacterClassLevel
  // header comment) is that classes[0] is always the "main" class -
  // proficiencies/saves/first hit die come from it. D&D Beyond instead marks
  // the main class with isStartingClass, in whatever array order it likes -
  // this stable sort just moves that entry to the front.
  classEntries.sort((a, b) => Number(!!b.ddb.isStartingClass) - Number(!!a.ddb.isStartingClass));
  const classes = classEntries.map((entry) => entry.built);

  // Race bonus comes from this app's own matched `race` (the same
  // `race.abilityModifiers`/`sumAbilityScores` combination
  // `finalizeDraft`/`randomCharacter` already use for every other
  // character). An overridden ability is shown as exactly the override.
  const baseScores = baseAbilityScores(data);
  const overrides = overriddenAbilityScores(data);
  const displayedScores: AbilityScores = { ...sumAbilityScores(baseScores, race.abilityModifiers), ...overrides };

  // Background allocation (2024) and earned Ability Score Improvements are
  // reconstructed by comparing D&D Beyond's own totals against
  // `displayedScores`: whatever is missing is handed out to the background
  // and the ASI slots as legal, explicit allocations (see
  // reconcileAbilityScores.ts). ONLY those recorded allocations are added
  // to the final scores, so `backgroundAbilityBonuses`/
  // `abilityScoreImprovements` always match what's baked in and a later
  // edit can't double-apply them (see utils/characterDraft.ts). Anything
  // that can't be matched is left unset for the wizard's Ability Scores
  // step, with a warning.
  const asiSlots = getAsiSlots(classes.map((entry) => ({ characterClass: entry.class, level: entry.level })));
  let backgroundAbilityBonuses: Partial<AbilityScores> | undefined;
  let abilityScoreImprovements: Record<string, Partial<AbilityScores>> = {};

  if (hasReadableModifiers(data.modifiers)) {
    const target = targetAbilityScores(data, baseScores, displayedScores, overrides);
    const result = reconcileAbilityScores({
      displayed: displayedScores,
      target,
      background,
      asiSlots,
      preferredBackground: readAbilityScoreBonuses(data.modifiers, ["background"]),
    });
    backgroundAbilityBonuses = result.backgroundAbilityBonuses;
    abilityScoreImprovements = result.abilityScoreImprovements;
    warnings.push(...abilityScoreWarnings(result, background));
  } else {
    if (background.abilityScoreOptions) {
      warnings.push(
        `The "${background.name}" background grants an ability score bonus that couldn't be read from D&D Beyond, so it hasn't been applied yet. Open this character for editing and the Ability Scores step will ask you to allocate it before you can save.`,
      );
    }
    if (asiSlots.length > 0) {
      warnings.push(
        `This character has earned ${asiSlots.length} Ability Score Improvement(s) (${slotList(asiSlots)}) that couldn't be read from D&D Beyond, so they haven't been applied yet. Open this character for editing and the Ability Scores step will ask you to allocate them before you can save.`,
      );
    }
  }

  const finalAbilityScores = sumAbilityScores(
    displayedScores,
    backgroundAbilityBonuses ?? {},
    sumAsiAllocations(asiSlots, abilityScoreImprovements),
  );

  const skillProficiencies = readSkillProficiencies(data.modifiers);
  if (!hasReadableModifiers(data.modifiers)) {
    warnings.push(
      "Couldn't read D&D Beyond's skill proficiency grants for this character - skill proficiencies below may be incomplete. Please compare against the D&D Beyond sheet and add anything missing.",
    );
  }

  const savingThrowProficiencies = classes[0].class.proficiencies.savingThrows;

  const inventory = data.inventory ?? [];
  const equipped = inventory.filter((item) => item.equipped);

  const weapons: Weapon[] = [];
  for (const item of equipped.filter((item) => item.definition.filterType === "Weapon")) {
    const weapon = mapWeapon(item, ruleset, warnings);
    if (weapon) weapons.push(weapon);
  }

  const armorPieces: Armor[] = [];
  for (const item of equipped.filter((item) => item.definition.filterType === "Armor")) {
    const armor = mapArmor(item, ruleset, warnings);
    if (armor) armorPieces.push(armor);
  }
  const shield = armorPieces.find((armor) => armor.category === "shield");
  const nonShieldArmor = armorPieces.filter((armor) => armor.category !== "shield");
  if (nonShieldArmor.length > 1) {
    warnings.push(
      `${nonShieldArmor.length} equipped armor pieces found - only "${nonShieldArmor[0].name}" was kept as the equipped armor, the rest were skipped.`,
    );
  }
  const equippedArmor = nonShieldArmor[0];

  const magicItems = equipped
    .filter((item) => item.definition.magic && !["Weapon", "Armor"].includes(item.definition.filterType ?? ""))
    .map((item) => mapMagicItem(item, ruleset));

  const currency: Currency = {
    copper: data.currencies?.cp ?? 0,
    silver: data.currencies?.sp ?? 0,
    electrum: data.currencies?.ep ?? 0,
    gold: data.currencies?.gp ?? 0,
    platinum: data.currencies?.pp ?? 0,
  };

  const maxHP = data.overrideHitPoints ?? (data.baseHitPoints ?? 0) + (data.bonusHitPoints ?? 0);
  const currentHP = Math.max(0, maxHP - (data.removedHitPoints ?? 0));
  const initiative = Math.floor((finalAbilityScores.dexterity - 10) / 2);

  const alignment = (data.alignmentId != null && ALIGNMENT_NAMES[data.alignmentId]) || "Unaligned";

  const feats = [];
  const originFeatName = background.originFeat;
  if (originFeatName) {
    const originFeat = findByName(ruleset.feats, originFeatName);
    if (originFeat) {
      feats.push(originFeat);
    } else {
      warnings.push(`Background origin feat "${originFeatName}" wasn't found in this app's ${edition} compendium - add it by hand.`);
    }
  }

  const isCaster = classes.some((entry) => entry.class.casterProgression !== "none" || !!entry.class.spellcasting);
  let knowSpells: Spell[] = [];
  if (isCaster) {
    const spellResult = mapSpells(ruleset, data.spells, data.classSpells, data.actions, data.classes);
    knowSpells = spellResult.spells;
    warnings.push(
      spellResult.namesFound > 0
        ? `This character has at least one spellcasting class - matched ${knowSpells.length}/${spellResult.namesFound} known/prepared/granted spells by name against this app's spell list (checked classSpells, spells, actions, and any spells listed directly on a class/subclass). This is best-effort (anything that couldn't be matched by name was skipped, never guessed at) - double-check the spell list against the D&D Beyond sheet.`
        : "This character has at least one spellcasting class - known/prepared spells couldn't be reliably read from D&D Beyond, so the spell list came in empty. Add spells on the sheet.",
    );
  }

  const details = buildDetails(data);

  const now = new Date().toISOString();
  const character: StoredCharacter = {
    id: generateId(),
    createdAt: now,
    updatedAt: now,
    edition,
    name: data.name,
    classes,
    race,
    background,
    feats,
    alignment,
    abilityScores: finalAbilityScores,
    // Exactly the allocations baked into `finalAbilityScores` above -
    // anything unmatched stays unset, which `draftFromCharacter` treats as
    // "not allocated yet" and requires be filled in before the next save.
    backgroundAbilityBonuses,
    abilityScoreImprovements: Object.keys(abilityScoreImprovements).length > 0 ? abilityScoreImprovements : undefined,
    skillProficiencies,
    savingThrowProficiencies,
    armors: buildOwnedArmors(equippedArmor, shield),
    weapons,
    currency,
    initiative,
    currentHP,
    maxHP,
    spellsKnown: knowSpells,
    languages: [],
    magicItems: magicItems.length > 0 ? magicItems : undefined,
    details,
  };

  return { character, warnings, edition };
}

export { isConvertError };
