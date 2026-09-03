"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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

type Coords = { top: number; left: number; placement: "top" | "bottom" };

// Gap between the trigger and the panel, and the margin kept from the
// viewport edges when clamping the panel's position.
const GAP = 8;
const EDGE_MARGIN = 8;

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
 *
 * The panel is rendered through a portal into `document.body` rather than
 * as a normal absolutely-positioned child. Several ancestors in this app
 * (e.g. `Card`'s `backdrop-blur`) create their own stacking context, which
 * traps the panel's z-index inside it - the sticky nav bar (which has an
 * explicit z-index of its own) would then paint over the panel no matter
 * how high that trapped z-index was set. Portaling to `<body>` puts the
 * panel in the same stacking context as the nav bar, so its z-index is
 * compared directly against the nav bar's and wins. Position is then
 * computed in JS (fixed, viewport-relative) from the trigger's bounding
 * box, flipping from above to below the trigger when there isn't enough
 * room above to show it without clipping off the top of the viewport.
 */
export function Tooltip({ title, lines, children, className }: TooltipProps) {
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const open = hovered || pinned;
  const rootRef = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const [coords, setCoords] = useState<Coords | null>(null);

  useEffect(() => {
    if (!pinned) return;

    function handleOutsideClick(event: MouseEvent) {
      const target = event.target as Node;
      const insideTrigger = rootRef.current?.contains(target);
      const insidePanel = panelRef.current?.contains(target);
      if (!insideTrigger && !insidePanel) setPinned(false);
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

  // Position the portaled panel relative to the trigger. Runs as a layout
  // effect so the (first hidden, then placed) render happens before the
  // browser paints, avoiding a visible flash at the wrong spot.
  useLayoutEffect(() => {
    if (!open) {
      setCoords(null);
      return;
    }

    function place() {
      const anchor = rootRef.current;
      const panel = panelRef.current;
      if (!anchor || !panel) return;

      const anchorRect = anchor.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();

      const placement: Coords["placement"] =
        anchorRect.top - panelRect.height - GAP < 0 ? "bottom" : "top";
      const top = placement === "top" ? anchorRect.top - GAP : anchorRect.bottom + GAP;

      const halfWidth = panelRect.width / 2;
      let left = anchorRect.left + anchorRect.width / 2;
      left = Math.max(left, halfWidth + EDGE_MARGIN);
      left = Math.min(left, window.innerWidth - halfWidth - EDGE_MARGIN);

      setCoords({ top, left, placement });
    }

    // First frame: nothing is measurable/positioned yet, so the panel
    // renders off-screen (see style below) purely to get real dimensions.
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  const panel = open && (
    <div
      ref={panelRef}
      id={panelId}
      role="tooltip"
      style={
        coords
          ? {
              position: "fixed",
              top: coords.top,
              left: coords.left,
              transform: coords.placement === "top" ? "translate(-50%, -100%)" : "translate(-50%, 0)",
            }
          : { position: "fixed", top: -9999, left: -9999, visibility: "hidden" }
      }
      className="z-50 w-64 max-w-[80vw] rounded-(--radius-sm) border border-border bg-background-elevated px-3 py-2 text-left text-xs normal-case tracking-normal text-fontcolor-secondary shadow-[0_12px_30px_-16px_rgba(0,0,0,0.85)]"
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
  );

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
      {typeof document !== "undefined" && panel ? createPortal(panel, document.body) : null}
    </span>
  );
}
