import { Card, CardContent, Container, SectionHeading } from "@/components/ui";

export default function AboutPage() {
  return (
    <>
      <Container size="md" className="pb-24">
        <SectionHeading
          eyebrow="About"
          title="What is Character Sheet?"
          subtitle="A small, homebrewed tool for building and managing Dungeons & Dragons characters."
        />

        <Card className="mt-8">
          <CardContent className="flex flex-col gap-4 text-fontcolor-secondary">
            <p>
              Character Sheet is a work-in-progress app for putting a D&amp;D
              character together: pick a race and class, fill in ability
              scores, and get a sheet with the numbers - armor class, hit
              points, spell slots - worked out for you.
            </p>
            <p>
              It&apos;s an open, ongoing hobby project. The character
              creation flow is still being built; in the meantime you can
              browse the sample sheets on the{" "}
              <span className="text-fontcolor">Home</span> page.
            </p>
            <p>
              Source and progress live on{" "}
              <a
                href="https://github.com/Sliwekok/character-sheet"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline underline-offset-4 hover:text-foreground-hover"
              >
                GitHub
              </a>
              .
            </p>
          </CardContent>
        </Card>
      </Container>
    </>
  );
}
