import { cn } from "@/utils/cn";

export type Stat = {
  label: string;
  value: number | string;
};

type StatBlockProps = {
  stats: Stat[];
  className?: string;
};

/** Formats a modifier-like number with an explicit +/- sign, e.g. 2 -> "+2". */
export function formatModifier(value: number): string {
  return value >= 0 ? `+${value}` : `${value}`;
}

/** Compact grid of labeled stats - used for ability modifiers, AC, initiative, etc. */
export function StatBlock({ stats, className }: StatBlockProps) {
  return (
    <dl className={cn("grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3", className)}>
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex items-center justify-between gap-2 rounded-(--radius-sm) bg-background-darken/60 px-3 py-2"
        >
          <dt className="text-sm text-fontcolor-secondary">{stat.label}</dt>
          <dd className="font-semibold text-fontcolor">{stat.value}</dd>
        </div>
      ))}
    </dl>
  );
}
