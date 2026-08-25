import type { HTMLAttributes } from "react";
import { cn } from "@/utils/cn";

type Variant = "solid" | "outline" | "muted";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: Variant;
};

const variants: Record<Variant, string> = {
  solid: "bg-foreground text-background-darken",
  outline: "border border-border-strong text-fontcolor",
  muted: "bg-background-darken text-fontcolor-secondary",
};

/** Small pill used for tags like class, alignment, or a step number. */
export function Badge({ variant = "outline", className, children, ...rest }: BadgeProps) {
  return (
    <span
      {...rest}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
