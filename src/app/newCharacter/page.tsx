import Nav from "../layout/nav";
import { Button, Card, CardContent, Container, SectionHeading } from "@/components/ui";

export default function NewCharacterPage() {
  return (
    <>
      <Nav />
      <Container size="md" className="pb-24">
        <SectionHeading
          eyebrow="New character"
          title="Forge your next hero"
          subtitle="The guided creation flow - race, class, ability scores, and a random-roll option - isn't built yet."
        />

        <Card className="mt-8">
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center text-fontcolor-secondary">
            <span className="text-4xl">🎲</span>
            <p className="max-w-sm">
              This is where you&apos;ll build a character from scratch or
              roll up a random one. Check back soon.
            </p>
            <Button href="/home" variant="secondary">
              Back to characters
            </Button>
          </CardContent>
        </Card>
      </Container>
    </>
  );
}
