import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/utils/cn";

type DivProps = HTMLAttributes<HTMLDivElement> & { children?: ReactNode };

export function Card({ className, children, ...rest }: DivProps) {
  return (
    <div
      {...rest}
      className={cn(
        "rounded-(--radius-lg) border border-border bg-background-elevated/60 shadow-[0_12px_30px_-16px_rgba(0,0,0,0.7)] backdrop-blur-sm",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...rest }: DivProps) {
  return (
    <div
      {...rest}
      className={cn(
        "flex items-start justify-between gap-4 border-b border-border px-5 py-4",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      {...rest}
      className={cn(
        "font-display text-lg tracking-wide text-fontcolor",
        className
      )}
    >
      {children}
    </h3>
  );
}

export function CardContent({ className, children, ...rest }: DivProps) {
  return (
    <div {...rest} className={cn("px-5 py-4", className)}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...rest }: DivProps) {
  return (
    <div
      {...rest}
      className={cn(
        "flex items-center gap-3 border-t border-border px-5 py-4",
        className
      )}
    >
      {children}
    </div>
  );
}
