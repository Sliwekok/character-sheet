import { describe, it, expect, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { ROLL_VISIBILITY_KEY, useRoll20RollVisibility } from "./roll20RollVisibility";

describe("useRoll20RollVisibility", () => {
  beforeEach(() => window.localStorage.clear());

  it("defaults to public", () => {
    const { result } = renderHook(() => useRoll20RollVisibility());
    expect(result.current[0]).toBe("public");
  });

  it("restores a saved GM-only choice", () => {
    window.localStorage.setItem(ROLL_VISIBILITY_KEY, "gm");
    const { result } = renderHook(() => useRoll20RollVisibility());
    expect(result.current[0]).toBe("gm");
  });

  it("saves changes and ignores junk values", () => {
    const { result } = renderHook(() => useRoll20RollVisibility());
    act(() => result.current[1]("gm"));
    expect(result.current[0]).toBe("gm");
    expect(window.localStorage.getItem(ROLL_VISIBILITY_KEY)).toBe("gm");

    window.localStorage.setItem(ROLL_VISIBILITY_KEY, "everyone");
    const { result: reread } = renderHook(() => useRoll20RollVisibility());
    expect(reread.current[0]).toBe("public");
  });
});
