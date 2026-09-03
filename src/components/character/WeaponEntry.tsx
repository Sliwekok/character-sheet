"use client";

import { useState } from "react";
import { Character } from "@/interfaces/Characters";
import { Weapon } from "@/interfaces/Weapon";
import { Badge, Button, Tooltip, formatModifier } from "@/components/ui";
import { getWeaponAttackInfo, getWeaponDamageInfo } from "@/utils/attackCalculations";
import { DiceRollResult, describeDiceRoll, rollD20, rollDiceFormula } from "@/utils/dice";

type RolledResult = { label: string; result: DiceRollResult };

/**
 * One weapon on the character sheet: its stats, an info tooltip explaining
 * how its attack bonus and damage were derived, and "Roll attack"/"Roll
 * damage" buttons that actually roll the dice (see utils/dice.ts). A
 * versatile weapon (e.g. Longsword) gets a two-handed toggle that switches
 * both the displayed damage and what "Roll damage" rolls.
 */
export function WeaponEntry({ character, weapon }: { character: Character; weapon: Weapon }) {
  const [useVersatile, setUseVersatile] = useState(false);
  const [rolled, setRolled] = useState<RolledResult | null>(null);

  const attack = getWeaponAttackInfo(character, weapon);
  const damage = getWeaponDamageInfo(character, weapon, useVersatile);

  function rollAttack() {
    setRolled({ label: "Attack roll", result: rollD20(attack.attackBonus) });
  }

  function rollDamage() {
    setRolled({
      label: `Damage (${damage.damageType})`,
      result: rollDiceFormula(damage.diceFormula, damage.flatBonus),
    });
  }

  return (
    <div className="rounded-(--radius-sm) bg-background-darken/60 px-3 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold text-fontcolor">{weapon.name}</span>
        <Badge variant="outline">{weapon.category}</Badge>
        <Badge variant="muted">{weapon.type}</Badge>
        {weapon.mastery && <Badge variant="muted">{weapon.mastery}</Badge>}
        {!attack.proficient && <Badge variant="muted">Not proficient</Badge>}
      </div>

      <p className="mt-1 text-xs">
        {weapon.damage.dice} {weapon.damage.type}
        {weapon.versatileDamage ? ` (${weapon.versatileDamage} two-handed)` : ""}
        {weapon.properties.length > 0 ? ` · ${weapon.properties.join(", ")}` : ""}
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 justify-between">
        <span className="flex items-center gap-1 text-xs text-fontcolor-secondary flex-1/2">
          Attack {formatModifier(attack.attackBonus)}
          <Tooltip title="Attack bonus" lines={attack.lines} />
        </span>
        <Button size="sm" variant="secondary" onClick={rollAttack} className="flex-1/4">
          Roll attack
        </Button>

        <span className="flex items-center gap-1 text-xs text-fontcolor-secondary flex-1/2">
          Damage {damage.diceFormula}
          {damage.flatBonus ? ` ${formatModifier(damage.flatBonus)}` : ""}
          <Tooltip title="Damage" lines={damage.lines} />
        </span>
        <Button size="sm" variant="secondary" onClick={rollDamage} className="flex-1/4">
          Roll damage
        </Button>

        {weapon.versatileDamage && (
          <label className="flex items-center gap-1.5 text-xs text-fontcolor-secondary">
            <input
              type="checkbox"
              checked={useVersatile}
              onChange={(event) => setUseVersatile(event.target.checked)}
              className="h-3.5 w-3.5 accent-foreground"
            />
            Two-handed
          </label>
        )}
      </div>

      {rolled && (
        <p className="mt-2 text-xs text-fontcolor">
          {rolled.label}: {describeDiceRoll(rolled.result)}
        </p>
      )}
    </div>
  );
}
