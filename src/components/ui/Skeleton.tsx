import type { HTMLAttributes } from "react";
import { cn } from "@/utils/cn";

type SkeletonProps = HTMLAttributes<HTMLDivElement>;

/**
 * Shimmering placeholder block - the building unit every route's
 * `loading.tsx` skeleton is made of. Sized entirely through `className`
 * (e.g. `h-4 w-32`), so callers compose real layouts (grids, stacks, card
 * shapes) out of these rather than this component owning any shape itself.
 * Matches the app's dark/gold palette (see the `.skeleton` rule in
 * globals.css) so a loading page reads as "this app, mid-load" rather than
 * a generic gray flash. `aria-hidden` since it's purely decorative - the
 * route's `loading.tsx` carries no real content for a screen reader to
 * announce differently than "loading".
 */
export function Skeleton({ className, ...rest }: SkeletonProps) {
  return <div aria-hidden {...rest} className={cn("skeleton rounded-(--radius-sm)", className)} />;
}

/**
 * Skeleton stand-in for `SectionHeading` (eyebrow + title + gold underline
 * rule + optional subtitle line(s)) - every page opens with one of these,
 * so each route's `loading.tsx` starts by rendering this instead of
 * re-describing the same handful of bars itself.
 */
export function SkeletonHeading({
  eyebrow = true,
  subtitleLines = 1,
  align = "left",
  className,
}: {
  eyebrow?: boolean;
  /** Number of subtitle bars to show, 0 to omit the subtitle entirely. */
  subtitleLines?: number;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3", align === "center" && "items-center", className)}>
      {eyebrow && <Skeleton className="h-3 w-24" />}
      <Skeleton className="h-9 w-64 sm:w-80" />
      <Skeleton className="h-1 w-16 rounded-full" />
      {subtitleLines > 0 && (
        <div className={cn("flex w-full max-w-2xl flex-col gap-2", align === "center" && "items-center")}>
          {Array.from({ length: subtitleLines }).map((_, i) => (
            <Skeleton
              key={i}
              className={cn("h-4", i === subtitleLines - 1 ? "w-2/3 max-w-sm" : "w-full")}
            />
          ))}
        </div>
      )}
    </div>
  );
}
