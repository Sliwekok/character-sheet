"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/utils/cn";

type Variant = "info" | "danger" | "confirm" | "warning" | "success";

// `sticky` (not `fixed`) - it pins near the top of the viewport, right
// under Nav (which is h-20, hence `top-20`), while scrolling, but still
// scrolls away naturally once its place in the page has passed rather than
// floating forever like a fixed overlay. `mx-auto` + a capped `max-w` keeps
// it centered and wide without stretching edge-to-edge.
const surface =
  "rounded-(--radius-lg) border px-5 py-4 shadow-[0_12px_30px_-16px_rgba(0,0,0,0.7)] backdrop-blur-sm";
const bannerPosition = "sticky top-20 z-20 mx-4 w-auto max-w-4xl sm:mx-auto";
// `modal`: a fixed, centered panel over a dimmed backdrop - out of the page
// flow entirely, so opening it never pushes the page content around.
const modalPosition = "relative w-full max-w-lg max-h-[calc(100vh-2rem)] overflow-y-auto";

// Border + text colour per variant (shared by banner and modal)...
const variantStyles: Record<Variant, string> = {
  info: "border-border text-fontcolor-secondary",
  confirm: "border-foreground/40 text-fontcolor-secondary",
  warning: "border-fontcolor/30 text-fontcolor",
  success: "border-foreground/30 text-fontcolor",
  danger: "border-foreground-danger/50 text-fontcolor-secondary",
};

// ...and background, kept separate because cn() has no conflict resolution:
// the banner uses these deliberately see-through tints, while a modal gets
// one solid background instead (a tint reads as muddy over the backdrop).
const bannerBackgrounds: Record<Variant, string> = {
  info: "bg-background-elevated/60",
  confirm: "bg-background-elevated/70",
  warning: "bg-fontcolor/10",
  success: "bg-foreground/10",
  danger: "bg-foreground-danger/15",
};
const modalBackground = "bg-background-elevated";

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
  /**
   * Render as a proper modal dialog instead of an in-flow sticky banner:
   * portalled to <body>, centered over a dimmed backdrop, page scroll
   * locked while open, Escape calls `onDismiss`. Backdrop clicks dismiss
   * too, except for the "confirm" variant (same rule as the banner).
   */
  modal?: boolean;
};

/**
 * Wide, slightly-transparent banner for messages the user needs to notice
 * or act on. Sticks near the top of the page, just under Nav, as they
 * scroll. Clicking anywhere outside it dismisses it - except for the
 * "confirm" variant, which requires an explicit action/cancel choice
 * instead of being dismissable by an accidental outside click. Pass
 * `modal` for a centered dialog over a backdrop instead (see the prop).
 */
export function Alert({
  variant = "info",
  title,
  children,
  actions,
  onDismiss,
  modal = false,
  className,
  ...rest
}: AlertProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  // Modal only: Escape to dismiss, and lock page scroll behind the dialog.
  useEffect(() => {
    if (!modal) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onDismiss?.();
    }
    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [modal, onDismiss]);

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

  const panel = (
    <div
      ref={rootRef}
      role={modal ? "dialog" : "alert"}
      aria-modal={modal || undefined}
      className={cn(
        surface,
        variantStyles[variant],
        modal ? modalPosition : bannerPosition,
        modal ? modalBackground : bannerBackgrounds[variant],
        className
      )}
      {...rest}
    >
      {onDismiss && (
        <button
          type="button"
          aria-label="Dismiss"
          onClick={onDismiss}
          className="absolute right-4 top-4 cursor-pointer text-fontcolor-secondary transition-colors hover:text-fontcolor"
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

  if (!modal) return panel;
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-[2px]">{panel}</div>,
    document.body
  );
}
