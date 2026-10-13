import Link from "next/link";
import { Badge, Card, Container, SectionHeading } from "@/components/ui";
import { cn } from "@/utils/cn";
import { MODE_CARD_CLASSES, MODE_GRID_CLASSES } from "./modeCardClasses";

type Mode = {
  href: string;
  icon: string;
  title: string;
  tagline: string;
  description: string;
  highlights: string[];
  cta: string;
  recommended?: boolean;
};

const MODES: Mode[] = [
  {
    href: "/newCharacter/import",
    icon: "📥",
    title: "Import",
    tagline: "Bring an existing hero",
    description:
      "Load a character you previously exported as a JSON file, or pull one straight from D&D Beyond by id or link.",
    highlights: ["JSON export from this app", "D&D Beyond id or link"],
    cta: "Import character",
  },
  {
    href: "/newCharacter/manual",
    icon: "📜",
    title: "Step-by-step",
    tagline: "Full control, guided",
    description:
      "Build a character the recommended way: edition, race, class, ability scores, background, skills and equipment, then details - one step at a time.",
    highlights: ["Every choice explained", "Full review before you save"],
    cta: "Start building",
    recommended: true,
  },
  {
    href: "/newCharacter/random",
    icon: "🎲",
    title: "Random",
    tagline: "Let the dice decide",
    description:
      "Generate a fully random character in one click, or lock in a few basics (name, level, race, class) and randomize the rest.",
    highlights: ["Ready in one click", "Lock what you care about"],
    cta: "Roll a hero",
  },
];

function ModeCard({ mode }: { mode: Mode }) {
  return (
    <Link
      href={mode.href}
      className="group block h-full rounded-(--radius-lg) focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
    >
      <Card
        className={cn(
          MODE_CARD_CLASSES,
          "transition-all duration-300 ease-out motion-safe:group-hover:-translate-y-1",
          "group-hover:border-foreground/60 group-hover:shadow-[0_24px_50px_-20px_rgba(231,139,72,0.45)]",
          mode.recommended && "border-foreground/45"
        )}
      >
        {/* gold accent rule along the top edge - always on for the recommended card, on hover for the rest */}
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 h-1 bg-linear-to-r from-transparent via-foreground to-transparent transition-opacity duration-300",
            mode.recommended ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}
        />

        <div className="flex items-start justify-between gap-3">
          <span
            aria-hidden
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-border-strong bg-background-darken/70 text-3xl shadow-inner transition-transform duration-300 motion-safe:group-hover:scale-110"
          >
            {mode.icon}
          </span>
          {mode.recommended && <Badge variant="solid">Recommended</Badge>}
        </div>

        <div className="flex flex-col gap-1">
          <h2 className="font-display text-2xl tracking-wide text-fontcolor">{mode.title}</h2>
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground">
            {mode.tagline}
          </span>
        </div>

        {/* flex-1 absorbs the difference in description length so the lists and CTAs line up across cards */}
        <p className="flex-1 text-sm leading-relaxed text-fontcolor-secondary">{mode.description}</p>

        <ul className="flex flex-col gap-2 border-t border-border pt-4">
          {mode.highlights.map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm text-fontcolor">
              <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
              {item}
            </li>
          ))}
        </ul>

        <span
          className={cn(
            "inline-flex h-11 items-center justify-center gap-2 rounded-(--radius-lg) text-base font-medium transition-colors duration-200",
            mode.recommended
              ? "bg-foreground text-background-darken group-hover:bg-foreground-hover"
              : "border border-border-strong text-fontcolor group-hover:border-foreground group-hover:text-foreground"
          )}
        >
          {mode.cta}
          <span aria-hidden className="transition-transform duration-200 motion-safe:group-hover:translate-x-1">
            →
          </span>
        </span>
      </Card>
    </Link>
  );
}

export default function NewCharacterPage() {
  return (
    <Container size="lg" className="pb-24">
      <SectionHeading
        align="center"
        eyebrow="New character"
        title="Forge your next hero"
        subtitle="Choose how you'd like to build this character. You can edit everything on the sheet afterwards."
      />

      <div className={MODE_GRID_CLASSES}>
        {MODES.map((mode) => (
          <ModeCard key={mode.href} mode={mode} />
        ))}
      </div>
    </Container>
  );
}
