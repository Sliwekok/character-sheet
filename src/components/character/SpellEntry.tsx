"use client";

import { useState } from "react";
import { Spell, SpellMechanics } from "@/interfaces/Spell";
import { Badge, Button, Tooltip, formatModifier } from "@/components/ui";
import { SpellcastingInfo } from "@/utils/attackCalculations";
import { levelLabel } from "@/components/character/wizard/SpellsStep";
import { DiceRollResult, describeDiceRoll, rollD20 } from "@/utils/dice";
import {
    SPELL_ROLE_LABELS,
    ScaledSpellRoll,
    fallbackMechanics,
    formatScaledRoll,
    getScaledSpellRolls,
    rollScaledSpellRoll,
    scaledRollLabel,
    spellCanUpcast,
    describeUpcast,
} from "@/utils/spellRolls";
import { cn } from "@/utils/cn";

type RolledResult = { label: string; result: DiceRollResult };

const ABILITY_NAMES: Record<string, string> = {
    strength: "Strength",
    dexterity: "Dexterity",
    constitution: "Constitution",
    intelligence: "Intelligence",
    wisdom: "Wisdom",
    charisma: "Charisma",
};

/** "Damage", "Healing", "Temp HP" + damage type, e.g. "Damage (Fire)" - the prefix of a roll button / history entry. */
function rollTitle(roll: ScaledSpellRoll): string {
    const label = scaledRollLabel(roll);
    return roll.source.damageType ? `${label} (${roll.source.damageType})` : label;
}

/**
 * One spell on the character sheet (and, read-only, on the compendium
 * search page).
 *
 * What it offers is driven by the spell's structured `mechanics` (see
 * interfaces/Spell.ts and data/spells/Spells.ts), not by regex over the
 * description any more:
 * - role badges (Damage / Healing / Buff / Control / ...), primary first;
 * - "Roll spell attack" ONLY for spells that make a spell attack, and a
 *   "DC 14 Dexterity save" note ONLY for spells that call for a save;
 * - one roll button per damage / healing / other-effect roll the spell has
 *   (a healing spell gets a "Healing" button, Bless a "Bonus die" one, a
 *   pure utility spell none at all), with the spellcasting modifier folded
 *   in where the spell says to add it;
 * - an upcasting selector for leveled spells that scale: picking a higher
 *   slot level re-computes every roll (upcastDice / upcastCount) and shows
 *   the spell's upcast note, and "Cast" spends a slot of that level via
 *   `onCast`. Cantrips scale automatically from `characterLevel` instead.
 *
 * `mechanics` is normally resolved by the page from the compendium (a
 * character's stored spells can be older copies without it - see
 * utils/spellRolls.ts's `useSpellMechanicsLookup`); when omitted, the
 * spell's own copy is used, then a best-effort dice-in-text fallback.
 *
 * With `spellcasting={null}` (the search page) nothing is rollable - the
 * dice are shown as plain chips, and the slot selector just previews how
 * the spell scales.
 */
