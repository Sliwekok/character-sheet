import { PDFDocument, PDFForm } from "pdf-lib";
import { StoredCharacter } from "@/interfaces/StoredCharacter";
import { Character, getCharacterLevel } from "@/interfaces/Characters";
import { Edition } from "@/interfaces/Edition";
import { derivePrintData } from "@/utils/characterPrintData";
import { getChosenWeaponMasteryIndexes } from "@/utils/weaponMastery";
import {
  ABILITY_ORDER,
  ABILITY_SHORT,
  SKILL_LIST,
  formatMod,
  isProficientInSave,
  isProficientInSkill,
  saveModifier,
  skillModifier,
} from "@/utils/characterSheetHelpers";
import {
  PDF_2014_ABILITY_MOD_FIELDS,
  PDF_2014_ABILITY_SCORE_FIELDS,
  PDF_2014_CURRENCY_FIELDS,
  PDF_2014_PAGE2_FIELDS,
  PDF_2014_SAVE_PROFICIENCY_CHECKBOXES,
  PDF_2014_SAVE_TEXT_FIELDS,
  PDF_2014_SKILL_PROFICIENCY_CHECKBOXES,
  PDF_2014_SKILL_TEXT_FIELDS,
  PDF_2014_SLOTS_TOTAL_FIELDS,
  PDF_2014_SPELLCASTING_FIELDS,
  PDF_2014_SPELL_ROW_FIELDS,
  PDF_2014_TEXT_FIELDS,
  PDF_2014_WEAPON_FIELDS,
} from "@/utils/pdfExport/pdfFieldMap2014";
import {
  PDF_2024_ABILITY_MOD_FIELDS,
  PDF_2024_ABILITY_SCORE_FIELDS,
  PDF_2024_ARMOR_TRAINING_CHECKBOXES,
  PDF_2024_CONDITION_CHECKBOXES,
  PDF_2024_CURRENCY_FIELDS,
  PDF_2024_MAGIC_ITEM_ATTUNED_CHECKBOXES,
  PDF_2024_MAGIC_ITEM_FIELDS,
  PDF_2024_MISC_CHECKBOXES,
  PDF_2024_PAGE1_FIELDS,
  PDF_2024_PAGE2_FIELDS,
  PDF_2024_SAVE_PROFICIENCY_CHECKBOXES,
  PDF_2024_SAVE_TEXT_FIELDS,
  PDF_2024_SKILL_PROFICIENCY_CHECKBOXES,
  PDF_2024_SKILL_TEXT_FIELDS,
  PDF_2024_SPELLCASTING_FIELDS,
  PDF_2024_SPELL_ROW_COMPONENT_CHECKBOXES,
  PDF_2024_SPELL_ROW_FIELDS,
  PDF_2024_SPELL_SLOT_TOTAL_FIELDS,
  PDF_2024_TEXT_FIELDS,
  PDF_2024_WEAPON_FIELDS,
  PDF_2024_WEAPON_TRAINING_CHECKBOXES,
} from "@/utils/pdfExport/pdfFieldMap2024";

export type PdfExportEdition = Edition;

export interface PdfEditionSupport {
  edition: PdfExportEdition;
  /** Shown in the edition picker. */
  label: string;
  /** Where the blank fillable PDF for this edition lives under `public/`, or `null` if this edition has no template yet. */
  templateUrl: string | null;
}

/**
 * Every edition this export feature supports. Both currently have a
 * template and a field map (`pdfFieldMap2014.ts`/`pdfFieldMap2024.ts`) - a
 * future edition would follow the same recipe: drop its template under
 * `public/pdf-templates/`, write a field map the same way (see either map's
 * header comment for the reverse-engineering approach), add a
 * `fillCharacterPdf<Edition>` function and branch `fillCharacterPdf` below on
 * `edition`, then add an entry here - nothing about the edition picker or
 * the calling components needs to change.
 */
