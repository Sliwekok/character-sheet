import Image from "next/image";
import { cn } from "@/utils/cn";

type LogoProps = {
  size?: number;
  withWordmark?: boolean;
  className?: string;
};

/** App dice icon, with an optional display-font wordmark next to it. */
export function Logo({ size = 44, withWordmark = true, className }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <Image
        src="/01.png"
        alt="Character Sheet dice icon"
        width={size}
        height={size}
        priority
      />
      {withWordmark && (
        <span className="font-display text-lg tracking-wide text-fontcolor sm:text-xl">
          Character Sheet
        </span>
      )}
    </span>
  );
}
