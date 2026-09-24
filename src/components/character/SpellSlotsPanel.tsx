"use client";

import { SpellSlots } from "@/interfaces/SpellSlots";
import { levelLabel } from "@/components/character/wizard/SpellsStep";
import { SlotPool } from "@/utils/spellRolls";
import { cn } from "@/utils/cn";

/**
 * One slot level's row of round, clickable slot pips. Filled pips are
 * slots still available, hollow ones are spent. Clicking a filled pip
 * spends one slot, clicking a hollow one gets one back - always from the
 * right-hand end, so the row stays filled left to right no matter which
 * pip was clicked (a slot has no identity of its own, only a count).
 */
function SlotRow({
    level,
    max,
    expended,
    onChange,
    poolLabel,
}: {
    level: number;
    max: number;
    expended: number;
    onChange: (delta: number) => void;
    poolLabel: string;
}) {
    const available = Math.max(0, max - expended);
    return (
        <div className="flex items-center gap-3">
            <span className="w-20 shrink-0 text-xs font-semibold uppercase tracking-wide text-fontcolor">
                {levelLabel(level)}
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
                {Array.from({ length: max }).map((_, index) => {
                    const filled = index < available;
                    return (
                        <button
                            key={index}
                            type="button"
                            onClick={() => onChange(filled ? 1 : -1)}
                            aria-label={`${poolLabel} ${levelLabel(level)} slot ${index + 1} - ${filled ? "available, click to spend" : "spent, click to restore"}`}
                            title={filled ? "Available - click to spend" : "Spent - click to restore"}
                            className={cn(
                                "h-5 w-5 shrink-0 cursor-pointer rounded-full border-2 transition-colors",
                                filled
                                    ? "border-foreground-hover bg-foreground hover:bg-foreground-hover"
                                    : "border-border-strong bg-transparent hover:border-foreground/70"
                            )}
                        />
                    );
                })}
            </div>
            <span className="text-xs text-fontcolor-secondary">
                {available}/{max}
            </span>
        </div>
    );
}

function SlotPoolRows({
    title,
    pool,
    slots,
    expended,
    onAdjust,
}: {
    title: string;
    pool: SlotPool;
    slots: SpellSlots | null;
    expended: Record<number, number> | undefined;
    onAdjust: (pool: SlotPool, level: number, delta: number) => void;
}) {
    const levels = Object.entries(slots ?? {})
        .filter(([, count]) => (count ?? 0) > 0)
        .map(([level, count]) => [Number(level), count] as const)
        .sort(([a], [b]) => a - b);
    if (levels.length === 0) return null;

    return (
        <div className="flex flex-col gap-2">
            <p className="text-xs text-fontcolor-secondary">{title}</p>
            {levels.map(([level, count]) => (
                <SlotRow
                    key={level}
                    level={level}
                    max={count}
                    expended={expended?.[level] ?? 0}
                    poolLabel={title}
                    onChange={(delta) => onAdjust(pool, level, delta)}
                />
            ))}
        </div>
    );
}

/**
 * Spell slot tracker for the Spells tab - replaces the old plain-text
 * "4× 1st level, 2× 2nd level" line. One row of pips per slot level, as
 * many pips as the class tables grant at that level (utils/spellcasting.ts),
 * with the spent count persisted on `character.details` (see
 * CharacterDetails.ts's `expendedSpellSlots`/`expendedPactSlots`). The
 * Long rest / Short rest buttons in the sheet header refill them.
 */
export function SpellSlotsPanel({
    spellSlots,
    pactMagicSlots,
    expendedSpellSlots,
    expendedPactSlots,
    onAdjust,
}: {
    spellSlots: SpellSlots | null;
    pactMagicSlots: SpellSlots | null;
    expendedSpellSlots?: Record<number, number>;
    expendedPactSlots?: Record<number, number>;
    onAdjust: (pool: SlotPool, level: number, delta: number) => void;
}) {
    return (
        <div className="flex flex-col gap-3">
            <SlotPoolRows
                title="Spell slots"
                pool="spell"
                slots={spellSlots}
                expended={expendedSpellSlots}
                onAdjust={onAdjust}
            />
            <SlotPoolRows
                title="Pact Magic slots (recharge on a Short rest)"
                pool="pact"
                slots={pactMagicSlots}
                expended={expendedPactSlots}
                onAdjust={onAdjust}
            />
        </div>
    );
}