export const PDF_EXPORT_EDITIONS: PdfEditionSupport[] = [
  { edition: "2014", label: "2014 (5th Edition Player's Handbook)", templateUrl: "/pdf-templates/2014-character-sheet.pdf" },
  { edition: "2024", label: "2024 (revised Player's Handbook)", templateUrl: "/pdf-templates/2024-character-sheet.pdf" },
];

export function isPdfEditionSupported(edition: PdfExportEdition): boolean {
  return PDF_EXPORT_EDITIONS.some((entry) => entry.edition === edition && entry.templateUrl !== null);
}

/**
 * Most fields on this template have no field-level `/DA` (default
 * appearance) string of their own - they inherit one from the AcroForm, with
 * a font size of 0 ("auto"). pdf-lib's auto-size picks the largest font that
 * fits the given text in the field's box, which looks fine for a field whose
 * box roughly matches its content but goes wrong at the extremes this sheet
 * actually has: a couple of short lines in the (very tall) "Features and
 * Traits"/"Equipment"/"Attacks & Spellcasting"/"Other Proficiencies &
 * Languages" boxes balloons to a huge font, while a spell name in a ~10pt-tall
 * row shrinks to barely-legible. Every field below gets an explicit size
 * instead so the whole sheet reads at a consistent scale.
 *
 * `PDFTextField.setFontSize()` itself refuses to do this for a field with no
 * field-level `/DA` (it has nothing to patch), so the `/DA` string is written
 * directly here instead - this is exactly what `setFontSize` does under the
 * hood once a `/DA` exists, just without that guard.
 */
function setFontSize(field: ReturnType<PDFForm["getTextField"]>, fontSize: number): void {
  field.acroField.setDefaultAppearance(`/Helv ${fontSize} Tf 0 g`);
}

/** Font size for the sheet's big free-text boxes (personality/ideals/bonds/flaws, equipment, other proficiencies & languages, attacks & spellcasting, backstory, allies, additional features & traits, treasure) - see `setFontSize`'s header comment for why these need an explicit size at all. */
const PARAGRAPH_FONT_SIZE = 9;
/** Font size for each spell-name row on the spellcasting page - these boxes are short enough that auto-size was shrinking them well past legible. */
const SPELL_ROW_FONT_SIZE = 9;

/** Sets a text field's value, silently skipping blank values and any field name this copy of the template doesn't actually have (rather than throwing and aborting the whole export over one mismatched name). Pass `fontSize` to pin the field to an explicit size instead of leaving pdf-lib's auto-size behavior in place - see `setFontSize`'s header comment. */
function setText(
  form: PDFForm,
  fieldName: string,
  value: string | number | undefined | null,
  fontSize?: number
): void {
  if (value === undefined || value === null || value === "") return;
  try {
    const field = form.getTextField(fieldName);
    if (fontSize !== undefined) setFontSize(field, fontSize);
    field.setText(String(value));
  } catch {
    console.warn(`PDF export: text field "${fieldName}" not found in the template - skipped.`);
  }
}

/**
 * The "Features and Traits" box on the core sheet is meant for a quick-glance
 * list, not the character's entire feature/feat history - a heavily
 * multiclassed or high-level character can easily have a dozen-plus entries.
 * Keeps `featureLines` (subclass features first, then feats - see
 * `characterPrintData.ts`) up to a character budget, in that same priority
 * order, and returns the rest separately so the caller can send it to the
 * "Additional Features & Traits" box on the details page instead of dropping
 * it.
 */
function splitFeatureLines(featureLines: string[], budgetChars = 220): { primary: string[]; overflow: string[] } {
  const primary: string[] = [];
  let length = 0;

  let i = 0;
  for (; i < featureLines.length; i++) {
    const nextLength = length + (primary.length > 0 ? 2 : 0) + featureLines[i].length;
    // Always keep at least one entry, even if it alone busts the budget - an
    // empty box would be a stranger result than one slightly-too-long line.
    if (primary.length > 0 && nextLength > budgetChars) break;
    primary.push(featureLines[i]);
    length = nextLength;
  }

  return { primary, overflow: featureLines.slice(i) };
}

