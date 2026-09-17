"use client";

import { cn } from "@/utils/cn";

export type TabItem<T extends string> = {
  key: T;
  label: string;
  /** Small count badge shown after the label (e.g. spells known, items carried) - omitted entirely when 0/undefined so an empty section doesn't clutter the tab strip. */
  count?: number;
};

/**
 * Horizontal, underline-style tab strip - the D&D Beyond-esque "Actions /
 * Spells / Inventory / Features & Traits / Background" switcher on the
 * character sheet page. Deliberately generic (typed over the tab key union
 * the caller defines) so it isn't tied to that one page's tab set.
 *
 * Purely a controlled strip: it renders `tabs` and calls `onChange` on
 * click, the caller owns which panel is actually shown (see
 * app/character/[id]/page.tsx's `activeTab` state) - same "dumb" pattern as
 * PipRow/StatusPanel already use for their own click handlers.
 */
export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: TabItem<T>[];
  active: T;
  onChange: (key: T) => void;
  className?: string;
}) {
  return (
    <div role="tablist" className={cn("flex flex-wrap gap-x-1 gap-y-2 border-b border-border", className)}>
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.key)}
            className={cn(
              "flex cursor-pointer items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-semibold uppercase tracking-wide transition-colors sm:px-4",
              isActive
                ? "border-foreground text-foreground"
                : "border-transparent text-fontcolor-secondary hover:text-fontcolor"
            )}
          >
            {tab.label}
            {Boolean(tab.count) && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-bold normal-case tracking-normal",
                  isActive ? "bg-foreground text-background-darken" : "bg-background-darken text-fontcolor-secondary"
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
