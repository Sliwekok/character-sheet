"use client";

import { useState } from "react";
import { Alert, Button } from "@/components/ui";
import { useAuth } from "@/components/auth/AuthProvider";
import type { StoredCharacter } from "@/interfaces/StoredCharacter";
import {
  CharacterSharing,
  characterShareUrl,
  copyToClipboard,
  getCharacterSharing,
  isSharingComplete,
} from "@/utils/campaigns";
import { SharingPicker } from "./SharingPicker";

/**
 * The character sheet's "Sharing" dialog (owner only): change who can see
 * the character and copy its read-only link. Saving goes through the
 * page's normal `saveCharacter` path, so the new setting syncs to the
 * server like any other edit.
 */
export function SharingDialog({
  character,
  onSave,
  onClose,
}: {
  character: StoredCharacter;
  onSave: (sharing: CharacterSharing) => void;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [sharing, setSharing] = useState<CharacterSharing>(() => getCharacterSharing(character));
  const [copied, setCopied] = useState<"ok" | "failed" | null>(null);
  const saved = getCharacterSharing(character);
  const dirty = saved.visibility !== sharing.visibility || saved.campaignId !== sharing.campaignId;
  const link = user && saved.visibility !== "private" ? characterShareUrl(user.id, character.id) : null;

  async function handleCopy() {
    if (!link) return;
    setCopied((await copyToClipboard(link)) ? "ok" : "failed");
  }

  return (
    <Alert
      modal
      variant="info"
      title="Share this character"
      onDismiss={onClose}
      actions={
        <>
          <Button
            size="sm"
            disabled={!dirty || !isSharingComplete(sharing)}
            onClick={() => {
              onSave(sharing);
              onClose();
            }}
          >
            Save
          </Button>
          <Button size="sm" variant="secondary" onClick={onClose}>
            {dirty ? "Cancel" : "Close"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <SharingPicker value={sharing} onChange={setSharing} stacked />

        {link && (
          <div className="flex flex-col gap-2 border-t border-border pt-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-foreground">Read-only link</span>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                readOnly
                value={link}
                onFocus={(event) => event.target.select()}
                aria-label="Read-only link to this character"
                className="min-w-0 flex-1 rounded-(--radius) border border-border-strong bg-background-darken px-3 py-2 text-xs text-fontcolor"
              />
              <Button size="sm" variant="secondary" onClick={handleCopy}>
                {copied === "ok" ? "Copied!" : "Copy link"}
              </Button>
            </div>
            {copied === "failed" && <p className="text-xs">Couldn&apos;t copy automatically - select the link and copy it by hand.</p>}
            <p className="text-xs">
              {saved.visibility === "public"
                ? "Anyone with this link can view the character."
                : "Only members of the campaign can open this link - everyone else sees “not found”."}{" "}
              Viewers always see your latest synced version and can&apos;t change anything.
            </p>
          </div>
        )}
        {dirty && sharing.visibility !== "private" && (
          <p className="text-xs">Save to get the link. It works as soon as the change has synced to your account.</p>
        )}
      </div>
    </Alert>
  );
}
