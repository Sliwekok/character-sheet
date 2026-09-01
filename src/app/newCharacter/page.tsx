import Link from "next/link";
import Nav from "../layout/nav";
import { Card, CardContent, Container, SectionHeading } from "@/components/ui";

const MODES = [
  {
    href: "/newCharacter/manual",
    icon: "📜",
    title: "Step-by-step",
    description:
      "Build a character the recommended way: edition, race, class, ability scores, background, skills and equipment, then details - one step at a time, with a full review before you save.",
  },
  {
    href: "/newCharacter/random",
    icon: "🎲",
    title: "Random",
    description:
      "Let the dice decide. Generate a fully random character in one click, or lock in a few basics (name, level, race, class) and randomize the rest.",
  },
  {
    href: "/newCharacter/import",
    icon: "📥",
    title: "Import",
    description:
      "Load a character you previously exported as a JSON file - handy for moving one between browsers or devices, or restoring a backup.",
  },
];

export default function NewCharacterPage() {
  return (
    <>
      <Nav />
      <Container size="md" className="pb-24">
        <SectionHeading
          eyebrow="New character"
          title="Forge your next hero"
          subtitle="Choose how you'd like to build this character."
        />

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {MODES.map((mode) => (
            <Link key={mode.href} href={mode.href} className="block h-full">
              <Card className="flex h-full flex-col transition-colors hover:border-border-strong">
                <CardContent className="flex flex-1 flex-col gap-3">
                  <span className="text-3xl">{mode.icon}</span>
                  <h3 className="font-display text-xl tracking-wide text-fontcolor">{mode.title}</h3>
                  <p className="text-sm text-fontcolor-secondary">{mode.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </Container>
    </>
  );
}
