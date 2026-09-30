"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Character } from "@/interfaces/Characters";
import { Spell, SpellMechanics } from "@/interfaces/Spell";
import { Roll20Export, buildRoll20Export, buildRoll20HpUpdate } from "@/utils/roll20/roll20Export";

/**
 * Messages this page sends to the "Character Sheet -> Roll20" browser
 * extension carry this `source` (the same one `recordRoll` already uses for
 * ROLL messages). The extension's replies carry `EXTENSION_SOURCE`. Both are
 * plain `window.postMessage`s on this page - the extension's content script
 * runs in an isolated world and can only be reached that way.
 */
export const BRIDGE_SOURCE = "dnd-character-sheet-roll20-bridge";
export const EXTENSION_SOURCE = "dnd-character-sheet-roll20-extension";

/** localStorage key: which characters have been synced to Roll20 from this browser (so HP keeps streaming after a reload). */
const SYNCED_KEY = "characterSheet.roll20Synced";

/** How long to wait for the extension to answer a sync before calling it failed. Creating a big character in Roll20 can take a few seconds. */
const SYNC_TIMEOUT_MS = 30_000;
const PING_TIMEOUT_MS = 1_500;

export interface Roll20SyncRecord {
  syncedAt: string;
  roll20CharacterId?: string;
  roll20Name?: string;
}

function readSynced(): Record<string, Roll20SyncRecord> {
  try {
    const raw = window.localStorage.getItem(SYNCED_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeSynced(id: string, record: Roll20SyncRecord | null) {
  try {
    const all = readSynced();
    if (record) all[id] = record;
    else delete all[id];
    window.localStorage.setItem(SYNCED_KEY, JSON.stringify(all));
  } catch {
    // Private mode / storage disabled - HP streaming just won't survive a reload.
  }
}

function newRequestId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function post(type: string, payload: unknown, requestId?: string) {
  window.postMessage({ source: BRIDGE_SOURCE, type, payload, requestId }, window.location.origin);
}

/** Resolves with the extension's reply to `requestId`, or `null` after `timeoutMs`. */
function waitForReply<T>(requestId: string, timeoutMs: number): Promise<T | null> {
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      window.removeEventListener("message", onMessage);
      resolve(null);
    }, timeoutMs);
    function onMessage(event: MessageEvent) {
      if (event.source !== window) return;
      const data = event.data;
      if (!data || data.source !== EXTENSION_SOURCE || data.requestId !== requestId) return;
      window.clearTimeout(timer);
      window.removeEventListener("message", onMessage);
      resolve(data as T);
    }
    window.addEventListener("message", onMessage);
  });
}

export type Roll20SyncStatus = "idle" | "syncing" | "synced" | "error";

export interface Roll20SyncResult {
  ok: boolean;
  error?: string;
  created?: boolean;
  roll20CharacterId?: string;
  roll20Name?: string;
  /** Short human summary from the extension, e.g. "Updated 212 fields, 6 attacks, 14 spells". */
  summary?: string;
  warnings?: string[];
}

export interface Roll20SyncState {
  status: Roll20SyncStatus;
  /** Last result/error line to show under the button. */
  message?: string;
  warnings: string[];
  /** Set once this character has synced from this browser - HP changes stream while it is. */
  record: Roll20SyncRecord | null;
  sync: () => Promise<void>;
  /** Stop streaming HP for this character (the Roll20 copy is left as is). */
  unlink: () => void;
}

/**
 * The "Sync with Roll20" button's logic plus live HP streaming.
 *
 * - `sync()` builds the full export (see roll20Export.ts) and hands it to
 *   the extension, which creates the Roll20 character or updates the one it
 *   made last time (matched by name if it has no record of one).
 * - After the first successful sync, every change to current or max HP is
 *   pushed automatically as a small HP_UPDATE message - including after a
 *   page reload, since the "synced" flag lives in localStorage. Nothing else
 *   streams: stats, spells etc. only go over when the button is pressed.
 *
 * With the extension not installed, `sync()` times out into an error
 * message and HP updates are silent no-ops.
 */
