import { AbilityScores, Character } from "@/interfaces/Characters";
import { calculateAbilityModifiers } from "@/utils/abilityModifiers";
import { subtractAbilityScores } from "@/utils/abilityScoreBonuses";
import { StatLine, formatSigned } from "@/utils/statLine";

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
 * .abilityScores` only ever stores the final number (race + background
 * bonuses already baked in - see interfaces/Characters.ts), so this
 * recovers the pre-bonus base the same way utils/characterDraft.ts's
 * `draftFromCharacter` does when re-opening a character for editing -
 * purely to show the breakdown back to the player here, not to change any
 * stored data. Doesn't account for feat-granted ability increases, since
 * `Character.feats` isn't wired up to actually modify scores anywhere yet
 * (utils/characterDraft.ts's finalizeDraft always saves `feats: []`).
 */
export function getAbilityScoreBreakdown(character: Character, key: keyof AbilityScores): AbilityScoreBreakdown {
  const backgroundBonuses = character.backgroundAbilityBonuses ?? {};
  const raceBonus = character.race.abilityModifiers[key] ?? 0;
  const backgroundBonus = backgroundBonuses[key] ?? 0;
  const finalScore = character.abilityScores[key];
  const baseScore = subtractAbilityScores(character.abilityScores, character.race.abilityModifiers, backgroundBonuses)[
    key
  ];
  const modifier = calculateAbilityModifiers(character.abilityScores)[key];

  const lines: StatLine[] = [{ label: "Base score", value: `${baseScore}` }];
  if (raceBonus) lines.push({ label: `${character.race.name} bonus`, value: formatSigned(raceBonus) });
  if (backgroundBonus) lines.push({ label: `${character.background.name} bonus`, value: formatSigned(backgroundBonus) });
  lines.push({ label: "Final score", value: `${finalScore}` });
  lines.push({ label: "Modifier", value: `floor((${finalScore} − 10) ÷ 2) = ${formatSigned(modifier)}` });

  return { lines, score: finalScore, modifier };
}

/**
 * Breakdown for the Initiative badge - always just the Dexterity modifier,
 * but shown as a tooltip for consistency with every other derived stat on
 * the sheet. `character.initiative` is set once at creation (see
 * finalizeDraft) rather than recomputed live, so both the live formula and
 * the stored value are shown - they should always agree, but showing both
 * keeps this honest if a character's Dex ever changes without a resave.
 */
export function getInitiativeBreakdown(character: Character): { lines: StatLine[] } {
  const dexMod = calculateAbilityModifiers(character.abilityScores).dexterity;
  return {
    lines: [
      { label: "Dexterity modifier", value: formatSigned(dexMod) },
      { label: "Initiative", value: formatSigned(character.initiative) },
    ],
  };
}
