"use client";

import { FormEvent, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Container,
  SectionHeading,
  TextInput,
  Textarea,
} from "@/components/ui";
import { FormMessage } from "@/components/auth/AuthForm";
import { useAuth } from "@/components/auth/AuthProvider";
import { useCampaigns } from "@/components/campaigns/useCampaigns";
import type { Campaign } from "@/interfaces/Campaign";
import {
  campaignInviteUrl,
  copyToClipboard,
  createCampaign,
  deleteCampaign,
  regenerateInvite,
  removeCampaignMember,
  updateCampaign,
} from "@/utils/campaigns";
import { CampaignsSkeleton } from "./CampaignsSkeleton";

const NAME_MAX = 80;
const DESCRIPTION_MAX = 1000;

function CreateCampaignCard({ onCreated }: { onCreated: (campaign: Campaign) => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return setError("Give the campaign a name.");
    setSubmitting(true);
    setError(null);
    try {
      onCreated(await createCampaign({ name: name.trim(), description: description.trim() }));
      setName("");
      setDescription("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>New campaign</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-sm" noValidate>
          {error && <FormMessage tone="error">{error}</FormMessage>}
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-foreground">Name</span>
            <TextInput
              value={name}
              maxLength={NAME_MAX}
              placeholder="e.g. Curse of Strahd - Thursday group"
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-foreground">Setting / notes (optional)</span>
            <Textarea
              value={description}
              maxLength={DESCRIPTION_MAX}
              rows={2}
              placeholder="Where and when the adventure takes place, house rules…"
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>
          <div>
            <Button type="submit" size="sm" disabled={submitting || !name.trim()}>
              {submitting ? "Creating…" : "Create campaign"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

type Confirm =
  | { kind: "delete" }
  | { kind: "leave" }
  | { kind: "regenerate" }
  | { kind: "remove"; memberId: string; memberName: string };

function CampaignCard({
  campaign,
  currentUserId,
  onUpdated,
  onRemoved,
}: {
  campaign: Campaign;
  currentUserId: string;
  onUpdated: (campaign: Campaign) => void;
  onRemoved: (campaignId: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(campaign.name);
  const [description, setDescription] = useState(campaign.description);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirm, setConfirm] = useState<Confirm | null>(null);

  const inviteUrl = campaign.inviteCode ? campaignInviteUrl(campaign.inviteCode) : null;

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  }

  async function handleCopy() {
    if (!inviteUrl) return;
    const ok = await copyToClipboard(inviteUrl);
    setCopied(ok);
    if (!ok) setError("Couldn't copy automatically - select the link and copy it by hand.");
    else window.setTimeout(() => setCopied(false), 2000);
  }

  function handleSave(event: FormEvent) {
    event.preventDefault();
    void run(async () => {
      onUpdated(await updateCampaign(campaign.id, { name: name.trim(), description: description.trim() }));
      setEditing(false);
    });
  }

  function handleConfirm() {
    if (!confirm) return;
    if (confirm.kind === "delete") {
      void run(async () => {
        await deleteCampaign(campaign.id);
        onRemoved(campaign.id);
      });
    } else if (confirm.kind === "leave") {
      void run(async () => {
        await removeCampaignMember(campaign.id, currentUserId);
        onRemoved(campaign.id);
      });
    } else if (confirm.kind === "regenerate") {
      void run(async () => onUpdated(await regenerateInvite(campaign.id)));
    } else {
      const { memberId } = confirm;
      void run(async () => {
        await removeCampaignMember(campaign.id, memberId);
        onUpdated({ ...campaign, members: campaign.members.filter((m) => m.id !== memberId) });
      });
    }
  }

  const confirmCopy: Record<Confirm["kind"], { title: string; body: string; action: string }> = {
    delete: {
      title: "Delete this campaign?",
      body: `"${campaign.name}" will be removed for every player. Their characters stay theirs, but will no longer be shared through it.`,
      action: "Yes, delete",
    },
    leave: {
      title: "Leave this campaign?",
      body: `You'll stop seeing the other players' characters, and yours will no longer be shown to them. You'll need a new invite link to rejoin.`,
      action: "Leave",
    },
    regenerate: {
      title: "Create a new invite link?",
      body: "The current link stops working immediately. Players who already joined stay in the campaign.",
      action: "New link",
    },
    remove: {
      title: "Remove this player?",
      body:
        confirm?.kind === "remove"
          ? `${confirm.memberName} will lose access to the campaign's characters, and theirs will no longer be shown here.`
          : "",
      action: "Remove",
    },
  };

  return (
    <Card>
      {confirm && (
        <Alert
          modal
          variant="confirm"
          title={confirmCopy[confirm.kind].title}
          actions={
            <>
              <Button variant="danger" size="sm" className="ml-0" disabled={busy} onClick={handleConfirm}>
                {confirmCopy[confirm.kind].action}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setConfirm(null)}>
                Cancel
              </Button>
            </>
          }
        >
          {confirmCopy[confirm.kind].body}
        </Alert>
      )}

      <CardHeader>
        <div className="min-w-0">
          <CardTitle className="break-words">{campaign.name}</CardTitle>
          <p className="mt-1 text-xs text-fontcolor-secondary">
            {campaign.isOwner ? "You run this campaign" : `Run by ${campaign.owner.displayName}`} · {campaign.members.length}{" "}
            player{campaign.members.length === 1 ? "" : "s"}
          </p>
        </div>
        {campaign.isOwner && <Badge variant="solid">GM</Badge>}
      </CardHeader>

      <CardContent className="flex flex-col gap-4 text-sm text-fontcolor-secondary">
        {error && <FormMessage tone="error">{error}</FormMessage>}

        {editing ? (
          <form onSubmit={handleSave} className="flex flex-col gap-3" noValidate>
            <TextInput value={name} maxLength={NAME_MAX} onChange={(event) => setName(event.target.value)} aria-label="Campaign name" />
            <Textarea
              value={description}
              maxLength={DESCRIPTION_MAX}
              rows={2}
              onChange={(event) => setDescription(event.target.value)}
              aria-label="Campaign setting / notes"
            />
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={busy || !name.trim()}>
                Save
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => {
                  setEditing(false);
                  setName(campaign.name);
                  setDescription(campaign.description);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          campaign.description && <p className="whitespace-pre-line">{campaign.description}</p>
        )}

        {inviteUrl && (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-foreground">Invite link</span>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                readOnly
                value={inviteUrl}
                onFocus={(event) => event.target.select()}
                aria-label="Invite link"
                className="min-w-0 flex-1 rounded-(--radius) border border-border-strong bg-background-darken px-3 py-2 text-xs text-fontcolor"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleCopy}>
                  {copied ? "Copied!" : "Copy link"}
                </Button>
                <Button size="sm" variant="secondary" disabled={busy} onClick={() => setConfirm({ kind: "regenerate" })}>
                  New link
                </Button>
              </div>
            </div>
            <p className="text-xs">
              Send this to your players. Anyone who opens it while signed in joins the campaign and can see characters
              shared with it.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-foreground">Players</span>
          <ul className="flex flex-col gap-1">
            {campaign.members.map((member) => (
              <li
                key={member.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-(--radius-sm) bg-background-darken/60 px-3 py-2"
              >
                <span className="flex items-center gap-2 text-fontcolor">
                  {member.displayName}
                  {member.id === campaign.owner.id && <Badge variant="muted">GM</Badge>}
                  {member.id === currentUserId && <Badge variant="muted">You</Badge>}
                </span>
                {campaign.isOwner && member.id !== currentUserId && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setConfirm({ kind: "remove", memberId: member.id, memberName: member.displayName })}
                    className="cursor-pointer text-xs text-fontcolor-secondary underline-offset-2 hover:text-fontcolor hover:underline"
                  >
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <Button size="sm" variant="secondary" href={`/home#campaign-${campaign.id}`}>
            View shared characters
          </Button>
          {campaign.isOwner ? (
            <>
              {!editing && (
                <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
                  Rename
                </Button>
              )}
              <Button size="sm" variant="danger" disabled={busy} onClick={() => setConfirm({ kind: "delete" })}>
                Delete campaign
              </Button>
            </>
          ) : (
            <Button size="sm" variant="danger" disabled={busy} onClick={() => setConfirm({ kind: "leave" })}>
              Leave campaign
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function CampaignsView() {
  const { status, user } = useAuth();
  const { campaigns, loading, error, setCampaigns } = useCampaigns();

  if (status === "loading" || (status === "authenticated" && loading)) return <CampaignsSkeleton />;

  if (status === "anonymous" || !user) {
    return (
      <Container size="md" className="pb-24">
        <SectionHeading eyebrow="Campaigns" title="Play together" />
        <Card className="mt-8">
          <CardContent className="flex flex-col items-start gap-4 text-sm text-fontcolor-secondary">
            <p>
              Campaigns let everyone at the table see each other&apos;s characters (read-only). They need an account, so
              the characters can be shared through the server.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button href="/login?next=/campaigns">Sign in</Button>
              <Button href="/register?next=/campaigns" variant="secondary">
                Create an account
              </Button>
            </div>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container size="lg" className="pb-24">
      <SectionHeading
        eyebrow="Play together"
        title="Campaigns"
        subtitle="Group the characters of one adventure. Invite players with a link; characters set to “Shared with campaign” show up for everyone in it, read-only."
      />

      <div className="mt-8 flex flex-col gap-6">
        {error && <FormMessage tone="error">Couldn&apos;t load your campaigns: {error}</FormMessage>}

        {campaigns.map((campaign) => (
          <CampaignCard
            key={campaign.id}
            campaign={campaign}
            currentUserId={user.id}
            onUpdated={(updated) => setCampaigns(campaigns.map((c) => (c.id === updated.id ? updated : c)))}
            onRemoved={(id) => setCampaigns(campaigns.filter((c) => c.id !== id))}
          />
        ))}

        {campaigns.length === 0 && !error && (
          <p className="text-sm text-fontcolor-secondary">
            You&apos;re not in any campaign yet. Create one below, or open an invite link from your GM.
          </p>
        )}

        <CreateCampaignCard onCreated={(campaign) => setCampaigns([...campaigns, campaign])} />
      </div>
    </Container>
  );
}
