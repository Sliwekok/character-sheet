"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { Container, SectionHeading } from "@/components/ui";
import { CharacterCard, CharacterSummary } from "@/components/character/CharacterCard";
import { CharacterCardSkeleton } from "@/components/character/CharacterCardSkeleton";
import { useAuth } from "@/components/auth/AuthProvider";
import { useStoredCharacters } from "@/components/auth/useStoredCharacter";
import { useSharedCharacters } from "@/components/campaigns/useCampaigns";
import { toCharacterSummary } from "@/utils/characterSummary";
import { getCharacterSharing } from "@/utils/campaigns";
import type { CampaignMember } from "@/interfaces/Campaign";

const SHARING_TAGS = { private: undefined, shared: "Shared", public: "Public" } as const;

export default function HomePage() {
  // Local first: characters come straight from localStorage (browser-only,
  // so read in an effect inside the hook - no hydration mismatch). Only
  // when this device has none and a signed-in player's characters are
  // still downloading does the list show skeleton cards instead - see
  // useStoredCharacters. Later changes (another device's edits arriving via
  // sync) update the list live.
  const { characters, loading } = useStoredCharacters();
  const { status } = useAuth();
  const summaries = useMemo(
    () =>
      characters?.map((character) => ({
        summary: toCharacterSummary(character),
        tag: status === "authenticated" ? SHARING_TAGS[getCharacterSharing(character).visibility] : undefined,
      })) ?? [],
    [characters, status]
  );

  // Other players' characters, one section per campaign, below the
  // player's own. Always fetched from the server (read-only, never stored
  // locally), so this part needs a connection and an account.
  const { groups, loading: sharedLoading, error: sharedError } = useSharedCharacters();
  const sharedSections = useMemo(
    () =>
      groups.map((group) => ({
        ...group,
        cards: group.characters.flatMap(({ owner, character }) => {
          // Someone else's saved data might be from an older/unknown shape -
          // skip a card rather than break the whole page.
          try {
            return [{ owner, summary: toCharacterSummary(character) }];
          } catch {
            return [] as { owner: CampaignMember; summary: CharacterSummary }[];
          }
        }),
      })),
    [groups]
  );

  // `/home#campaign-<id>` (from an invite or the Campaigns page): the
  // section only exists once the list has loaded, so scroll to it then.
  useEffect(() => {
    if (sharedLoading || typeof window === "undefined" || !window.location.hash.startsWith("#campaign-")) return;
    document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [sharedLoading]);

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
            to back them up, use them on other devices and share them with your campaign.
          </p>
        )}

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <CharacterCardSkeleton key={i} />)
            : summaries.map(({ summary, tag }) => <CharacterCard key={summary.id} character={summary} tag={tag} />)}

          <Link
            href="/newCharacter"
            className="flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-(--radius-lg) border-2 border-dashed border-border-strong text-fontcolor-secondary transition-colors hover:border-foreground hover:text-foreground"
          >
            <span className="text-3xl leading-none">+</span>
            <span className="font-medium">New character</span>
          </Link>
        </div>

        {status === "authenticated" && (
          <section className="mt-16 flex flex-col gap-10" aria-label="Characters shared with you">
            {sharedLoading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <CharacterCardSkeleton />
              </div>
            ) : sharedError ? (
              <p className="text-sm text-fontcolor-secondary">Couldn&apos;t load characters shared with you: {sharedError}</p>
            ) : sharedSections.length === 0 ? (
              <p className="text-sm text-fontcolor-secondary">
                Playing with friends?{" "}
                <Link href="/campaigns" className="text-foreground underline-offset-4 hover:underline">
                  Create a campaign
                </Link>{" "}
                and send your players the invite link - characters shared with it show up here for everyone.
              </p>
            ) : (
              sharedSections.map((section) => (
                <div key={section.campaignId} id={`campaign-${section.campaignId}`} className="scroll-mt-24">
                  <SectionHeading eyebrow="Campaign" title={section.campaignName} />
                  {section.cards.length === 0 ? (
                    <p className="mt-4 text-sm text-fontcolor-secondary">
                      Nobody else has shared a character with this campaign yet. Share yours from its sheet
                      (&quot;Sharing&quot;), and invite players from{" "}
                      <Link href="/campaigns" className="text-foreground underline-offset-4 hover:underline">
                        Campaigns
                      </Link>
                      .
                    </p>
                  ) : (
                    <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {section.cards.map(({ owner, summary }) => (
                        <CharacterCard
                          key={`${owner.id}:${summary.id}`}
                          character={summary}
                          ownerName={owner.displayName}
                          href={`/character/${encodeURIComponent(summary.id)}?owner=${owner.id}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </section>
        )}
      </Container>
    </>
  );
}
