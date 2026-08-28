"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Nav from "../layout/nav";
import { Container, SectionHeading } from "@/components/ui";
import { CharacterCard, type CharacterSummary } from "@/components/character/CharacterCard";
import { loadCharacters } from "@/utils/storage";
import { toCharacterSummary } from "@/utils/characterSummary";

// Placeholder data shown only when there's nothing in storage yet, so a
// first-time visitor doesn't land on a blank page - shaped as
// CharacterSummary[] so it renders through the exact same CharacterCard as
// real, generator-produced characters.
const MOCK_CHARACTERS: CharacterSummary[] = [
  {
    id: "mock-1",
    name: "Name",
    level: 12,
    alignment: "Chaotic Evil",
    className: "Bard",
    armorClass: 18,
    initiative: 2,
    abilityModifiers: {
      strength: 2,
      dexterity: 2,
      constitution: 2,
      intelligence: 2,
      wisdom: 2,
      charisma: 2,
    },
  },
  {
    id: "mock-2",
    name: "Kael Stormblade",
    level: 5,
    alignment: "Lawful Good",
    className: "Fighter",
    armorClass: 17,
    initiative: 1,
    abilityModifiers: {
      strength: 3,
      dexterity: 1,
      constitution: 2,
      intelligence: 0,
      wisdom: 1,
      charisma: 0,
    },
  },
];

export default function HomePage() {
  // Storage is browser-only (see utils/storage.ts), so characters load in an
  // effect rather than during render - this avoids a server/client
  // hydration mismatch, same reasoning as the landing page's sketch shuffle.
  const [characters, setCharacters] = useState<CharacterSummary[] | null>(null);

  useEffect(() => {
    const stored = loadCharacters();
    setCharacters(stored.length > 0 ? stored.map(toCharacterSummary) : MOCK_CHARACTERS);
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
