"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

export type TooltipLine = { label: string; value: string };

type TooltipProps = {
  /** Short heading at the top of the panel, e.g. "Armor Class". */
  title?: string;
  /** Label/value rows explaining how the stat next to this tooltip was computed. */
  lines?: TooltipLine[];
  /** Freeform content instead of/alongside `lines`, for anything a label/value row can't express. */
  children?: ReactNode;
  className?: string;
};

/**
 * Small circular "i" info button that reveals a breakdown panel - used
 * throughout the character sheet next to a derived number (ability
 * modifier, AC, HP, initiative, spell attack/DC, weapon attack/damage) so
 * the player doesn't have to reconstruct the math by hand to see where it
 * came from.
 *
 * Opens on hover/focus (a quick preview) AND toggles a "pinned" state on
 * click/tap (kept open regardless of the pointer, since hover has no
 * equivalent on touch devices and a click shouldn't be undone by the mouse
 * merely leaving). Either state showing is enough to render the panel.
 * Closes on outside click or Escape.
 */
export function Tooltip({ title, lines, children, className }: TooltipProps) {
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const open = hovered || pinned;
  const rootRef = useRef<HTMLSpanElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!pinned) return;

    function handleOutsideClick(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setPinned(false);
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setPinned(false);
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [pinned]);

  return (
    <span ref={rootRef} className={cn("relative inline-flex", className)}>
      <button
        type="button"
        aria-label={title ? `About ${title}` : "More information"}
        aria-expanded={open}
        aria-describedby={panelId}
        onClick={() => setPinned((value) => !value)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-border-strong text-[10px] font-bold not-italic leading-none text-fontcolor-secondary transition-colors hover:border-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
      >
        i
      </button>
      {open && (
        <div
          id={panelId}
          role="tooltip"
          className="absolute bottom-full left-1/2 z-50 mb-2 w-64 max-w-[80vw] -translate-x-1/2 rounded-(--radius-sm) border border-border bg-background-elevated px-3 py-2 text-left text-xs normal-case tracking-normal text-fontcolor-secondary shadow-[0_12px_30px_-16px_rgba(0,0,0,0.85)]"
        >
          {title && <p className="mb-1 font-semibold text-fontcolor">{title}</p>}
          {lines && lines.length > 0 && (
            <dl className="flex flex-col gap-0.5">
              {lines.map((line, index) => (
                <div key={`${line.label}-${index}`} className="flex items-baseline justify-between gap-3">
                  <dt>{line.label}</dt>
                  <dd className="shrink-0 font-medium text-fontcolor">{line.value}</dd>
                </div>
              ))}
            </dl>
          )}
          {children}
        </div>
      )}
    </span>
  );
}
