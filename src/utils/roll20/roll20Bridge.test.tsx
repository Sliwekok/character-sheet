import { describe, it, expect, vi, afterEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { BRIDGE_SOURCE, EXTENSION_SOURCE, useRoll20Sync } from "./roll20Bridge";
import { makeCharacter } from "../../../tests/fixtures/characters";
import { fallbackMechanics } from "@/utils/spellRolls";
import type { Character } from "@/interfaces/Characters";

type Posted = { source: string; type: string; payload: unknown; requestId?: string };

/** Captures what the page posts, and lets a fake extension answer it. */
function fakeWindowBridge(answer?: (message: Posted) => Record<string, unknown> | null) {
  const posted: Posted[] = [];
  const spy = vi.spyOn(window, "postMessage").mockImplementation((message: unknown) => {
    const data = message as Posted;
    if (data?.source !== BRIDGE_SOURCE) return;
    posted.push(data);
    const reply = answer?.(data);
    if (reply) {
      // Real replies come from the content script on the same window.
      setTimeout(() =>
        window.dispatchEvent(
          new MessageEvent("message", { data: { source: EXTENSION_SOURCE, requestId: data.requestId, ...reply }, source: window })
        )
      );
    }
  });
  return { posted, spy };
}

const character = (overrides: Partial<Character> = {}) => ({ ...makeCharacter(overrides), id: "c1" });

describe("useRoll20Sync", () => {
  afterEach(() => vi.useRealTimers());

  it("reports a missing extension instead of hanging", async () => {
    fakeWindowBridge();
    const { result } = renderHook(() => useRoll20Sync(character(), fallbackMechanics));
    await act(() => result.current.sync());
    expect(result.current.status).toBe("error");
    expect(result.current.message).toMatch(/isn't running on/i);
  });

  it("sends the full export and remembers the character as synced", async () => {
    const { posted } = fakeWindowBridge((message) => {
      if (message.type === "PING") return { type: "PONG", ok: true };
      if (message.type === "SYNC_CHARACTER") {
        return { type: "SYNC_RESULT", result: { ok: true, created: true, roll20CharacterId: "-R1", summary: "bio written" } };
      }
      return null;
    });
    const { result } = renderHook(() => useRoll20Sync(character(), fallbackMechanics));
    await act(() => result.current.sync());

    expect(result.current.status).toBe("synced");
    expect(result.current.message).toMatch(/Created in Roll20/);
    const sync = posted.find((message) => message.type === "SYNC_CHARACTER")!;
    expect(sync.payload).toMatchObject({ name: "Testy McTestface", sheetCharacterId: "c1", version: 1 });
    expect(JSON.parse(window.localStorage.getItem("characterSheet.roll20Synced")!)).toMatchObject({
      c1: { roll20CharacterId: "-R1" },
    });
  });

  it("streams HP changes only for synced characters, and only when HP actually changes", async () => {
    const { posted } = fakeWindowBridge();
    window.localStorage.setItem("characterSheet.roll20Synced", JSON.stringify({ c1: { syncedAt: "x", roll20CharacterId: "-R1" } }));

    const { rerender } = renderHook(({ c }) => useRoll20Sync(c, fallbackMechanics), {
      initialProps: { c: character({ currentHP: 10 }) },
    });
    expect(posted.filter((m) => m.type === "HP_UPDATE")).toHaveLength(0); // not on first load

    rerender({ c: character({ currentHP: 10, alignment: "Chaotic Good" }) }); // unrelated edit
    expect(posted.filter((m) => m.type === "HP_UPDATE")).toHaveLength(0);

    rerender({ c: character({ currentHP: 4 }) });
    await waitFor(() => expect(posted.filter((m) => m.type === "HP_UPDATE")).toHaveLength(1));
    expect(posted.find((m) => m.type === "HP_UPDATE")!.payload).toMatchObject({
      sheetCharacterId: "c1",
      current: 4,
      roll20CharacterId: "-R1",
    });
  });

  it("does not stream HP for a character that was never synced", () => {
    const { posted } = fakeWindowBridge();
    const { rerender } = renderHook(({ c }) => useRoll20Sync(c, fallbackMechanics), {
      initialProps: { c: character({ currentHP: 10 }) },
    });
    rerender({ c: character({ currentHP: 3 }) });
    expect(posted.filter((m) => m.type === "HP_UPDATE")).toHaveLength(0);
  });
});
