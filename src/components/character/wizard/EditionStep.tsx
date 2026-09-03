import { Edition } from "@/interfaces/Edition";
import { Card, CardContent } from "@/components/ui";
import { cn } from "@/utils/cn";

type EditionStepProps = {
  edition: Edition | undefined;
  onSelect: (edition: Edition) => void;
};

const EDITIONS: { value: Edition; title: string; description: string }[] = [
  {
    value: "2014",
    title: "2014 Player's Handbook",
    description:
      "The original 5th Edition ruleset - races grant flat ability score bonuses, backgrounds grant a flavor feature.",
  },
  {
    value: "2024",
    title: "2024 Player's Handbook",
    description:
      "The revised (\"5.5e\") ruleset - species don't grant ability bonuses; your background does, and also grants an Origin feat. Weapon Mastery applies.",
  },
];

/**
 * First step of the manual wizard, matching the PHB's own recommendation
 * to settle this before anything else - which edition a character is built
 * under decides which pool of races/classes/backgrounds/feats every later
 * step pulls from (see data/index.ts's getRulesetAsync()).
 */
export function EditionStep({ edition, onSelect }: EditionStepProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {EDITIONS.map((option) => {
        const selected = edition === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelect(option.value)}
            className="text-left"
          >
            <Card
              className={cn(
                "h-full transition-colors",
                selected ? "border-foreground" : "hover:border-border-strong"
              )}
            >
              <CardContent className="flex flex-col gap-2">
                <span className="font-display text-lg tracking-wide text-fontcolor">
                  {option.title}
                </span>
                <p className="text-sm text-fontcolor-secondary">{option.description}</p>
              </CardContent>
            </Card>
          </button>
        );
      })}
    </div>
  );
}
