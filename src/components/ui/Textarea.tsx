import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

/** Styled multi-line text field - same visual language as TextInput, for the longer flavor fields on the Details step (backstory, personality traits, etc.). */
export function Textarea({ className, rows = 3, ...rest }: TextareaProps) {
  return (
    <textarea
      {...rest}
      rows={rows}
      className={cn(
        "w-full rounded-(--radius) border border-border-strong bg-background-darken px-3 py-2 text-fontcolor",
        "placeholder:text-fontcolor-secondary",
        "focus:outline-none focus:ring-2 focus:ring-foreground focus:border-foreground",
        className
      )}
    />
  );
}
