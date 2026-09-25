import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

/**
 * A collapsible block of class or subclass features on the character sheet's
 * "Features & Traits" tab. The title row is a real <button> (aria-expanded +
 * aria-controls) so the whole header - not just a tiny icon - toggles the
 * list, and it works from the keyboard. Purely controlled: the page owns
 * which groups are collapsed (`collapsed`/`onToggle`), so it can key them per
 * class entry and per class-vs-subclass.
 *
 * `hiddenLockedCount` is how many locked features the page is currently
 * filtering out of `children` (the "Show locked features" toggle is off) -
 * surfaced as a small hint in the header so the player knows there's more
 * ahead even while it's hidden.
 */
export function FeatureGroup({
  id,
  title,
  subtitle,
  variant = "class",
  collapsed,
  onToggle,
  featureCount,
  hiddenLockedCount = 0,
  children,
}: {
  /** Unique DOM id stem - used to wire aria-controls to the list. */
  id: string;
  title: ReactNode;
  subtitle?: ReactNode;
  /** "class" is the top-level heading; "subclass" renders slightly smaller and indented under it. */
  variant?: "class" | "subclass";
  collapsed: boolean;
  onToggle: () => void;
  /** Number of features currently shown in the list (after the locked filter). */
  featureCount: number;
  hiddenLockedCount?: number;
  children: ReactNode;
}) {
  const panelId = `${id}-features`;

  return (
    <div className={cn("flex flex-col gap-2", variant === "subclass" && "border-l-2 border-border-strong/60 pl-3")}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={!collapsed}
        aria-controls={panelId}
        title={collapsed ? "Show features" : "Hide features"}
        className="group flex w-full cursor-pointer items-center gap-2 rounded-(--radius-sm) text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
      >
        <svg
          viewBox="0 0 12 12"
          aria-hidden="true"
          className={cn(
            "h-3 w-3 shrink-0 fill-current text-fontcolor-secondary transition-transform duration-200 group-hover:text-foreground",
            !collapsed && "rotate-90"
          )}
        >
          <path d="M4 2l5 4-5 4z" />
        </svg>
        <span
          className={cn(
            "font-semibold uppercase tracking-wide group-hover:text-foreground-hover",
            variant === "class" ? "text-xs text-foreground" : "text-[11px] text-fontcolor"
          )}
        >
          {title}
        </span>
        {subtitle && <span className="text-[11px] text-fontcolor-secondary">{subtitle}</span>}
        <span className="ml-auto flex items-center gap-2 text-[11px] text-fontcolor-secondary">
          <span>
            {featureCount} feature{featureCount === 1 ? "" : "s"}
          </span>
          {hiddenLockedCount > 0 && <span className="italic">· {hiddenLockedCount} locked hidden</span>}
          <span className="underline-offset-2 group-hover:underline">{collapsed ? "Show" : "Hide"}</span>
        </span>
      </button>
      {!collapsed && (
        <div id={panelId} className="flex flex-col gap-2">
          {children}
        </div>
      )}
    </div>
  );
}
