"use client";

import { Button, Tooltip } from "@/components/ui";
import { Roll20SyncState } from "@/utils/roll20/roll20Bridge";

/**
 * Header button that pushes the whole character into Roll20 through the
 * "Character Sheet -> Roll20" browser extension (see utils/roll20/). Once a
 * character has synced from this browser its HP keeps streaming on its own;
 * the tooltip says so and offers to stop it.
 */
export function Roll20SyncButton({ state }: { state: Roll20SyncState }) {
  const { status, record, sync, unlink } = state;
  const syncing = status === "syncing";
  return (
    <span className="flex items-center gap-1">
      <Button size="sm" variant="secondary" onClick={() => void sync()} disabled={syncing}>
        {syncing ? "Syncing…" : "Sync with Roll20"}
      </Button>
      <Tooltip title="Sync with Roll20">
        <p>
          Sends everything on this sheet - abilities, saves, skills, HP, AC, attacks, spells and slots, features,
          inventory, currency and background - to the Roll20 game open in another tab. The first sync creates the
          character there; later syncs update it.
        </p>
        <p className="mt-2">
          {record
            ? `Synced ${new Date(record.syncedAt).toLocaleString()}. HP changes on this sheet now stream to Roll20 automatically.`
            : "After the first sync, HP changes stream to Roll20 automatically."}
        </p>
        {record && (
          <button type="button" className="mt-2 text-xs underline" onClick={unlink}>
            Stop streaming HP for this character
          </button>
        )}
      </Tooltip>
    </span>
  );
}

/** Result line shown under the header stat bar after a sync attempt. */
export function Roll20SyncMessage({ state }: { state: Roll20SyncState }) {
  if (!state.message && state.warnings.length === 0) return null;
  const isError = state.status === "error";
  return (
    <div className={`w-full text-xs ${isError ? "text-fontcolor-danger" : "text-fontcolor-secondary"}`}>
      {state.message && <p>Roll20: {state.message}</p>}
      {state.warnings.length > 0 && (
        <ul className="mt-1 list-disc pl-5">
          {state.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
