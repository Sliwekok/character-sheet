"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Card, CardContent, Container, SectionHeading, Skeleton, SkeletonHeading } from "@/components/ui";
import { FormMessage } from "@/components/auth/AuthForm";
import { useAuth } from "@/components/auth/AuthProvider";
import type { CampaignInvite } from "@/interfaces/Campaign";
import { fetchInvite, joinCampaign } from "@/utils/campaigns";

/**
 * Landing page of a campaign invite link (`/join/<code>`). Shows which
 * campaign it is, then joins on click - or, signed out, sends the player
 * through sign-in/registration and back here.
 */
export default function JoinCampaignView() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const { status } = useAuth();
  const [invite, setInvite] = useState<CampaignInvite | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    // Wait for auth, so `isMember` reflects the signed-in user.
    if (status === "loading") return;
    let cancelled = false;
    fetchInvite(code)
      .then((result) => !cancelled && setInvite(result))
      .catch((err) => !cancelled && setError((err as Error).message));
    return () => {
      cancelled = true;
    };
  }, [code, status]);

  async function handleJoin() {
    setJoining(true);
    setError(null);
    try {
      const campaign = await joinCampaign(code);
      router.push(`/home#campaign-${campaign.id}`);
    } catch (err) {
      setError((err as Error).message);
      setJoining(false);
    }
  }

  const next = encodeURIComponent(`/join/${code}`);

  if (!invite && !error) {
    return (
      <Container size="md" className="pb-24">
        <SkeletonHeading subtitleLines={0} />
        <Skeleton className="mt-8 h-48 w-full rounded-(--radius-lg)" />
      </Container>
    );
  }

  if (!invite) {
    return (
      <Container size="md" className="pb-24">
        <SectionHeading eyebrow="Campaign invite" title="Invite not found" />
        <Card className="mt-8">
          <CardContent className="flex flex-col items-start gap-4 text-sm text-fontcolor-secondary">
            <p>{error}</p>
            <p>Ask your GM for a fresh link - they can create a new one on their Campaigns page.</p>
            <Button href="/home">Back to characters</Button>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container size="md" className="pb-24">
      <SectionHeading eyebrow="Campaign invite" title={invite.name} subtitle={`Run by ${invite.ownerName}`} />
      <Card className="mt-8">
        <CardContent className="flex flex-col items-start gap-4 text-sm text-fontcolor-secondary">
          {error && <FormMessage tone="error">{error}</FormMessage>}
          {invite.description && <p className="whitespace-pre-line">{invite.description}</p>}
          <p>
            {invite.memberCount} player{invite.memberCount === 1 ? "" : "s"} so far. Members can view each other&apos;s
            characters that are shared with this campaign - read-only, nobody can change your character but you.
          </p>

          {status === "anonymous" ? (
            <>
              <p>Sign in or create a free account to join.</p>
              <div className="flex flex-wrap gap-3">
                <Button href={`/login?next=${next}`}>Sign in</Button>
                <Button href={`/register?next=${next}`} variant="secondary">
                  Create an account
                </Button>
              </div>
            </>
          ) : invite.isMember ? (
            <>
              <p className="text-fontcolor">You&apos;re already in this campaign.</p>
              <div className="flex flex-wrap gap-3">
                <Button href={`/home#campaign-${invite.campaignId}`}>See shared characters</Button>
                <Button href="/campaigns" variant="secondary">
                  Campaigns
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleJoin} disabled={joining}>
                {joining ? "Joining…" : "Join campaign"}
              </Button>
              <Button href="/home" variant="secondary">
                Not now
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
