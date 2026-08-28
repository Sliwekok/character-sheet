import { cn } from "@/utils/cn";

type StepProgressProps = {
  steps: string[];
  currentIndex: number;
  /** Jump straight to a step, bypassing the sequential Continue/Back flow - the wizard imposes no restriction here (see ManualWizard's `canProceed`, which only gates the Continue button, not this). */
  onSelect: (index: number) => void;
};

/** Numbered, clickable step indicator for the manual character wizard - the wizard page owns `currentIndex` and `onSelect` decides what a click does. */
export function StepProgress({ steps, currentIndex, onSelect }: StepProgressProps) {
  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-3 text-sm">
      {steps.map((step, index) => {
        const isCurrent = index === currentIndex;
        const isDone = index < currentIndex;

        return (
          <li key={step} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSelect(index)}
              aria-current={isCurrent ? "step" : undefined}
              className="flex items-center gap-2 rounded-(--radius-sm) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                  isCurrent && "bg-foreground text-background-darken",
                  isDone && "bg-background-elevated text-foreground",
                  !isCurrent && !isDone && "bg-background-darken text-fontcolor-secondary"
                )}
              >
                {isDone ? "✓" : index + 1}
              </span>
              <span
                className={cn(
                  "whitespace-nowrap transition-colors hover:text-fontcolor",
                  isCurrent ? "font-semibold text-fontcolor" : "text-fontcolor-secondary"
                )}
              >
                {step}
              </span>
            </button>
            {index < steps.length - 1 && (
              <span aria-hidden className="mx-1 h-px w-4 bg-border-strong" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