/** Checks/unchecks a checkbox field, same "skip rather than throw" tolerance as `setText`. */
function setCheckbox(form: PDFForm, fieldName: string, checked: boolean): void {
  try {
    const box = form.getCheckBox(fieldName);
    if (checked) box.check();
    else box.uncheck();
  } catch {
    console.warn(`PDF export: checkbox field "${fieldName}" not found in the template - skipped.`);
  }
}

/**
 * Fills `public/pdf-templates/2014-character-sheet.pdf` (the official WotC
 * fillable 2014-edition sheet) from `character`, using the exact same
 * derived values (ability modifiers, save/skill modifiers, AC, spell slots,
 * etc.) the on-screen print sheet renders - see
 * `utils/characterPrintData.ts`'s `derivePrintData`.
 *
 * Deliberately left blank, per the field map's own header comment: current
 * HP, temporary HP, death saves, XP, the two character/faction image
 * widgets, appearance/symbol free text the template has no field for, and
 * per-spell "prepared" checkboxes / remaining-slot counts (not tracked by
 * this app at all).
 */
async function fillCharacterPdf2014(character: StoredCharacter, templateUrl: string): Promise<Uint8Array> {
  const response = await fetch(templateUrl);
  if (!response.ok) {
    throw new Error(`Couldn't load the 2014 PDF template (HTTP ${response.status}).`);
  }
  const templateBytes = await response.arrayBuffer();

  const pdfDoc = await PDFDocument.load(templateBytes);
  const form = pdfDoc.getForm();
  const data = derivePrintData(character);

  setText(form, PDF_2014_TEXT_FIELDS.characterName, character.name);
  setText(form, PDF_2014_TEXT_FIELDS.classLevel, data.classAndLevel);
  setText(form, PDF_2014_TEXT_FIELDS.background, character.background.name);
  setText(form, PDF_2014_TEXT_FIELDS.playerName, data.details.playerName);
  setText(form, PDF_2014_TEXT_FIELDS.race, character.race.name);
  setText(form, PDF_2014_TEXT_FIELDS.alignment, character.alignment);
  setText(form, PDF_2014_TEXT_FIELDS.inspiration, data.details.inspiration ? "X" : "");
  setText(form, PDF_2014_TEXT_FIELDS.proficiencyBonus, formatMod(data.proficiencyBonus));
  setText(form, PDF_2014_TEXT_FIELDS.ac, data.ac);
  setText(form, PDF_2014_TEXT_FIELDS.initiative, formatMod(character.initiative));
  setText(form, PDF_2014_TEXT_FIELDS.speed, character.race.speed);
  setText(form, PDF_2014_TEXT_FIELDS.hpMax, character.maxHP);
  setText(form, PDF_2014_TEXT_FIELDS.hitDiceTotal, data.hitDice);
  setText(form, PDF_2014_TEXT_FIELDS.passivePerception, data.passivePerception);
  setText(form, PDF_2014_TEXT_FIELDS.equipment, data.equipmentLines.join(", "), PARAGRAPH_FONT_SIZE);
  setText(form, PDF_2014_TEXT_FIELDS.personalityTraits, data.details.flavor?.personalityTraits, PARAGRAPH_FONT_SIZE);
  setText(form, PDF_2014_TEXT_FIELDS.ideals, data.details.flavor?.ideals, PARAGRAPH_FONT_SIZE);
  setText(form, PDF_2014_TEXT_FIELDS.bonds, data.details.flavor?.bonds, PARAGRAPH_FONT_SIZE);
  setText(form, PDF_2014_TEXT_FIELDS.flaws, data.details.flavor?.flaws, PARAGRAPH_FONT_SIZE);
  setText(form, PDF_2014_TEXT_FIELDS.otherProficienciesLanguages, data.otherProficienciesText, PARAGRAPH_FONT_SIZE);

  // Keep the core sheet's "Features and Traits" box to the highest-priority
  // entries (subclass features before feats, same order `featureLines` is
  // already in) and send the rest to the details page's "Additional Features
  // & Traits" box instead of letting a long list run past the box - see
  // `splitFeatureLines`'s header comment.
  const { primary: primaryFeatures, overflow: overflowFeatures } = splitFeatureLines(data.featureLines);
  const primaryFeaturesText = [primaryFeatures.join(", "), data.details.featuresAndTraitsNotes]
    .filter(Boolean)
    .join("\n\n");
  setText(form, PDF_2014_TEXT_FIELDS.featuresAndTraits, primaryFeaturesText, PARAGRAPH_FONT_SIZE);

  ABILITY_ORDER.forEach((ability) => {
    setText(form, PDF_2014_ABILITY_SCORE_FIELDS[ability], character.abilityScores[ability]);
    setText(form, PDF_2014_ABILITY_MOD_FIELDS[ability], formatMod(data.modifiers[ability]));
    setText(
      form,
      PDF_2014_SAVE_TEXT_FIELDS[ability],
      formatMod(saveModifier(character, ability, data.modifiers, data.proficiencyBonus))
    );
    setCheckbox(form, PDF_2014_SAVE_PROFICIENCY_CHECKBOXES[ability], isProficientInSave(character, ability));
  });

  SKILL_LIST.forEach((skill) => {
    setText(
      form,
      PDF_2014_SKILL_TEXT_FIELDS[skill],
      formatMod(skillModifier(character, skill, data.modifiers, data.proficiencyBonus))
    );
    setCheckbox(form, PDF_2014_SKILL_PROFICIENCY_CHECKBOXES[skill], isProficientInSkill(character, skill));
  });

  data.attacks.slice(0, PDF_2014_WEAPON_FIELDS.length).forEach((attack, index) => {
    const fields = PDF_2014_WEAPON_FIELDS[index];
    setText(form, fields.name, attack.name);
    setText(form, fields.atkBonus, formatMod(attack.atkBonus));
    setText(form, fields.damage, attack.damageText);
  });
  // The full attack list (including anything past the three named rows above) also goes into the free-text box, same as the on-screen print sheet's "Attacks & Spellcasting" table.
  setText(
    form,
    PDF_2014_TEXT_FIELDS.attacksSpellcasting,
    data.attacks.map((attack) => `${attack.name}: ${formatMod(attack.atkBonus)}, ${attack.damageText}`).join("\n"),
    PARAGRAPH_FONT_SIZE
  );

  (Object.keys(PDF_2014_CURRENCY_FIELDS) as (keyof typeof PDF_2014_CURRENCY_FIELDS)[]).forEach((currency) => {
    setText(form, PDF_2014_CURRENCY_FIELDS[currency], character.currency[currency]);
  });

  // Page 2 - details sheet.
  setText(form, PDF_2014_PAGE2_FIELDS.characterName, character.name);
  setText(form, PDF_2014_PAGE2_FIELDS.age, data.details.appearance?.age);
  setText(form, PDF_2014_PAGE2_FIELDS.height, data.details.appearance?.height);
  setText(form, PDF_2014_PAGE2_FIELDS.weight, data.details.appearance?.weight);
  setText(form, PDF_2014_PAGE2_FIELDS.eyes, data.details.appearance?.eyes);
  setText(form, PDF_2014_PAGE2_FIELDS.skin, data.details.appearance?.skin);
  setText(form, PDF_2014_PAGE2_FIELDS.hair, data.details.appearance?.hair);
  setText(form, PDF_2014_PAGE2_FIELDS.allies, data.details.alliesAndOrganizations, PARAGRAPH_FONT_SIZE);
  setText(form, PDF_2014_PAGE2_FIELDS.factionName, data.details.organizationSymbolName);
  setText(form, PDF_2014_PAGE2_FIELDS.backstory, data.details.backstory, PARAGRAPH_FONT_SIZE);
  // Whatever didn't fit in the core sheet's "Features and Traits" box (see
  // `splitFeatureLines` above) lands here, after the player's own notes.
  setText(
    form,
    PDF_2014_PAGE2_FIELDS.additionalFeaturesAndTraits,
    [data.details.additionalFeaturesAndTraits, overflowFeatures.length > 0 ? overflowFeatures.join(", ") : null]
      .filter(Boolean)
      .join("\n\n"),
    PARAGRAPH_FONT_SIZE
  );
  setText(form, PDF_2014_PAGE2_FIELDS.treasure, data.details.treasure, PARAGRAPH_FONT_SIZE);

  // Page 3 - spellcasting sheet, only when the character actually casts.
  if (data.showSpellSheet) {
    setText(form, PDF_2014_SPELLCASTING_FIELDS.className, data.spellClassName);
    setText(form, PDF_2014_SPELLCASTING_FIELDS.ability, data.spellAbility ? ABILITY_SHORT[data.spellAbility] : undefined);
    setText(form, PDF_2014_SPELLCASTING_FIELDS.saveDC, data.spellSaveDC);
    setText(
      form,
      PDF_2014_SPELLCASTING_FIELDS.attackBonus,
      data.spellAttackBonus !== undefined ? formatMod(data.spellAttackBonus) : undefined
    );

    for (let level = 1; level <= 9; level++) {
      const total = data.slotsByLevel[level];
      if (total) setText(form, PDF_2014_SLOTS_TOTAL_FIELDS[level], total);
    }

    for (let level = 0; level <= 9; level++) {
      const spells = data.spellGroups.get(level) ?? [];
      const rowFields = PDF_2014_SPELL_ROW_FIELDS[level] ?? [];
      rowFields.forEach((fieldName, index) => setText(form, fieldName, spells[index]?.name, SPELL_ROW_FONT_SIZE));
    }
  }

  return pdfDoc.save();
}

