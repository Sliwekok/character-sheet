"use client";

import { useState } from "react";
import { cn } from "@/utils/cn";
import { parseHpInput } from "@/utils/hitDice";

/** viewBox 0 0 24 22 - a plain, symmetric heart. */
const HEART_PATH =
    "M12 21.2 C11.6 21.2 11.2 21 10.9 20.8 C5.2 16.1 1 12.3 1 7.4 C1 3.9 3.7 1.2 7.1 1.2 C9 1.2 10.8 2.1 12 3.6 C13.2 2.1 15 1.2 16.9 1.2 C20.3 1.2 23 3.9 23 7.4 C23 12.3 18.8 16.1 13.1 20.8 C12.8 21 12.4 21.2 12 21.2 Z";

/**
 * Heart styling for a given HP ratio, kept to the sheet's own palette: a
 * maroon fill (the theme's danger tone) with the same muted gold outline as
 * the AC shield. The fill fades as HP drains - a nearly empty heart reads as
 * "nearly dead" at a glance - and only once HP is critical (25% or less)
 * does the outline switch to red.
 */
export function heartStyle(currentHp: number, maxHp: number) {
    const ratio = maxHp > 0 ? Math.min(1, Math.max(0, currentHp / maxHp)) : 0;
    return {
        fillOpacity: currentHp <= 0 ? 0.1 : 0.25 + 0.75 * ratio,
        critical: ratio <= 0.25,
    };
}

/**
 * The header's HP heart: current HP large in the middle, max HP small
 * underneath, the heart's colour/opacity tracking how hurt the character is.
 * Double-click it (or focus it and press Enter) to swap the numbers for an
 * inline input: a bare number sets HP outright, "-8" applies damage and "+5"
 * healing. Enter or clicking away saves, Escape cancels. Clamping to 0..max
 * happens in the page's `onChange` handler (see utils/hitDice.ts's
 * `applyCurrentHp`), not here.
 */
export function HitPointsEditor({
    currentHp,
    maxHp,
    onChange,
}: {
    currentHp: number;
    maxHp: number;
    /** Omit for a read-only view (a character shared with you) - just the heart, no editing. */
    onChange?: (nextHp: number) => void;
}) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState("");
    const style = heartStyle(currentHp, maxHp);
    const label = `HP ${currentHp}/${maxHp}`;

    function startEditing() {
        setDraft(String(currentHp));
        setEditing(true);
    }

    function commit() {
        const next = parseHpInput(draft, currentHp);
        if (next !== null && next !== currentHp) onChange?.(next);
        setEditing(false);
    }

    const heart = (
        <svg viewBox="0 0 24 22" aria-hidden="true" className="absolute inset-0 h-full w-full overflow-visible">
            <path
                d={HEART_PATH}
                fillOpacity={style.fillOpacity}
                strokeWidth={1.1}
                strokeLinejoin="round"
                className={cn(
                    "fill-foreground-danger transition-[fill-opacity,stroke] duration-500",
                    style.critical ? "stroke-fontcolor-danger/70" : "stroke-border-strong",
                )}
            />
        </svg>
    );

    // Numbers sit a bit above the geometric centre - that's where the heart is widest.
    const numbers = (
        <span className="relative flex -translate-y-0.5 flex-col items-center leading-none [text-shadow:0_1px_2px_rgb(0_0_0/0.6)]">
            <span className={cn("text-xl font-bold", currentHp <= 0 ? "text-fontcolor-danger" : "text-fontcolor")}>
                {currentHp}
            </span>
            <span className="mt-0.5 text-[10px] font-semibold text-fontcolor-secondary">/{maxHp}</span>
        </span>
    );

    const shapeClasses = "relative flex h-[62px] w-[68px] shrink-0 items-center justify-center";

    if (!onChange) {
        return (
            <span role="img" aria-label={label} title={label} className={shapeClasses}>
                {heart}
                {numbers}
            </span>
        );
    }

    if (editing) {
        return (
            <span className={shapeClasses}>
                {heart}
                <span className="relative flex -translate-y-0.5 flex-col items-center leading-none">
                    <input
                        autoFocus
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        onFocus={(event) => event.target.select()}
                        onBlur={commit}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") commit();
                            if (event.key === "Escape") setEditing(false);
                        }}
                        inputMode="numeric"
                        aria-label="Current hit points (a number, or -N for damage / +N for healing)"
                        title="A number sets HP; -N applies damage, +N heals. Enter saves, Esc cancels."
                        className="w-11 rounded border border-border-strong bg-background px-1 py-0.5 text-center text-sm font-bold text-fontcolor focus:border-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
                    />
                    <span className="mt-0.5 text-[10px] font-semibold text-fontcolor-secondary [text-shadow:0_1px_2px_rgb(0_0_0/0.6)]">
                        /{maxHp}
                    </span>
                </span>
            </span>
        );
    }

    return (
        <button
            type="button"
            onDoubleClick={startEditing}
            onKeyDown={(event) => {
                if (event.key === "Enter") startEditing();
            }}
            aria-label={label}
            title="Double-click to edit current HP"
            className={cn(
                shapeClasses,
                "cursor-pointer select-none rounded-(--radius-sm) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground",
            )}
        >
            {heart}
            {numbers}
        </button>
    );
}
