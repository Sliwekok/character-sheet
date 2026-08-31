import Link from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";
import { cn } from "@/utils/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-(--radius-lg) font-medium " +
  "transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 " +
  "focus-visible:outline-foreground disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary: "bg-foreground text-background-darken hover:bg-foreground-hover",
  secondary:
    "border border-border-strong text-fontcolor hover:border-foreground hover:text-foreground",
  ghost:
    "text-fontcolor-secondary hover:text-fontcolor hover:bg-background-elevated",
  danger:
    "bg-foreground-danger hover:bg-foreground-danger/90 text-fontcolor-secondary ml-auto cursor-pointer"
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-base",
  lg: "h-12 px-6 text-base sm:h-14 sm:px-8",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
};

type ButtonAsButton = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type ButtonAsLink = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { href: string };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

/**
 * Shared call-to-action control. Renders a Next.js <Link> when `href` is
 * given, otherwise a plain <button>, so the same variants/sizes cover both
 * navigation and in-page actions across the app.
 */
export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: ButtonProps) {
  const classes = cn(base, variants[variant], sizes[size], className);

  if (rest.href) {
    const linkProps = rest as Omit<ButtonAsLink, keyof CommonProps>;
    return (
      <Link {...linkProps} href={linkProps.href} className={classes}>
        {children}
      </Link>
    );
  }

  const buttonProps = rest as Omit<ButtonAsButton, keyof CommonProps>;
  return (
    <button
      {...buttonProps}
      type={buttonProps.type ?? "button"}
      className={classes}
    >
      {children}
    </button>
  );
}
