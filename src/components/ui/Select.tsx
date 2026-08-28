import type { SelectHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

/** Styled `<select>`, sized and colored to match TextInput - used throughout the character wizard (race/class/background/subclass pickers). */
export function Select({ className, children, ...rest }: SelectProps) {
  return (
    <select
      {...rest}
      className={cn(
        "w-full rounded-(--radius) border border-border-strong bg-background-darken px-3 py-2 text-fontcolor",
        "focus:outline-none focus:ring-2 focus:ring-foreground focus:border-foreground",
        className
      )}
    >
      {children}
    </select>
  );
}
