import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/utils/cn";

type ContainerProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  /** Cap the max width; defaults to a comfortable reading/dashboard width. */
  size?: "md" | "lg" | "xl" | "2xl";
};

const sizes = {
  md: "max-w-3xl",
  lg: "max-w-5xl",
  xl: "max-w-7xl",
  /** Wide dashboard-style layout - used by the character sheet page, which has enough
   *  distinct panels (sidebar + tabbed content) to make good use of the extra width on
   *  larger screens, while `px-6 sm:px-8` below still keeps a comfortable side margin. */
  "2xl": "max-w-[1600px]",
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
