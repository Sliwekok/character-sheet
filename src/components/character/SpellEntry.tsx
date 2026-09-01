"use client";

import { useState } from "react";
import { Spell } from "@/interfaces/Spell";
import { Badge, Button, Tooltip, formatModifier } from "@/components/ui";
import { SpellcastingInfo } from "@/utils/attackCalculations";
import { DiceRollResult, describeDiceRoll, findDiceNotation, rollD20, rollDiceFormula } from "@/utils/dice";

type RolledResult = { label: string; result: DiceRollResult };

/**
 * One known spell on the character sheet. Alongside the existing
 * name/school/casting details, shows the character's spell attack bonus
 * and save DC (same numbers for every spell - see
 * utils/attackCalculations.ts's `getSpellcastingInfo`) with a "Roll spell
 * attack" button, plus a best-effort "Roll <dice>" button when a dice
 * notation (e.g. "3d6") can be found in the spell's own description -
 * interfaces/Spell.ts has no structured damage field, so this is pattern-
 * matched from free text rather than modeled data (see
 * utils/dice.ts's `findDiceNotation`). It intentionally does NOT add the
 * spellcasting ability modifier on top of that roll, since only some
 * spells (mostly healing) add it per their own text - the button's tooltip
 * says so rather than guessing.
 */
export function SpellEntry({ spell, spellcasting }: { spell: Spell; spellcasting: SpellcastingInfo | null }) {
  const [rolled, setRolled] = useState<RolledResult | null>(null);
  const detectedDice = findDiceNotation(spell.description);

  function rollAttack() {
    if (!spellcasting) return;
    setRolled({ label: "Spell attack roll", result: rollD20(spellcasting.spellAttackBonus) });
  }

  function rollEffect() {
    if (!detectedDice) return;
    setRolled({ label: `Rolled ${detectedDice}`, result: rollDiceFormula(detectedDice) });
  }

  return (
    <div className="rounded-(--radius-sm) bg-background-darken/60 px-3 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold text-fontcolor">{spell.name}</span>
        <Badge variant="outline">{spell.school}</Badge>
        {spell.ritual && <Badge variant="muted">Ritual</Badge>}
        {spell.concentration && <Badge variant="muted">Concentration</Badge>}
      </div>
      <p className="mt-1 text-xs">
        {spell.castingTime} · {spell.range} · {spell.components.join(", ")} · {spell.duration}
      </p>
      <p className="mt-2 whitespace-pre-line">{spell.description}</p>

      {spellcasting && (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="flex items-center gap-1 text-xs text-fontcolor-secondary">
            Attack {formatModifier(spellcasting.spellAttackBonus)} · Save DC {spellcasting.spellSaveDC}
            <Tooltip title="Spellcasting" lines={spellcasting.lines} />
          </span>
          <Button size="sm" variant="secondary" onClick={rollAttack}>
            Roll spell attack
          </Button>

          {detectedDice && (
            <span className="flex items-center gap-1">
              <Button size="sm" variant="secondary" onClick={rollEffect}>
                Roll {detectedDice}
              </Button>
              <Tooltip title={`Rolling ${detectedDice}`}>
                <p>
                  Taken from the first dice notation found in this spell&apos;s description. Check the text for
                  extra modifiers it might call for - some healing spells, for example, add your spellcasting
                  ability modifier on top.
                </p>
              </Tooltip>
            </span>
          )}
        </div>
      )}

      {rolled && (
        <p className="mt-2 text-xs text-fontcolor">
          {rolled.label}: {describeDiceRoll(rolled.result)}
        </p>
      )}
    </div>
  );
}
