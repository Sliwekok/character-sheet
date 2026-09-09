import { Character, getCharacterLevel } from "@/interfaces/Characters";
import {TooltipLine} from "@/components/ui";

/** Standard 5e proficiency bonus by total character level - +2 at 1-4, +3 at 5-8, +4 at 9-12, +5 at 13-16, +6 at 17-20. Identical between editions and unaffected by multiclassing beyond total level. */
export function calculateProficiencyBonus(character: Character, level?: number): number {
  return Math.floor(((level ?? getCharacterLevel(character)) - 1) / 4) + 2;
}

export function getProficiencyBonusBreakdown(character: Character): TooltipLine[] {
  const level = getCharacterLevel(character);
  const bonus = calculateProficiencyBonus(character);
  const next = getNextProficiencyBonus(character);
  let tooltip =  [{label: `Level ${level}`, value: `Proficiency Bonus +${bonus}`}];
    if (next) {
        tooltip = tooltip.concat(next);
    }
    return tooltip;
}

export function getNextProficiencyBonus(character: Character): TooltipLine[] | false {
  const level = getCharacterLevel(character);

  if (level >= 20) {
    return false;
  }

  const currentBonus = calculateProficiencyBonus(character, level);
  const nextLevel = Math.min(20, (Math.floor((level - 1) / 4) + 1) * 4 + 1);
  const nextBonus = calculateProficiencyBonus(character, nextLevel);

  if (nextBonus === currentBonus) {
    return false;
  }

  return [{
    label: `Level ${nextLevel}`,
    value: `Proficiency Bonus +${nextBonus}`
  }];
}
