import { AbilityScores, Character } from "@/interfaces/Characters";
import { calculateAbilityModifiers } from "@/utils/abilityModifiers";
import { subtractAbilityScores } from "@/utils/abilityScoreBonuses";
import { getAsiSlots, sumAsiAllocations } from "@/utils/abilityScoreImprovements";
import { StatLine, formatSigned } from "@/utils/statLine";
import { getFeatInitiativeBonuses, getFeatSpeedBonuses, totalFeatBonus } from "@/utils/featBonuses";
import { calculateProficiencyBonus } from "@/utils/calculateProficiencyBonus";

export const ABILITY_LABELS: Record<keyof AbilityScores, string> = {
  strength: "Strength",
  dexterity: "Dexterity",
  constitution: "Constitution",
  intelligence: "Intelligence",
  wisdom: "Wisdom",
  charisma: "Charisma",
};

export type AbilityScoreBreakdown = {
  lines: StatLine[];
  score: number;
  modifier: number;
};

/**
 * Explains how one FINAL ability score was assembled, for the info tooltip
 * next to each ability modifier on the character sheet. `character
 * .abilityScores` only ever stores the final number (race + background +
 * Ability Score Improvement bonuses already baked in - see
 * interfaces/Characters.ts), so this recovers the pre-bonus base the same
 * way utils/characterDraft.ts's `draftFromCharacter` does when re-opening a
 * character for editing - purely to show the breakdown back to the player
 * here, not to change any stored data. Feat increases come from each saved
 * `featSelections` entry's `abilityBonuses` (one line per feat), and an ASI
 * level taken as a feat contributes through that feat rather than the ASI
 * line.
 */
export function getAbilityScoreBreakdown(character: Character, key: keyof AbilityScores): AbilityScoreBreakdown {
  const backgroundBonuses = character.backgroundAbilityBonuses ?? {};
  const featSelections = character.featSelections ?? [];
  const featAsiKeys = new Set(featSelections.map((selection) => selection.slot));
  const asiSlots = getAsiSlots(character.classes.map((entry) => ({ characterClass: entry.class, level: entry.level }))).filter(
    (slot) => !featAsiKeys.has(`asi:${slot.key}`)
  );
  const asiBonuses = sumAsiAllocations(asiSlots, character.abilityScoreImprovements ?? {});
  const featLines = featSelections
    .filter((selection) => selection.abilityBonuses?.[key])
    .map((selection) => ({ label: `${selection.featName} feat`, value: selection.abilityBonuses![key]! }));
  const featBonusTotal: Partial<AbilityScores> = { [key]: featLines.reduce((total, line) => total + line.value, 0) };
  const raceBonus = character.race.abilityModifiers[key] ?? 0;
  const backgroundBonus = backgroundBonuses[key] ?? 0;
  const asiBonus = asiBonuses[key] ?? 0;
  const finalScore = character.abilityScores[key];
  const baseScore = subtractAbilityScores(
    character.abilityScores,
    character.race.abilityModifiers,
    backgroundBonuses,
    asiBonuses,
    featBonusTotal
  )[key];
  const modifier = calculateAbilityModifiers(character.abilityScores)[key];

  const lines: StatLine[] = [{ label: "Base score", value: `${baseScore}` }];
  if (raceBonus) lines.push({ label: `${character.race.name} bonus`, value: formatSigned(raceBonus) });
  if (backgroundBonus) lines.push({ label: `${character.background.name} bonus`, value: formatSigned(backgroundBonus) });
  if (asiBonus) lines.push({ label: "Ability Score Improvement", value: formatSigned(asiBonus) });
  for (const line of featLines) lines.push({ label: line.label, value: formatSigned(line.value) });
  lines.push({ label: "Final score", value: `${finalScore}` });
  lines.push({ label: "Modifier", value: `${formatSigned(modifier)}` });

  return { lines, score: finalScore, modifier };
}

/**
 * Breakdown for the Initiative badge: the Dexterity modifier plus any feat
 * bonus (2014 Alert +5, 2024 Alert + proficiency bonus). Computed live -
 * `total` is what the sheet shows - so a Dex change or level-up is
 * reflected without a resave (`character.initiative` is only the value as
 * of the last save, see finalizeDraft).
 */
export function getInitiativeBreakdown(character: Character): { lines: StatLine[]; total: number } {
  const dexMod = calculateAbilityModifiers(character.abilityScores).dexterity;
  const featBonuses = getFeatInitiativeBonuses(character.feats ?? [], calculateProficiencyBonus(character));
  const total = dexMod + totalFeatBonus(featBonuses);
  return {
    lines: [
      { label: "Dexterity modifier", value: formatSigned(dexMod) },
      ...featBonuses.map((bonus) => ({ label: `${bonus.featName} feat`, value: formatSigned(bonus.value) })),
      { label: "Initiative", value: formatSigned(total) },
    ],
    total,
  };
}

/** Walking speed: the species' base speed plus feat bonuses (Mobile, Speedy, Boon of Speed, ...). */
export function getSpeedBreakdown(character: Character): { lines: StatLine[]; total: number } {
  const base = character.race.speed;
  const featBonuses = getFeatSpeedBonuses(character.feats ?? []);
  const total = base + totalFeatBonus(featBonuses);
  return {
    lines: [
      { label: `${character.race.name} base speed`, value: `${base} ft.` },
      ...featBonuses.map((bonus) => ({ label: `${bonus.featName} feat`, value: `+${bonus.value} ft.` })),
      { label: "Speed", value: `${total} ft.` },
    ],
    total,
  };
}
