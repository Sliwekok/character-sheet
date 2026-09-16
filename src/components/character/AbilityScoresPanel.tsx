import {AbilityScores, Character} from "@/interfaces/Characters";
import { Card, CardContent, CardHeader, CardTitle, Tooltip, formatModifier } from "@/components/ui";
import { getAbilityScoreBreakdown } from "@/utils/statBreakdowns";
import {describeDiceRoll, DiceRollResult} from "@/utils/dice";
import {useState} from "react";
import {SkillName} from "@/interfaces/Skill";

const ABILITY_LABELS: { key: keyof Character["abilityScores"]; label: string }[] = [
  { key: "strength", label: "STR" },
  { key: "dexterity", label: "DEX" },
  { key: "constitution", label: "CON" },
  { key: "intelligence", label: "INT" },
  { key: "wisdom", label: "WIS" },
  { key: "charisma", label: "CHA" },
];

/**
 * Compact ability score tiles for the character sheet's sidebar - previously
 * ability scores were a full-width `StatBlock` row (2-3 columns spanning the
 * whole page) showing only the modifier, with the actual score tucked away
 * inside its info Tooltip. This renders instead as a small 2-column tile
 * grid meant for a narrow sidebar: each tile shows the ability abbreviation,
 * its modifier (the number that actually gets added to rolls, kept large -
 * still the primary thing a player looks up mid-game) and its total score
 * right underneath in smaller text, with the same breakdown Tooltip as
 * before for anyone who wants to see how it was assembled (race/background/
 * ASI bonuses - see utils/statBreakdowns.ts).
 */
export function AbilityScoresPanel({ character, onRoll }: { character: Character; onRoll: (label: string, result: DiceRollResult) => void; }) {
    const [rolled, setRolled] = useState<Partial<Record<keyof AbilityScores, DiceRollResult>>>({});

    function rollAbilityScore(abilityScore: keyof AbilityScores): DiceRollResult {
        const breakdown = getAbilityScoreBreakdown(character, abilityScore);
        const rolled = Math.floor(Math.random() * 20);
        const result = {
            formula: "1d20",
            rolls: [rolled + 1],
            modifier: breakdown.modifier,
            total: breakdown.modifier + (rolled + 1),
            diceTotal: rolled + 1
        };
        onRoll(`${abilityScore} check`, result);
        setRolled((current) => ({ ...current, [abilityScore]: result }));

        return result;
    }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ability Scores</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-2 lg:grid-cols-2">
        {ABILITY_LABELS.map(({ key, label }) => {
          const breakdown = getAbilityScoreBreakdown(character, key);
            const result = rolled[key];
            return (
            <div
              key={key}
              className="flex flex-col items-center gap-0.5 rounded-(--radius-sm) bg-background-darken/60 px-2 py-2"
              onClick={() => rollAbilityScore(key)}
            >
              <span className="text-[11px] font-semibold uppercase tracking-wide text-fontcolor-secondary">
                {label}
              </span>
              <span className="flex items-center gap-1">
                <span className="text-lg font-bold leading-none text-fontcolor">
                  {formatModifier(breakdown.modifier)}
                </span>
                <Tooltip title={`${label} (score ${breakdown.score})`} lines={breakdown.lines} />
              </span>
              <span className="text-[11px] leading-none text-fontcolor-secondary">{breakdown.score}</span>
                {result && (
                    <span className="w-full text-[11px] text-fontcolor text-center">
                    {describeDiceRoll(result)}
                  </span>
                )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
