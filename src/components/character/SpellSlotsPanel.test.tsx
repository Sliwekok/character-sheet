import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SpellSlotsPanel } from "./SpellSlotsPanel";

const PACT = "Pact Magic slots (recharge on a Short rest)";

function pips(pool: string, level: string) {
  return screen.getAllByRole("button", { name: new RegExp(`^${escapeRe(pool)} ${level} slot \\d+ - `) });
}
function escapeRe(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
const isAvailable = (pip: HTMLElement) => /available, click to spend$/.test(pip.getAttribute("aria-label") ?? "");

function setup(props: Partial<React.ComponentProps<typeof SpellSlotsPanel>> = {}) {
  const onAdjust = vi.fn();
  const user = userEvent.setup();
  const view = render(
    <SpellSlotsPanel spellSlots={{ 1: 4, 2: 3 }} pactMagicSlots={null} onAdjust={onAdjust} {...props} />
  );
  return { user, onAdjust, ...view };
}

describe("SpellSlotsPanel", () => {
  it("renders one pip per slot at each level, all available when nothing is spent", () => {
    setup();
    expect(screen.getByText("Spell slots")).toBeInTheDocument();
    expect(pips("Spell slots", "1st level")).toHaveLength(4);
    expect(pips("Spell slots", "2nd level")).toHaveLength(3);
    expect(pips("Spell slots", "1st level").every(isAvailable)).toBe(true);
    expect(screen.getByText("4/4")).toBeInTheDocument();
    expect(screen.getByText("3/3")).toBeInTheDocument();
  });

  it("fills pips left to right: expended slots show as spent pips at the right-hand end", () => {
    setup({ expendedSpellSlots: { 1: 3, 2: 1 } });
    expect(pips("Spell slots", "1st level").map(isAvailable)).toEqual([true, false, false, false]);
    expect(pips("Spell slots", "2nd level").map(isAvailable)).toEqual([true, true, false]);
    expect(screen.getByText("1/4")).toBeInTheDocument();
    expect(screen.getByText("2/3")).toBeInTheDocument();
  });

  it("never shows a negative count when more are expended than the level has", () => {
    setup({ spellSlots: { 1: 2 }, expendedSpellSlots: { 1: 5 } });
    expect(pips("Spell slots", "1st level").some(isAvailable)).toBe(false);
    expect(screen.getByText("0/2")).toBeInTheDocument();
  });

  it("clicking an available pip spends one slot of that level", async () => {
    const { user, onAdjust } = setup({ expendedSpellSlots: { 2: 1 } });
    await user.click(screen.getByRole("button", { name: /^Spell slots 2nd level slot 1 - available/ }));
    expect(onAdjust).toHaveBeenCalledExactlyOnceWith("spell", 2, 1);
  });

  it("clicking a spent pip restores one slot of that level", async () => {
    const { user, onAdjust } = setup({ expendedSpellSlots: { 1: 2 } });
    await user.click(screen.getByRole("button", { name: /^Spell slots 1st level slot 4 - spent/ }));
    expect(onAdjust).toHaveBeenCalledExactlyOnceWith("spell", 1, -1);
  });

  it("any spent pip restores (not only the edge one) - slots are just a count", async () => {
    const { user, onAdjust } = setup({ expendedSpellSlots: { 1: 3 } });
    await user.click(screen.getByRole("button", { name: /^Spell slots 1st level slot 2 - spent/ }));
    expect(onAdjust).toHaveBeenCalledExactlyOnceWith("spell", 1, -1);
  });

  it("reflects new expended counts when the parent re-renders", () => {
    const { rerender, onAdjust } = setup({ spellSlots: { 1: 2 } });
    expect(screen.getByText("2/2")).toBeInTheDocument();
    rerender(<SpellSlotsPanel spellSlots={{ 1: 2 }} pactMagicSlots={null} expendedSpellSlots={{ 1: 1 }} onAdjust={onAdjust} />);
    expect(screen.getByText("1/2")).toBeInTheDocument();
  });

  it("lists levels in ascending order and skips levels with no slots", () => {
    setup({ spellSlots: { 3: 2, 1: 4, 2: 0 } });
    expect(screen.queryByRole("button", { name: /2nd level/ })).not.toBeInTheDocument();
    const labels = screen.getAllByText(/^\d(st|nd|rd|th) level$/).map((el) => el.textContent);
    expect(labels).toEqual(["1st level", "3rd level"]);
  });

  it("shows Pact Magic as a separate pool and reports it as 'pact'", async () => {
    const { user, onAdjust } = setup({
      spellSlots: null,
      pactMagicSlots: { 3: 2 },
      expendedPactSlots: { 3: 1 },
    });
    expect(screen.queryByText("Spell slots")).not.toBeInTheDocument();
    expect(screen.getByText(PACT)).toBeInTheDocument();
    expect(pips(PACT, "3rd level").map(isAvailable)).toEqual([true, false]);

    await user.click(pips(PACT, "3rd level")[0]);
    expect(onAdjust).toHaveBeenLastCalledWith("pact", 3, 1);
    await user.click(pips(PACT, "3rd level")[1]);
    expect(onAdjust).toHaveBeenLastCalledWith("pact", 3, -1);
  });

  it("keeps spell and pact expended counts separate for a multiclass caster", () => {
    setup({
      spellSlots: { 1: 2 },
      pactMagicSlots: { 1: 1 },
      expendedSpellSlots: { 1: 2 },
      expendedPactSlots: {},
    });
    expect(pips("Spell slots", "1st level").some(isAvailable)).toBe(false);
    expect(pips(PACT, "1st level").every(isAvailable)).toBe(true);
  });

  it("renders nothing interactive for a non-caster", () => {
    setup({ spellSlots: null, pactMagicSlots: null });
    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(screen.queryByText("Spell slots")).not.toBeInTheDocument();
  });
});
