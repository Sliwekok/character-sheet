"use client";

import { useState } from "react";
import { Badge } from "@/components/ui";
import { DiceRollResult, describeDiceRoll } from "@/utils/dice";
import { cn } from "@/utils/cn";

export type RollHistoryEntry = {
  id: string;
  /** e.g. "Longsword — Attack roll", "Fireball — Spell attack roll", "Stealth check". */
  label: string;
  result: DiceRollResult;
  rolledAt: number;
};

/** "14:32:05" - wall-clock rather than a "3s ago" relative label, so entries don't need a ticking timer to stay accurate while the panel is open. */
function formatRolledAt(rolledAt: number): string {
  return new Date(rolledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

/**
 * Floating roll-history toggle for the character sheet - collects every
 * "Roll ..." button press from anywhere on the page (WeaponEntry's attack/
 * damage/mastery rolls, SpellEntry's spell attack/effect rolls, SkillsPanel's
 * skill checks - each calls the shared `onRoll` callback the page passes
 * them, on top of their own existing inline result display, which is
 * unchanged) into one running log.
 *
 * Renders nothing at all until `history` has at least one entry - there's no
 * empty "Roll History" button cluttering the corner of a sheet nobody has
 * rolled on yet. Once it does appear, `open` still defaults to `false`: the
 * button badges the running count, but the panel itself stays collapsed
 * until the player clicks it open, exactly like every other toggle-to-reveal
 * control on this page (Tooltip, the spell/feature `<details>` disclosures).
 */
export function RollHistoryWidget({ history, onClear }: { history: RollHistoryEntry[]; onClear: () => void }) {
  const [open, setOpen] = useState(false);
  let historyReversed = [...history].reverse();
  console.log(history, historyReversed);

  if (historyReversed.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2">
      {open && (
        <div className="flex max-h-[60vh] w-80 max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-(--radius-lg) border border-border bg-background-elevated shadow-[0_12px_30px_-16px_rgba(0,0,0,0.85)]">
          <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
            <span className="font-display text-sm tracking-wide text-fontcolor">Roll History</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClear}
                className="cursor-pointer text-xs text-fontcolor-secondary underline-offset-2 hover:text-fontcolor hover:underline"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close roll history"
                className="text-fontcolor-secondary hover:text-fontcolor cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="flex flex-col divide-y divide-border overflow-y-auto">
            {historyReversed.map((entry) => (
              <div key={entry.id} className="flex flex-col gap-0.5 px-4 py-2 text-xs cursor-pointer">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-fontcolor">{entry.label}</span>
                  <span className="shrink-0 text-fontcolor-secondary">{formatRolledAt(entry.rolledAt)}</span>
                </div>
                <span className="text-fontcolor-secondary">{describeDiceRoll(entry.result)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className={cn(
          "cursor-pointer flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold shadow-[0_12px_30px_-16px_rgba(0,0,0,0.85)] transition-colors",
          open
            ? "border-foreground-hover bg-foreground text-background-darken"
            : "border-border-strong bg-background-elevated text-fontcolor hover:border-foreground/60"
        )}
      >
        Roll History
        <Badge variant={open ? "outline" : "solid"}>{historyReversed.length}</Badge>
      </button>
    </div>
  );
}