/**
 * Every class/subclass feature the character has actually reached, across
 * all classes (multiclass-safe), sorted by level and labeled with which
 * class granted it - e.g. `"Action Surge (Fighter 2)"`. Feats get their own
 * dedicated "FEATS" field on this template (unlike the 2014 sheet's single
 * cramped box), so they're deliberately not included here.
 */
function classFeatureLines(character: Character): string[] {
  return character.classes
    .flatMap((entry) => {
      const classFeatures = Array.isArray(entry.class.features) ? entry.class.features : [];
      const subclassFeatures = Array.isArray(entry.subclass?.features) ? entry.subclass!.features : [];
      return [...classFeatures, ...subclassFeatures]
        .filter((feature) => feature.level <= entry.level)
        .map((feature) => ({ name: feature.name, level: feature.level, className: entry.class.name }));
    })
    .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name))
    .map((feature) => `${feature.name} (${feature.className} ${feature.level})`);
}

/** Case-insensitive substring test against a set of free-text proficiency strings (e.g. `armorProficiencies`) - used for the "EQUIPMENT TRAINING" diamonds, since the app stores these as arbitrary text rather than a fixed Light/Medium/Heavy/Shields enum. */
function matchesAny(proficiencies: string[], keyword: string): boolean {
  const needle = keyword.toLowerCase();
  return proficiencies.some((p) => p.toLowerCase().includes(needle));
}

