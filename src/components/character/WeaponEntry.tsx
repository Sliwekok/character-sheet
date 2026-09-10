"use client";

import { useState } from "react";
import { Character } from "@/interfaces/Characters";
import { Weapon } from "@/interfaces/Weapon";
import { Badge, Button, Tooltip, formatModifier } from "@/components/ui";
import { getWeaponAttackInfo, getWeaponDamageInfo } from "@/utils/attackCalculations";
import { DiceRollResult, describeDiceRoll, rollD20, rollDiceFormula } from "@/utils/dice";
import { cn } from "@/utils/cn";
import {
  WEAPON_MASTERY_EFFECTS,
  getChosenWeaponMasteryIndexes,
  getWeaponMasteryCount,
  getWeaponMasteryLines,
  isWeaponMasteryActive,
} from "@/utils/weaponMastery";

type RolledResult = { label: string; result: DiceRollResult };

/**
 * One weapon on the character sheet: its stats, an info tooltip explaining
 * how its attack bonus and damage were derived, and "Roll attack"/"Roll
 * damage" buttons that actually roll the dice (see utils/dice.ts). A
 * versatile weapon (e.g. Longsword) gets a two-handed toggle that switches
 * both the displayed damage and what "Roll damage" rolls.
 *
 * A weapon carrying a 2024 Weapon Mastery property (see interfaces/Weapon.ts)
 * always gets a pill next to its name, but its color/behavior strictly
 * reflects whether the character can actually use it right now:
 *   - Not usable at all (2014 rules, or a 2024 class with no mastery slots
 *     yet) - a plain muted pill, no checkbox, no "Roll ..." button. The
 *     tooltip still explains what the property WOULD do, but says plainly
 *     that it isn't currently usable.
 *   - Usable in principle but not one of this character's chosen weapons
 *     (see `isWeaponMasteryActive`/utils/weaponMastery.ts) - a dimmer
 *     outlined pill plus a "Use mastery" checkbox to assign one of the
 *     character's limited slots to it (disabled once every slot is spent
 *     elsewhere).
 *   - Actively chosen - the bright accent pill, the tooltip's
 *     character-specific numbers (Graze's bonus damage, Topple's save DC),
 *     and - for masteries that need an extra roll (Cleave's second attack,
 *     Nick's extra attack, Vex's advantage follow-up) - their own "Roll ..."
 *     button next to "Roll attack"/"Roll damage".
 *
 * `index` is this weapon's position in `character.weapons` - the only
 * identity a weapon has (see utils/weaponMastery.ts) - and `onToggleMastery`
 * is how a checkbox change gets persisted by the parent page (it calls
 * `toggleWeaponMasteryChoice` and `saveCharacter`); omit it to render this
 * component read-only (no checkbox at all), e.g. on a print/preview view.
 */
export function WeaponEntry({
  character,
  weapon,
  index,
  onToggleMastery,
}: {
  character: Character;
  weapon: Weapon;
  index: number;
  onToggleMastery?: (index: number) => void;
}) {
  const [useVersatile, setUseVersatile] = useState(false);
  const [rolled, setRolled] = useState<RolledResult | null>(null);

  const attack = getWeaponAttackInfo(character, weapon);
  const damage = getWeaponDamageInfo(character, weapon, useVersatile);

  const masteryEffect = weapon.mastery ? WEAPON_MASTERY_EFFECTS[weapon.mastery] : undefined;
  const masteryCap = getWeaponMasteryCount(character.classes, character.edition);
  const masteryUsableAtAll = masteryCap > 0;
  const isMasteryActive = weapon.mastery ? isWeaponMasteryActive(character, index) : false;
  const chosenCount = getChosenWeaponMasteryIndexes(character).length;
  const masterySlotsFull = chosenCount >= masteryCap;
  const masteryLines = isMasteryActive ? getWeaponMasteryLines(character, weapon, attack.abilityModifier) : [];

  function rollAttack() {
    setRolled({ label: "Attack roll", result: rollD20(attack.attackBonus) });
  }

  function rollDamage() {
    setRolled({
      label: `Damage (${damage.damageType})`,
      result: rollDiceFormula(damage.diceFormula, damage.flatBonus),
    });
  }

  function rollMasteryAttack() {
    if (!weapon.mastery || !masteryEffect) return;
    const advantage = masteryEffect.rollKind === "advantageAttackRoll";
    setRolled({
      label: `${weapon.mastery} attack roll${advantage ? " (advantage)" : ""}`,
      result: rollD20(attack.attackBonus, advantage),
    });
  }

  return (
    <div className="rounded-(--radius-sm) bg-background-darken/60 px-3 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold text-fontcolor">{weapon.name}</span>
        <Badge variant="outline">{weapon.category}</Badge>
        <Badge variant="muted">{weapon.type}</Badge>
        {weapon.mastery && masteryEffect && (
          <Tooltip
            title={`${weapon.mastery} (Weapon Mastery)`}
            lines={masteryLines}
            trigger={
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition-colors",
                  isMasteryActive
                    ? "border-foreground-hover/60 bg-foreground/25 text-foreground hover:bg-foreground/40"
                    : masteryUsableAtAll
                      ? "border-border-strong text-fontcolor-secondary hover:border-foreground/50 hover:text-foreground"
                      : "border-border-strong bg-background-darken text-fontcolor-secondary"
                )}
              >
                {weapon.mastery}
              </span>
            }
          >
            <p>{masteryEffect.description}</p>
            {!masteryUsableAtAll && (
              <p className="mt-2 text-[11px] italic">
                Not usable right now - Weapon Mastery is a 2024-rules mechanic, and this character has no mastery
                slots (2014 rules, or no class levels that grant one yet).
              </p>
            )}
            {masteryUsableAtAll && !isMasteryActive && (
              <p className="mt-2 text-[11px] italic">
                Not currently one of this character&apos;s {masteryCap} chosen weapon
                {masteryCap === 1 ? "" : "s"} - use the checkbox below to assign a mastery slot to it.
              </p>
            )}
          </Tooltip>
        )}
        {!attack.proficient && <Badge variant="muted">Not proficient</Badge>}
      </div>

      <p className="mt-1 text-xs">
        {weapon.damage.dice} {weapon.damage.type}
        {weapon.versatileDamage ? ` (${weapon.versatileDamage} two-handed)` : ""}
        {weapon.properties.length > 0 ? ` · ${weapon.properties.join(", ")}` : ""}
      </p>

      {weapon.mastery && masteryUsableAtAll && onToggleMastery && (
        <label
          className={cn(
            "mt-1 flex w-fit items-center gap-1.5 text-xs",
            !isMasteryActive && masterySlotsFull ? "text-fontcolor-secondary/50" : "text-fontcolor-secondary"
          )}
        >
          <input
            type="checkbox"
            checked={isMasteryActive}
            disabled={!isMasteryActive && masterySlotsFull}
            onChange={() => onToggleMastery(index)}
            className="h-3.5 w-3.5 accent-foreground"
          />
          {isMasteryActive ? "Mastery active" : masterySlotsFull ? "All mastery slots in use" : "Use mastery"}
        </label>
      )}

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

        {isMasteryActive && masteryEffect && masteryEffect.rollKind !== "none" && (
          <Button size="sm" variant="accent" onClick={rollMasteryAttack}>
            {masteryEffect.rollLabel}
          </Button>
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
