import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AbilityScoresPanel } from "./AbilityScoresPanel";
import { Fighter } from "@/data/2024/classes/Fighter";
import { classLevel, makeCharacter } from "../../../tests/fixtures/characters";

// STR 16 (+3), DEX 9 (-1), CON 14 (+2), INT 10 (+0), WIS 12 (+1), CHA 7 (-2)
const scores = { strength: 16, dexterity: 9, constitution: 14, intelligence: 10, wisdom: 12, charisma: 7 };
const expected = [
  { label: "STR", key: "strength", score: 16, mod: "+3" },
  { label: "DEX", key: "dexterity", score: 9, mod: "-1" },
  { label: "CON", key: "constitution", score: 14, mod: "+2" },
  { label: "INT", key: "intelligence", score: 10, mod: "+0" },
  { label: "WIS", key: "wisdom", score: 12, mod: "+1" },
  { label: "CHA", key: "charisma", score: 7, mod: "-2" },
] as const;

/** The tile for one ability, found through its (accessible) breakdown tooltip button. */
function tile(label: string, score: number): HTMLElement {
  return screen.getByRole("button", { name: `About ${label} (score ${score})` }).closest("div")!;
}

function setup(overrides: Parameters<typeof makeCharacter>[0] = {}) {
  const onRoll = vi.fn();
  const user = userEvent.setup();
  // Fixture default: proficient in Strength and Constitution saves.
  render(<AbilityScoresPanel character={makeCharacter({ abilityScores: scores, ...overrides })} onRoll={onRoll} />);
  return { user, onRoll };
}

describe("AbilityScoresPanel", () => {
  it("shows every ability's abbreviation, modifier and score", () => {
    setup();
    expect(screen.getByRole("heading", { name: "Ability Scores" })).toBeInTheDocument();
    for (const { label, score, mod } of expected) {
      const t = tile(label, score);
      expect(within(t).getByText(label)).toBeInTheDocument();
      expect(within(t).getByText(mod)).toBeInTheDocument();
      expect(within(t).getByText(String(score))).toBeInTheDocument();
    }
  });

  it("the tooltip breaks a score down into base, final and modifier", async () => {
    const { user } = setup();
    await user.hover(screen.getByRole("button", { name: "About STR (score 16)" }));
    const tooltip = await screen.findByRole("tooltip");
    expect(tooltip).toHaveTextContent("STR (score 16)");
    expect(tooltip).toHaveTextContent("Base score16");
    expect(tooltip).toHaveTextContent("Final score16");
    expect(tooltip).toHaveTextContent("Modifier+3");
  });

  it("the tooltip lists background bonuses when there are any", async () => {
    const { user } = setup({ backgroundAbilityBonuses: { strength: 2 } });
    await user.hover(screen.getByRole("button", { name: "About STR (score 16)" }));
    const tooltip = await screen.findByRole("tooltip");
    expect(tooltip).toHaveTextContent("Base score14");
    expect(tooltip).toHaveTextContent("Soldier bonus+2");
  });

  it("save buttons add the proficiency bonus only for proficient saves", () => {
    setup();
    expect(within(tile("STR", 16)).getByRole("button", { name: "Save +5" })).toHaveAttribute("title", "Proficient saving throw");
    expect(within(tile("CON", 14)).getByRole("button", { name: "Save +4" })).toBeInTheDocument();
    expect(within(tile("DEX", 9)).getByRole("button", { name: "Save -1" })).toHaveAttribute("title", "Saving throw");
    expect(within(tile("CHA", 7)).getByRole("button", { name: "Save -2" })).toBeInTheDocument();
  });

  it("the save proficiency bonus scales with level", () => {
    setup({ classes: [classLevel(Fighter, 9)] }); // PB +4
    expect(within(tile("STR", 16)).getByRole("button", { name: "Save +7" })).toBeInTheDocument();
  });

  it("clicking a tile rolls an ability check: d20 + the modifier, no proficiency", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.7); // d20 -> 15
    const { user, onRoll } = setup();

    await user.click(within(tile("STR", 16)).getByText("STR"));

    expect(onRoll).toHaveBeenCalledExactlyOnceWith("strength check", {
      formula: "1d20",
      rolls: [15],
      diceTotal: 15,
      modifier: 3,
      total: 18,
    });
    expect(within(tile("STR", 16)).getByText("15 + 3 = 18")).toBeInTheDocument();
  });

  it("a negative modifier is subtracted in the check result", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5); // d20 -> 11
    const { user, onRoll } = setup();
    await user.click(within(tile("CHA", 7)).getByText("CHA"));
    expect(onRoll).toHaveBeenCalledWith("charisma check", expect.objectContaining({ modifier: -2, total: 9 }));
    expect(within(tile("CHA", 7)).getByText("11 - 2 = 9")).toBeInTheDocument();
  });

  it("the Save button rolls a saving throw only (not also an ability check)", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.45); // d20 -> 10
    const { user, onRoll } = setup();

    await user.click(within(tile("STR", 16)).getByRole("button", { name: "Save +5" }));

    expect(onRoll).toHaveBeenCalledExactlyOnceWith("strength save", {
      formula: "1d20",
      rolls: [10],
      diceTotal: 10,
      modifier: 5,
      total: 15,
    });
    expect(within(tile("STR", 16)).getByText("10 + 5 = 15")).toBeInTheDocument();
  });

  it("check and save results are shown separately per ability", async () => {
    const random = vi.spyOn(Math, "random");
    const { user } = setup();

    random.mockReturnValue(0.95); // 20
    await user.click(within(tile("DEX", 9)).getByText("DEX"));
    random.mockReturnValue(0); // 1
    await user.click(within(tile("DEX", 9)).getByRole("button", { name: "Save -1" }));

    expect(within(tile("DEX", 9)).getByText("20 - 1 = 19")).toBeInTheDocument();
    expect(within(tile("DEX", 9)).getByText("1 - 1 = 0")).toBeInTheDocument();
    expect(within(tile("STR", 16)).queryByText(/=/)).not.toBeInTheDocument();
  });

  it.todo(
    "BUG: clicking a tile's breakdown (i) tooltip button also rolls an ability check - the click bubbles to the tile's onClick (only the Save button stops propagation)"
  );
});
