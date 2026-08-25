import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/utils/cn";

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  icon?: ReactNode;
};

/** Styled text input, e.g. the nav search field or future form fields. */
export function TextInput({ icon, className, ...rest }: TextInputProps) {
  return (
    <div className="relative flex items-center">
      {icon && (
        <span className="pointer-events-none absolute left-3 text-fontcolor-secondary">
          {icon}
        </span>
      )}
      <input
        {...rest}
        className={cn(
          "w-full rounded-(--radius) border border-border-strong bg-background-darken px-3 py-2 text-fontcolor",
          "placeholder:text-fontcolor-secondary",
          "focus:outline-none focus:ring-2 focus:ring-foreground focus:border-foreground",
          icon ? "pl-9" : undefined,
          className
        )}
      />
    </div>
  );
}
