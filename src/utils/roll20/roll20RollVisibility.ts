"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Who sees a roll forwarded into Roll20 chat by the "Character Sheet ->
 * Roll20" extension: "public" posts it to everyone, "gm" sends it as a
 * `/w gm` whisper (the GM and the roller only). Sent along with every ROLL
 * message from `recordRoll`; the extension does the actual formatting.
 */
export type Roll20RollVisibility = "public" | "gm";

/** localStorage key - a per-browser table preference, not character data, so it's shared by every character opened here. */
export const ROLL_VISIBILITY_KEY = "characterSheet.roll20RollVisibility";

function readVisibility(): Roll20RollVisibility {
  try {
    return window.localStorage.getItem(ROLL_VISIBILITY_KEY) === "gm" ? "gm" : "public";
  } catch {
    return "public";
  }
}

/**
 * The Public / GM only toggle's state. Starts "public" and reads the saved
 * choice after mount (so server and first client render match); follows
 * changes made in other tabs too.
 */
export function useRoll20RollVisibility(): [Roll20RollVisibility, (next: Roll20RollVisibility) => void] {
  const [visibility, setVisibilityState] = useState<Roll20RollVisibility>("public");

  useEffect(() => {
    setVisibilityState(readVisibility());
    function onStorage(event: StorageEvent) {
      if (event.key === ROLL_VISIBILITY_KEY) setVisibilityState(readVisibility());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setVisibility = useCallback((next: Roll20RollVisibility) => {
    setVisibilityState(next);
    try {
      window.localStorage.setItem(ROLL_VISIBILITY_KEY, next);
    } catch {
      // Storage unavailable (private mode etc.) - the choice just won't survive a reload.
    }
  }, []);

  return [visibility, setVisibility];
}