/**
 * Fills `public/pdf-templates/2024-character-sheet.pdf` (DLtheDM's fillable
 * 2024-edition sheet) from `character` - see `pdfFieldMap2024.ts`'s header
 * comment for the reverse-engineering approach and the full list of fields
 * deliberately left blank (current/temp HP, death saves, spent hit dice,
 * spell slots "expended", XP, the portrait image widget, and the Species
 * Traits size diamonds).
 */
async function fillCharacterPdf2024(character: StoredCharacter, templateUrl: string): Promise<Uint8Array> {
  const response = await fetch(templateUrl);
  if (!response.ok) {
    throw new Error(`Couldn't load the 2024 PDF template (HTTP ${response.status}).`);
  }
  const templateBytes = await response.arrayBuffer();

  const pdfDoc = await PDFDocument.load(templateBytes);
  const form = pdfDoc.getForm();
  const data = derivePrintData(character);
  const primaryClass = character.classes[0];

  setText(form, PDF_2024_TEXT_FIELDS.background, character.background.name);
  setText(form, PDF_2024_TEXT_FIELDS.class, data.classAndLevel);
  setText(form, PDF_2024_TEXT_FIELDS.species, character.race.name);
  setText(form, PDF_2024_TEXT_FIELDS.subclass, primaryClass?.subclass?.name);
  setText(form, PDF_2024_TEXT_FIELDS.level, getCharacterLevel(character));
  setText(form, PDF_2024_TEXT_FIELDS.ac, data.ac);
  setText(form, PDF_2024_TEXT_FIELDS.maxHp, character.maxHP);
  setText(form, PDF_2024_TEXT_FIELDS.maxHd, data.hitDice);
  setText(form, PDF_2024_TEXT_FIELDS.profBonus, formatMod(data.proficiencyBonus));
  setText(form, PDF_2024_TEXT_FIELDS.speed, character.race.speed);
  setText(form, PDF_2024_TEXT_FIELDS.exhaustion, data.details.exhaustionLevel || undefined);

  setCheckbox(form, PDF_2024_MISC_CHECKBOXES.shield, Boolean(character.shield));
  setCheckbox(form, PDF_2024_MISC_CHECKBOXES.heroicInspiration, Boolean(data.details.inspiration));

  (Object.keys(PDF_2024_CONDITION_CHECKBOXES) as (keyof typeof PDF_2024_CONDITION_CHECKBOXES)[]).forEach(
    (condition) => {
      const fieldName = PDF_2024_CONDITION_CHECKBOXES[condition];
      if (fieldName) setCheckbox(form, fieldName, (data.details.conditions ?? []).includes(condition));
    }
  );

  setCheckbox(form, PDF_2024_ARMOR_TRAINING_CHECKBOXES.light, matchesAny(data.armorProficiencies, "light"));
  setCheckbox(form, PDF_2024_ARMOR_TRAINING_CHECKBOXES.medium, matchesAny(data.armorProficiencies, "medium"));
  setCheckbox(form, PDF_2024_ARMOR_TRAINING_CHECKBOXES.heavy, matchesAny(data.armorProficiencies, "heavy"));
  setCheckbox(form, PDF_2024_ARMOR_TRAINING_CHECKBOXES.shields, matchesAny(data.armorProficiencies, "shield"));
  setCheckbox(form, PDF_2024_WEAPON_TRAINING_CHECKBOXES.simple, matchesAny(data.weaponProficiencies, "simple"));
  setCheckbox(form, PDF_2024_WEAPON_TRAINING_CHECKBOXES.martial, matchesAny(data.weaponProficiencies, "martial"));
  setCheckbox(
    form,
    PDF_2024_WEAPON_TRAINING_CHECKBOXES.improvised,
    matchesAny(data.weaponProficiencies, "improvised")
  );

  ABILITY_ORDER.forEach((ability) => {
    setText(form, PDF_2024_ABILITY_SCORE_FIELDS[ability], character.abilityScores[ability]);
    setText(form, PDF_2024_ABILITY_MOD_FIELDS[ability], formatMod(data.modifiers[ability]));
    setText(
      form,
      PDF_2024_SAVE_TEXT_FIELDS[ability],
      formatMod(saveModifier(character, ability, data.modifiers, data.proficiencyBonus))
    );
    setCheckbox(form, PDF_2024_SAVE_PROFICIENCY_CHECKBOXES[ability], isProficientInSave(character, ability));
  });

  SKILL_LIST.forEach((skill) => {
    setText(
      form,
      PDF_2024_SKILL_TEXT_FIELDS[skill],
      formatMod(skillModifier(character, skill, data.modifiers, data.proficiencyBonus))
    );
    setCheckbox(form, PDF_2024_SKILL_PROFICIENCY_CHECKBOXES[skill], isProficientInSkill(character, skill));
  });

  data.attacks.slice(0, PDF_2024_WEAPON_FIELDS.length).forEach((attack, index) => {
    const fields = PDF_2024_WEAPON_FIELDS[index];
    setText(form, fields.name, attack.name);
    setText(form, fields.atkBonus, formatMod(attack.atkBonus));
    setText(form, fields.damage, attack.damageText);
  });

  (Object.keys(PDF_2024_CURRENCY_FIELDS) as (keyof typeof PDF_2024_CURRENCY_FIELDS)[]).forEach((currency) => {
    setText(form, PDF_2024_CURRENCY_FIELDS[currency], character.currency[currency]);
  });

  setText(form, PDF_2024_PAGE1_FIELDS.toolsAndOtherWeapons, data.toolProficiencies.join(", "), PARAGRAPH_FONT_SIZE);
  setText(form, PDF_2024_PAGE1_FIELDS.feats, character.feats.map((feat) => feat.name).join("\n"), PARAGRAPH_FONT_SIZE);
  setText(form, PDF_2024_PAGE1_FIELDS.speciesTraits, character.race.traits.join("\n"), PARAGRAPH_FONT_SIZE);
  setText(form, PDF_2024_PAGE1_FIELDS.languages, character.languages.join(", "), PARAGRAPH_FONT_SIZE);

  const chosenMasteryIndexes = getChosenWeaponMasteryIndexes(character);
  setText(
    form,
    PDF_2024_PAGE1_FIELDS.masteries,
    chosenMasteryIndexes
      .map((index) => character.weapons[index])
      .filter(Boolean)
      .map((weapon) => `${weapon.name} (${weapon.mastery})`)
      .join(", "),
    PARAGRAPH_FONT_SIZE
  );

  // This template gives "Class Features" a real two-column box rather than
  // the 2014 sheet's single cramped one, so the split here is much more
  // generous than `splitFeatureLines`'s default 220-char budget.
  const { primary: primaryFeatures, overflow: overflowFeatures } = splitFeatureLines(
    classFeatureLines(character),
    500
  );
  setText(form, PDF_2024_PAGE1_FIELDS.classFeaturesPrimary, primaryFeatures.join("\n"), PARAGRAPH_FONT_SIZE);
  setText(form, PDF_2024_PAGE1_FIELDS.classFeaturesOverflow, overflowFeatures.join("\n"), PARAGRAPH_FONT_SIZE);

  // Page 2.
  setText(form, PDF_2024_PAGE2_FIELDS.armorWorn, character.equippedArmor?.name);
  setText(
    form,
    PDF_2024_PAGE2_FIELDS.weapons,
    character.weapons.map((weapon) => weapon.name).join(", "),
    PARAGRAPH_FONT_SIZE
  );
  setText(form, PDF_2024_PAGE2_FIELDS.equipment, data.equipmentLines.join(", "), PARAGRAPH_FONT_SIZE);
  const backstoryAndPersonality = [
    data.details.flavor?.personalityTraits && `Personality Traits: ${data.details.flavor.personalityTraits}`,
    data.details.flavor?.ideals && `Ideals: ${data.details.flavor.ideals}`,
    data.details.flavor?.bonds && `Bonds: ${data.details.flavor.bonds}`,
    data.details.flavor?.flaws && `Flaws: ${data.details.flavor.flaws}`,
    data.details.backstory,
  ]
    .filter(Boolean)
    .join("\n\n");
  setText(form, PDF_2024_PAGE2_FIELDS.backstoryAndPersonality, backstoryAndPersonality, PARAGRAPH_FONT_SIZE);

  (character.magicItems ?? []).slice(0, PDF_2024_MAGIC_ITEM_FIELDS.length).forEach((item, index) => {
    setText(form, PDF_2024_MAGIC_ITEM_FIELDS[index], item.name);
    setCheckbox(form, PDF_2024_MAGIC_ITEM_ATTUNED_CHECKBOXES[index], Boolean(item.requiresAttunement));
  });

  // Spellcasting - only when the character actually casts.
  if (data.showSpellSheet) {
    setText(form, PDF_2024_SPELLCASTING_FIELDS.ability, data.spellAbility ? ABILITY_SHORT[data.spellAbility] : undefined);
    setText(
      form,
      PDF_2024_SPELLCASTING_FIELDS.modifier,
      data.spellAbility !== undefined ? formatMod(data.modifiers[data.spellAbility]) : undefined
    );
    setText(form, PDF_2024_SPELLCASTING_FIELDS.saveDC, data.spellSaveDC);
    setText(
      form,
      PDF_2024_SPELLCASTING_FIELDS.attackBonus,
      data.spellAttackBonus !== undefined ? formatMod(data.spellAttackBonus) : undefined
    );

    for (let level = 1; level <= 9; level++) {
      const total = data.slotsByLevel[level];
      if (total) setText(form, PDF_2024_SPELL_SLOT_TOTAL_FIELDS[level], total);
    }

    // One unified, sorted-by-level spell table on this template (rather than
    // the 2014 sheet's separate per-level columns) - cantrips (level 0)
    // first, then each prepared/known spell in level order.
    const allSpells = [...character.spellsKnown, ...(character.grantedSpells ?? [])].sort(
      (a, b) => a.level - b.level || a.name.localeCompare(b.name)
    );
    allSpells.slice(0, PDF_2024_SPELL_ROW_FIELDS.length).forEach((spell, index) => {
      const rowFields = PDF_2024_SPELL_ROW_FIELDS[index];
      const rowCheckboxes = PDF_2024_SPELL_ROW_COMPONENT_CHECKBOXES[index];
      setText(form, rowFields.level, spell.level === 0 ? "C" : spell.level, SPELL_ROW_FONT_SIZE);
      setText(form, rowFields.name, spell.name, SPELL_ROW_FONT_SIZE);
      setText(form, rowFields.castingTime, spell.castingTime, SPELL_ROW_FONT_SIZE);
      setText(form, rowFields.range, spell.range, SPELL_ROW_FONT_SIZE);
      setCheckbox(form, rowCheckboxes.concentration, Boolean(spell.concentration));
      setCheckbox(form, rowCheckboxes.ritual, Boolean(spell.ritual));
      setCheckbox(form, rowCheckboxes.verbal, spell.components.includes("V"));
      setCheckbox(form, rowCheckboxes.somatic, spell.components.includes("S"));
      setCheckbox(form, rowCheckboxes.material, spell.components.includes("M"));
    });
  }

  return pdfDoc.save();
}