export function useRoll20Sync(
  character: (Character & { id: string }) | null | undefined,
  resolveSpellMechanics: (spell: Spell) => SpellMechanics
): Roll20SyncState {
  const id = character?.id;
  const [status, setStatus] = useState<Roll20SyncStatus>("idle");
  const [message, setMessage] = useState<string | undefined>();
  const [warnings, setWarnings] = useState<string[]>([]);
  const [record, setRecord] = useState<Roll20SyncRecord | null>(null);

  useEffect(() => {
    if (!id) return;
    setRecord(readSynced()[id] ?? null);
  }, [id]);

  // Kept in a ref so `sync` always exports the latest character without being re-created on every edit.
  const latest = useRef({ character, resolveSpellMechanics });
  latest.current = { character, resolveSpellMechanics };

  const sync = useCallback(async () => {
    const current = latest.current.character;
    if (!current) return;
    setStatus("syncing");
    setMessage(undefined);
    setWarnings([]);

    const pingId = newRequestId();
    post("PING", null, pingId);
    const pong = await waitForReply<{ ok: boolean; version?: string }>(pingId, PING_TIMEOUT_MS);
    if (!pong) {
      setStatus("error");
      const bridgeVersion = document.documentElement.dataset.csRoll20Bridge;
      setMessage(
        bridgeVersion
          ? `The Roll20 extension (v${bridgeVersion}) is on this page but didn't answer - reload the extension in chrome://extensions, then refresh this page.`
          : `The Roll20 extension isn't running on ${window.location.host}. In chrome://extensions, check that "Character Sheet → Roll20" is loaded from the character-sheet-extension-roll20 folder (not an older copy) and that this address is in its manifest.json bridge-content.js "matches", then reload it and refresh this page.`
      );
      return;
    }

    let payload: Roll20Export;
    try {
      payload = buildRoll20Export(current, latest.current.resolveSpellMechanics);
    } catch (error) {
      setStatus("error");
      setMessage(`Couldn't prepare the export: ${error instanceof Error ? error.message : String(error)}`);
      return;
    }

    const requestId = newRequestId();
    post("SYNC_CHARACTER", payload, requestId);
    const reply = await waitForReply<{ result?: Roll20SyncResult }>(requestId, SYNC_TIMEOUT_MS);
    const result = reply?.result;
    if (!result) {
      setStatus("error");
      setMessage("Roll20 didn't answer in time - is your game open in another tab?");
      return;
    }
    if (!result.ok) {
      setStatus("error");
      setMessage(result.error ?? "Sync failed.");
      setWarnings(result.warnings ?? []);
      return;
    }

    const nextRecord: Roll20SyncRecord = {
      syncedAt: new Date().toISOString(),
      roll20CharacterId: result.roll20CharacterId,
      roll20Name: result.roll20Name ?? current.name,
    };
    writeSynced(current.id, nextRecord);
    setRecord(nextRecord);
    setStatus("synced");
    setMessage(`${result.created ? "Created" : "Updated"} in Roll20${result.summary ? ` - ${result.summary}` : ""}.`);
    setWarnings(result.warnings ?? []);
  }, []);

  const unlink = useCallback(() => {
    if (!id) return;
    writeSynced(id, null);
    setRecord(null);
    setStatus("idle");
    setMessage("HP streaming stopped for this character.");
  }, [id]);

  // Live HP stream. Runs on every character edit but only posts when current
  // or max HP actually changed (never on first load), and only for
  // characters synced at least once from this browser.
  const lastHpKey = useRef<string | null>(null);
  useEffect(() => {
    if (!character) return;
    const update = buildRoll20HpUpdate(character);
    const key = `${character.id}:${update.current}/${update.max}`;
    const previous = lastHpKey.current;
    lastHpKey.current = key;
    if (previous === null || previous === key || !previous.startsWith(`${character.id}:`)) return;
    const synced = readSynced()[character.id];
    if (!synced) return;
    post("HP_UPDATE", { ...update, roll20CharacterId: synced.roll20CharacterId });
  }, [character]);

  return { status, message, warnings, record, sync, unlink };
}
