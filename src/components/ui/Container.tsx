import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/utils/cn";

type ContainerProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  /** Cap the max width; defaults to a comfortable reading/dashboard width. */
  size?: "md" | "lg" | "xl";
};

const sizes = {
  md: "max-w-3xl",
  lg: "max-w-5xl",
  xl: "max-w-7xl",
};

/** Centered, responsively-padded content wrapper reused by every page. */
export function Container({
  size = "xl",
  className,
  children,
  ...rest
}: ContainerProps) {
  return (
    <div
      {...rest}
      className={cn("mx-auto w-full px-6 sm:px-8", sizes[size], className)}
    >
      {children}
    </div>
  );
}