/** Fills the fillable PDF for `edition` from `character` and returns the resulting bytes. Throws (rather than silently falling back to another edition) when that edition has no template yet - callers should only offer editions `isPdfEditionSupported` approves. */
export async function fillCharacterPdf(character: StoredCharacter, edition: PdfExportEdition): Promise<Uint8Array> {
  const support = PDF_EXPORT_EDITIONS.find((entry) => entry.edition === edition);
  if (!support?.templateUrl) {
    throw new Error(`There's no fillable PDF template for the ${edition} edition yet.`);
  }

  switch (edition) {
    case "2014":
      return fillCharacterPdf2014(character, support.templateUrl);
    case "2024":
      return fillCharacterPdf2024(character, support.templateUrl);
    default:
      throw new Error(`PDF export for the ${edition} edition isn't implemented yet.`);
  }
}

/** Filename the exported PDF is downloaded as, e.g. "aria-nightshade-2014-character-sheet.pdf". */
export function pdfExportFilename(character: StoredCharacter, edition: PdfExportEdition): string {
  const slug =
    character.name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "character";
  return `${slug}-${edition}-character-sheet.pdf`;
}

/** Triggers a browser download of the filled PDF - same throwaway-object-URL pattern `utils/characterImportExport.ts`'s `downloadCharacterAsJson` uses for the JSON export. */
function downloadPdfBytes(bytes: Uint8Array, filename: string): void {
  const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);

  try {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Fills `character` into the fillable PDF for `edition` and downloads it. The one entry point components should call - see `components/character/PdfExportPanel.tsx`. */
export async function exportCharacterToPdf(character: StoredCharacter, edition: PdfExportEdition): Promise<void> {
  const bytes = await fillCharacterPdf(character, edition);
  downloadPdfBytes(bytes, pdfExportFilename(character, edition));
}
