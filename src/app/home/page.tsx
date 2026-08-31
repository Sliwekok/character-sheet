"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Nav from "../layout/nav";
import { Container, SectionHeading } from "@/components/ui";
import { CharacterCard, type CharacterSummary } from "@/components/character/CharacterCard";
import { loadCharacters } from "@/utils/storage";
import { toCharacterSummary } from "@/utils/characterSummary";

export default function HomePage() {
  // Storage is browser-only (see utils/storage.ts), so characters load in an
  // effect rather than during render - this avoids a server/client
  // hydration mismatch, same reasoning as the landing page's sketch shuffle.
  const [characters, setCharacters] = useState<CharacterSummary[] | null>(null);

  useEffect(() => {
    const stored = loadCharacters();
    setCharacters(stored.map(toCharacterSummary));
  }, []);

  return (
    <>
      <Nav />
      <Container size="xl" className="pb-24">
        <SectionHeading
          eyebrow="Your party"
          title="Characters"
          subtitle="Every sheet you've built, at a glance. Select one to keep editing, or start a new one."
        />

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {characters?.map((character) => (
            <CharacterCard key={character.id} character={character} />
          ))}

          <Link
            href="/newCharacter"
            className="flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-(--radius-lg) border-2 border-dashed border-border-strong text-fontcolor-secondary transition-colors hover:border-foreground hover:text-foreground"
          >
            <span className="text-3xl leading-none">+</span>
            <span className="font-medium">New character</span>
          </Link>
        </div>
      </Container>
    </>
  );
}
