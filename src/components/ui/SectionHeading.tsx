import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/utils/cn";

type SectionHeadingProps = HTMLAttributes<HTMLDivElement> & {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  align?: "left" | "center";
};

/** Display-font heading with a small gold accent rule, used at the top of every page. */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "left",
  className,
  ...rest
}: SectionHeadingProps) {
  return (
    <div
      {...rest}
      className={cn(
        "flex flex-col gap-2",
        align === "center" && "items-center text-center",
        className
      )}
    >
      {eyebrow && (
        <span className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground">
          {eyebrow}
        </span>
      )}
      <h1 className="font-display text-3xl tracking-wide text-fontcolor sm:text-4xl">
        {title}
      </h1>
      <span
        className={cn(
          "h-1 w-16 rounded-full bg-foreground",
          align === "center" && "mx-auto"
        )}
      />
      {subtitle && (
        <p className="max-w-2xl text-fontcolor-secondary">{subtitle}</p>
      )}
    </div>
  );
}
