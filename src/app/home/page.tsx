"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Container, SectionHeading } from "@/components/ui";
import { CharacterCard } from "@/components/character/CharacterCard";
import { CharacterCardSkeleton } from "@/components/character/CharacterCardSkeleton";
import { useAuth } from "@/components/auth/AuthProvider";
import { useStoredCharacters } from "@/components/auth/useStoredCharacter";
import { toCharacterSummary } from "@/utils/characterSummary";

export default function HomePage() {
  // Local first: characters come straight from localStorage (browser-only,
  // so read in an effect inside the hook - no hydration mismatch). Only
  // when this device has none and a signed-in player's characters are
  // still downloading does the list show skeleton cards instead - see
  // useStoredCharacters. Later changes (another device's edits arriving via
  // sync) update the list live.
  const { characters, loading } = useStoredCharacters();
  const { status } = useAuth();
  const summaries = useMemo(() => characters?.map(toCharacterSummary) ?? [], [characters]);

  return (
    <>
      <Container size="xl" className="pb-24">
        <SectionHeading
          eyebrow="Your party"
          title="Characters"
          subtitle="Every sheet you've built, at a glance. Select one to keep editing, or start a new one."
        />

        {status === "anonymous" && !loading && (
          <p className="mt-4 text-sm text-fontcolor-secondary">
            Your characters are saved in this browser.{" "}
            <Link href="/login?next=/home" className="text-foreground underline-offset-4 hover:underline">
              Sign in
            </Link>{" "}
            or{" "}
            <Link href="/register?next=/home" className="text-foreground underline-offset-4 hover:underline">
              create an account
            </Link>{" "}
            to back them up and use them on other devices.
          </p>
        )}

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <CharacterCardSkeleton key={i} />)
            : summaries.map((character) => <CharacterCard key={character.id} character={character} />)}

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