export function SpellEntry({
                               spell,
                               mechanics: mechanicsProp,
                               spellcasting,
                               characterLevel = 1,
                               maxSlotLevel,
                               castableSlotLevels,
                               onCast,
                               concentratingOn,
                               onToggleConcentration,
                               onRoll,
                               alwaysExpanded = false,
                           }: {
    spell: Spell;
    /** Resolved roll data - see the header comment. */
    mechanics?: SpellMechanics;
    spellcasting: SpellcastingInfo | null;
    /** Total character level - drives cantrip damage upgrades at 5/11/17. */
    characterLevel?: number;
    /** Highest slot level the character has at all (either pool) - caps the upcast selector. Omit to allow up to 9th (preview). */
    maxSlotLevel?: number;
    /** Slot levels that still have at least one unspent slot - "Cast" is only enabled at these. */
    castableSlotLevels?: number[];
    /** Spends one slot of the given level. Omit to hide the "Cast" button. */
    onCast?: (slotLevel: number) => void;
    concentratingOn?: string;
    onToggleConcentration?: (spellName: string) => void;
    /** Called with a human-readable label and the roll result for every roll made here - feeds the page's shared Roll History widget (see RollHistoryWidget.tsx). */
    onRoll?: (label: string, result: DiceRollResult) => void;
    alwaysExpanded?: boolean;
}) {
    const mechanics = mechanicsProp ?? spell.mechanics ?? fallbackMechanics(spell);
    const topSlotLevel = Math.max(spell.level, Math.min(9, maxSlotLevel ?? 9));
    const upcastable = spellCanUpcast(spell, mechanics) && topSlotLevel > spell.level;

    // Default to the lowest level that actually has a slot left, so "Cast" works without touching the selector.
    const defaultLevel = castableSlotLevels?.find((level) => level >= spell.level) ?? spell.level;
    const [chosenLevel, setChosenLevel] = useState<number | null>(null);
    const castLevel = Math.min(topSlotLevel, Math.max(spell.level, chosenLevel ?? defaultLevel));

    const [rolled, setRolled] = useState<RolledResult | null>(null);
    const [lastCast, setLastCast] = useState<string | null>(null);
    const isConcentrating = concentratingOn === spell.name;
    const abilityModifier = spellcasting ? spellcasting.abilityModifier : null;

    const rolls = getScaledSpellRolls(mechanics, {
        spellLevel: spell.level,
        castLevel,
        characterLevel,
    });
    const castSuffix = spell.level > 0 && castLevel > spell.level ? ` (${levelLabel(castLevel)} slot)` : "";
    const canCastNow = castableSlotLevels?.includes(castLevel) ?? false;

    function record(label: string, result: DiceRollResult) {
        setRolled({ label, result });
        onRoll?.(`${spell.name}${castSuffix} — ${label}`, result);
    }

    function rollAttack() {
        if (!spellcasting) return;
        record("Spell attack roll", rollD20(spellcasting.spellAttackBonus));
    }

    function rollEffect(roll: ScaledSpellRoll) {
        if (abilityModifier === null) return;
        const result = rollScaledSpellRoll(roll, abilityModifier);
        record(`${rollTitle(roll)} · ${result.formula}`, result);
    }

    function cast() {
        if (!onCast || !canCastNow) return;
        onCast(castLevel);
        setLastCast(`Cast using a ${levelLabel(castLevel)} slot.`);
    }

    const headerContent = (
        <>
            {!alwaysExpanded && (
                <span className="transition-transform group-open:rotate-90">
                    <svg
                        className="h-3 w-3 shrink-0 transition-transform"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="m9 18 6-6-6-6" />
                    </svg>
                </span>
            )}
            <span className="font-semibold text-fontcolor">{spell.name}</span>

            <Badge variant="outline">{spell.school}</Badge>

            {mechanics.roles.map((role, index) => (
                <Badge key={role} variant={index === 0 ? "solid" : "muted"}>
                    {SPELL_ROLE_LABELS[role]}
                </Badge>
            ))}

            {spell.ritual && <Badge variant="muted">Ritual</Badge>}

            {spell.concentration && (
                <Badge variant={isConcentrating ? "solid" : "muted"}>
                    {isConcentrating ? "Concentrating" : "Concentration"}
                </Badge>
            )}

            <p className="basis-full mt-1 text-xs">
                {spell.castingTime} · {spell.range} · {spell.components.join(", ")}{" "}
                · {spell.duration}
            </p>
        </>
    );

    return (
        <div className="rounded-(--radius-sm) bg-background-darken/60 px-3 py-2">
            {alwaysExpanded ? (
                <div className="w-full">
                    <div className="flex flex-wrap items-center gap-2">{headerContent}</div>
                    <div className="mt-2 whitespace-pre-line text-xs">
                        {spell.description}
                    </div>
                </div>
            ) : (
                <details className="w-full group">
                    <summary className="flex flex-wrap items-center gap-2 cursor-pointer">
                        {headerContent}
                    </summary>

                    <div className="mt-2 whitespace-pre-line text-xs">
                        {spell.description}
                    </div>
                </details>
            )}

            {/* Upcasting: pick the slot level to cast with. Every roll below re-scales to it. */}
            {upcastable && (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-fontcolor-secondary">Cast at</span>
                    <div className="flex flex-wrap gap-1" role="radiogroup" aria-label={`${spell.name} slot level`}>
                        {Array.from({ length: topSlotLevel - spell.level + 1 }, (_, i) => spell.level + i).map((level) => {
                            const active = level === castLevel;
                            const hasSlot = castableSlotLevels ? castableSlotLevels.includes(level) : true;
                            return (
                                <button
                                    key={level}
                                    type="button"
                                    role="radio"
                                    aria-checked={active}
                                    onClick={() => setChosenLevel(level)}
                                    title={hasSlot ? `${levelLabel(level)} slot` : `${levelLabel(level)} slot - none left`}
                                    className={cn(
                                        "h-7 min-w-7 cursor-pointer rounded-full border px-2 text-xs font-semibold transition-colors",
                                        active
                                            ? "border-foreground-hover bg-foreground text-background-darken"
                                            : "border-border-strong text-fontcolor hover:border-foreground",
                                        !hasSlot && !active && "opacity-50"
                                    )}
                                >
                                    {level}
                                </button>
                            );
                        })}
                    </div>
                    {describeUpcast(mechanics).length > 0 && (
                        <span className="text-fontcolor-secondary">({describeUpcast(mechanics).join("; ")})</span>
                    )}
                    {mechanics.upcastNote && castLevel > spell.level && (
                        <span className="basis-full text-fontcolor-secondary">Upcast: {mechanics.upcastNote}</span>
                    )}
                </div>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
                {spellcasting && mechanics.attack && (
                    <span className="flex items-center gap-1">
                        <Button size="sm" variant="secondary" onClick={rollAttack}>
                            {mechanics.attack === "melee" ? "Melee" : "Ranged"} spell attack{" "}
                            {formatModifier(spellcasting.spellAttackBonus)}
                        </Button>
                        <Tooltip title="Spellcasting" lines={spellcasting.lines} />
                    </span>
                )}

                {mechanics.save && (
                    <span className="flex items-center gap-1 text-xs text-fontcolor-secondary">
                        {spellcasting ? `DC ${spellcasting.spellSaveDC} ` : ""}
                        {ABILITY_NAMES[mechanics.save]} save
                        {spellcasting && <Tooltip title="Spellcasting" lines={spellcasting.lines} />}
                    </span>
                )}

                {rolls.map((roll, index) => {
                    const formula = formatScaledRoll(roll, abilityModifier);
                    const text = `${rollTitle(roll)} · ${formula}`;
                    return spellcasting ? (
                        <Button
                            key={index}
                            size="sm"
                            variant={roll.kind === "healing" ? "accent" : "secondary"}
                            onClick={() => rollEffect(roll)}
                        >
                            {text}
                        </Button>
                    ) : (
                        <span
                            key={index}
                            className="rounded-full border border-border-strong px-3 py-1 text-xs text-fontcolor"
                        >
                            {text}
                        </span>
                    );
                })}

                {onCast && spell.level > 0 && (
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={cast}
                        disabled={!canCastNow}
                        title={canCastNow ? `Spend one ${levelLabel(castLevel)} slot` : `No ${levelLabel(castLevel)} slots left`}
                    >
                        Cast ({levelLabel(castLevel)})
                    </Button>
                )}

                {spell.concentration && onToggleConcentration && (
                    <Button
                        size="sm"
                        variant={isConcentrating ? "accent" : "secondary"}
                        onClick={() => onToggleConcentration(spell.name)}
                    >
                        {isConcentrating ? "Stop concentrating" : "Concentrate"}
                    </Button>
                )}
            </div>

            {lastCast && <p className="mt-2 text-xs text-fontcolor-secondary">{lastCast}</p>}

            {rolled && (
                <p className="mt-2 text-xs text-fontcolor">
                    {rolled.label}: {describeDiceRoll(rolled.result)}
                </p>
            )}
        </div>
    );
}
