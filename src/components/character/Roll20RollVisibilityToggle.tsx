"use client";

import { Tooltip } from "@/components/ui";
import { cn } from "@/utils/cn";
import { Roll20RollVisibility } from "@/utils/roll20/roll20RollVisibility";

const OPTIONS: { value: Roll20RollVisibility; label: string }[] = [
  { value: "public", label: "Public" },
  { value: "gm", label: "GM only" },
];

/**
 * Header segmented toggle: whether rolls made on this sheet land in Roll20
 * chat for everyone or as a whisper to the GM (see roll20RollVisibility.ts).
 * Only matters with the "Character Sheet -> Roll20" extension installed;
 * the sheet's own inline results and Roll History are unaffected.
 */
export function Roll20RollVisibilityToggle({
  value,
  onChange,
}: {
  value: Roll20RollVisibility;
  onChange: (next: Roll20RollVisibility) => void;
}) {
  return (
    <span className="flex items-center gap-1">
      <span
        role="radiogroup"
        aria-label="Who sees your rolls in Roll20"
        className="inline-flex h-9 items-center gap-0.5 rounded-(--radius-lg) border border-border-strong p-0.5 text-sm"
      >
        <span className="pl-2.5 pr-1 text-fontcolor-secondary">Rolls</span>
        {OPTIONS.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(option.value)}
              className={cn(
                "inline-flex h-full cursor-pointer items-center gap-1.5 rounded-(--radius-lg) px-3 font-medium transition-colors duration-200",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground",
                active
                  ? option.value === "gm"
                    ? "bg-foreground-danger text-fontcolor"
                    : "bg-foreground text-background-darken"
                  : "text-fontcolor-secondary hover:text-fontcolor"
              )}
            >
              {option.value === "gm" && (
                <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5" fill="currentColor">
                  <path d="M8 1a3.5 3.5 0 0 0-3.5 3.5V6H4a1.5 1.5 0 0 0-1.5 1.5v6A1.5 1.5 0 0 0 4 15h8a1.5 1.5 0 0 0 1.5-1.5v-6A1.5 1.5 0 0 0 12 6h-.5V4.5A3.5 3.5 0 0 0 8 1Zm2 5H6V4.5a2 2 0 1 1 4 0V6Z" />
                </svg>
              )}
              {option.label}
            </button>
          );
        })}
      </span>
      <Tooltip title="Rolls in Roll20">
        <p>
          Where rolls from this sheet go in Roll20 chat (needs the &quot;Character Sheet → Roll20&quot; extension and
          your game open in another tab). <strong>Public</strong> posts them for the whole table;{" "}
          <strong>GM only</strong> whispers them to the GM (/w gm) - only you and the GM see the result.
        </p>
        <p className="mt-2">Remembered in this browser for every character.</p>
      </Tooltip>
    </span>
  );
}
