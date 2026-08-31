"use client";

import { useEffect, useRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/utils/cn";

type Variant = "info" | "danger" | "confirm" | "warning" | "success";

// `sticky` (not `fixed`) - it pins near the top of the viewport, right
// under Nav (which is h-20, hence `top-20`), while scrolling, but still
// scrolls away naturally once its place in the page has passed rather than
// floating forever like a fixed overlay. `mx-auto` + a capped `max-w` keeps
// it centered and wide without stretching edge-to-edge.
const base =
  "sticky top-20 z-20 mx-4 w-auto max-w-4xl sm:mx-auto rounded-(--radius-lg) border px-5 py-4 " +
  "shadow-[0_12px_30px_-16px_rgba(0,0,0,0.7)] backdrop-blur-sm";

const variantStyles: Record<Variant, string> = {
  info: "border-border bg-background-elevated/60 text-fontcolor-secondary",
  confirm: "border-foreground/40 bg-background-elevated/70 text-fontcolor-secondary",
  warning: "border-fontcolor/30 bg-fontcolor/10 text-fontcolor",
  success: "border-foreground/30 bg-foreground/10 text-fontcolor",
  danger: "border-foreground-danger/50 bg-foreground-danger/15 text-fontcolor-secondary",
};

export type AlertProps = Omit<HTMLAttributes<HTMLDivElement>, "title"> & {
  variant?: Variant;
  /** Short heading, e.g. "Delete this character?" */
  title?: ReactNode;
  /** Body copy - the question or notice itself. */
  children: ReactNode;
  /** Buttons for the action the alert is prompting, e.g. Confirm/Cancel. */
  actions?: ReactNode;
  /** Shows a small close (×) button, and enables click-outside-to-dismiss (skipped for the "confirm" variant, which needs an explicit choice). */
  onDismiss?: () => void;
};

/**
 * Wide, slightly-transparent banner for messages the user needs to notice
 * or act on. Sticks near the top of the page, just under Nav, as they
 * scroll. Clicking anywhere outside it dismisses it - except for the
 * "confirm" variant, which requires an explicit action/cancel choice
 * instead of being dismissable by an accidental outside click.
 */
export function Alert({
  variant = "info",
  title,
  children,
  actions,
  onDismiss,
  className,
  ...rest
}: AlertProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!onDismiss || variant === "confirm") return;

    function handleOutsideClick(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        onDismiss?.();
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [onDismiss, variant]);

  return (
    <div
      ref={rootRef}
      role="alert"
      className={cn(base, variantStyles[variant], className)}
      {...rest}
    >
      {onDismiss && (
        <button
          type="button"
          aria-label="Dismiss"
          onClick={onDismiss}
          className="absolute right-4 top-4 text-fontcolor-secondary transition-colors hover:text-fontcolor"
        >
          ✕
        </button>
      )}

      <div className={cn("flex flex-col gap-2", onDismiss && "pr-6")}>
        {title && <p className="font-display text-base tracking-wide text-fontcolor">{title}</p>}
        <div className="text-sm">{children}</div>
        {actions && <div className="mt-1 flex flex-wrap items-center gap-3">{actions}</div>}
      </div>
    </div>
  );
}
