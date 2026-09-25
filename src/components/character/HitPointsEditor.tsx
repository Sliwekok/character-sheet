"use client";

import { useState } from "react";
import { Badge } from "@/components/ui";
import { cn } from "@/utils/cn";
import { parseHpInput } from "@/utils/hitDice";

/**
 * The header's "HP current/max" badge. Double-click it (or focus it and
 * press Enter) to swap it for an inline input: a bare number sets HP
 * outright, "-8" applies damage and "+5" healing. Enter or clicking away
 * saves, Escape cancels. Clamping to 0..max happens in the page's
 * `onChange` handler (see utils/hitDice.ts's `applyCurrentHp`), not here.
 */
export function HitPointsEditor({
    currentHp,
    maxHp,
    onChange,
}: {
    currentHp: number;
    maxHp: number;
    onChange: (nextHp: number) => void;
}) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState("");

    function startEditing() {
        setDraft(String(currentHp));
        setEditing(true);
    }

    function commit() {
        const next = parseHpInput(draft, currentHp);
        if (next !== null && next !== currentHp) onChange(next);
        setEditing(false);
    }

    if (editing) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-background-darken px-3 py-0.5 text-xs font-semibold uppercase tracking-wide text-fontcolor-secondary">
                HP
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
                    className="w-14 rounded border border-border-strong bg-background px-1.5 py-0.5 text-center text-xs text-fontcolor focus:border-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
                />
                /{maxHp}
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
            title="Double-click to edit current HP"
            className="inline-flex cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
        >
            {/* Colour on an inner span, not the Badge's className - cn() has no
                conflict resolution, so it couldn't reliably override the muted
                variant's own text colour. */}
            <Badge variant="muted" className="select-none">
                <span className={cn(currentHp <= 0 && "text-foreground-danger")}>
                    HP {currentHp}/{maxHp}
                </span>
            </Badge>
        </button>
    );
}
