"use client";

import { useState } from "react";
import { Character } from "@/interfaces/Characters";
import { SkillName, SKILL_ABILITIES } from "@/interfaces/Skill";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Tooltip, formatModifier } from "@/components/ui";
import { calculateAbilityModifiers } from "@/utils/abilityModifiers";
import { calculateProficiencyBonus } from "@/utils/calculateProficiencyBonus";
import { SKILL_LIST, isProficientInSkill, skillModifier } from "@/utils/characterSheetHelpers";
import { formatSigned } from "@/utils/statLine";
import { DiceRollResult, describeDiceRoll, rollD20 } from "@/utils/dice";
import { cn } from "@/utils/cn";

/** "strength" -> "STR", etc. - every ability key happens to already start with its own three-letter abbreviation. */
function abilityAbbrev(ability: keyof Character["abilityScores"]): string {
  return ability.slice(0, 3).toUpperCase();
}

/**
 * All 18 skills, each with its governing ability, whether this character is
 * proficient, and its final modifier (ability modifier + proficiency bonus
 * if proficient - see utils/characterSheetHelpers.ts's `skillModifier`) -
 * plus a "Roll" button per skill that actually rolls a d20 + that modifier
 * (utils/dice.ts), same "click it, see the result" pattern WeaponEntry's
 * attack/damage rolls already established.
 *
 * Previously `character.skillProficiencies` was only ever shown as a flat
 * comma-separated name list on the "Background & proficiencies" card, with
 * no modifiers and no way to actually roll a check - this card replaces
 * that.
 */
export function SkillsPanel({ character }: { character: Character }) {
  const [rolled, setRolled] = useState<Partial<Record<SkillName, DiceRollResult>>>({});

  const modifiers = calculateAbilityModifiers(character.abilityScores);
  const proficiencyBonus = calculateProficiencyBonus(character);
  const passivePerception = 10 + skillModifier(character, "Perception", modifiers, proficiencyBonus);

  function rollSkill(skill: SkillName) {
    const modifier = skillModifier(character, skill, modifiers, proficiencyBonus);
    setRolled((current) => ({ ...current, [skill]: rollD20(modifier) }));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Skills</CardTitle>
        <span className="flex items-center gap-1">
          <Badge variant="muted">Passive Perception {passivePerception}</Badge>
          <Tooltip
            title="Passive Perception"
            lines={[
              { label: "Base", value: "10" },
              { label: "Perception modifier", value: formatSigned(skillModifier(character, "Perception", modifiers, proficiencyBonus)) },
              { label: "Total", value: `${passivePerception}` },
            ]}
          />
        </span>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
          {SKILL_LIST.map((skill) => {
            const ability = SKILL_ABILITIES[skill];
            const proficient = isProficientInSkill(character, skill);
            const total = skillModifier(character, skill, modifiers, proficiencyBonus);
            const result = rolled[skill];

            const tooltipLines = [
              { label: `${abilityAbbrev(ability)} modifier`, value: formatSigned(modifiers[ability]) },
              ...(proficient ? [{ label: "Proficiency bonus", value: formatSigned(proficiencyBonus) }] : []),
              { label: "Total", value: formatSigned(total) },
            ];

            return (
              <div
                key={skill}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 py-1.5"
              >
                <span
                  aria-hidden
                  title={proficient ? "Proficient" : "Not proficient"}
                  className={cn(
                    "h-2.5 w-2.5 shrink-0 rounded-full border",
                    proficient ? "border-foreground-hover bg-foreground" : "border-border-strong"
                  )}
                />
                <span className="flex-1 min-w-[8.5rem] text-sm text-fontcolor">{skill}</span>
                <Badge variant="muted" className="w-12 shrink-0 justify-center">
                  {abilityAbbrev(ability)}
                </Badge>
                <span className="flex w-10 shrink-0 items-center justify-end gap-1 text-sm font-semibold text-fontcolor">
                  {formatModifier(total)}
                  <Tooltip title={skill} lines={tooltipLines} />
                </span>
                <Button size="sm" variant="secondary" onClick={() => rollSkill(skill)}>
                  Roll
                </Button>
                {result && (
                  <span className="w-full text-xs text-fontcolor-secondary sm:w-auto">
                    {describeDiceRoll(result)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
