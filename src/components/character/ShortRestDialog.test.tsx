import { useState } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ShortRestDialog } from "./ShortRestDialog";
import { getHitDicePools, spendHitDice, type HitDicePool } from "@/utils/hitDice";
import type { Character } from "@/interfaces/Characters";
import { Wizard } from "@/data/2024/classes/Wizard";
import { Fighter } from "@/data/2024/classes/Fighter";
import { classLevel, makeCharacter } from "../../../tests/fixtures/characters";

const pool = (hitDie: number, total: number, expended = 0): HitDicePool => ({
  hitDie,
  total,
  expended,
  remaining: total - expended,
});

function setup(props: Partial<React.ComponentProps<typeof ShortRestDialog>> = {}) {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  const user = userEvent.setup();
  render(
    <ShortRestDialog
      pools={[pool(10, 3)]}
      conModifier={2}
      currentHp={12}
      maxHp={30}
      hasPactSlots={false}
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...props}
    />
  );
  return { user, onConfirm, onCancel, dialog: screen.getByRole("dialog") };
}

const more = (die: number) => screen.getByRole("button", { name: `Spend one more d${die}` });
const fewer = (die: number) => screen.getByRole("button", { name: `Spend one fewer d${die}` });

describe("ShortRestDialog", () => {
  it("renders as a modal dialog explaining current HP and the Con bonus per die", () => {
    const { dialog } = setup({ currentHp: 12, maxHp: 30, conModifier: 2 });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(within(dialog).getByText("Short rest")).toBeInTheDocument();
    expect(dialog).toHaveTextContent("HP 12/30. Each Hit Die spent heals its roll +2 (Constitution).");
    expect(dialog).not.toHaveTextContent(/Pact Magic/);
  });

  it("formats a negative Con modifier with its sign", () => {
    const { dialog } = setup({ conModifier: -1 });
    expect(dialog).toHaveTextContent("heals its roll -1 (Constitution)");
  });

  it("mentions Pact Magic slots only when the character has them", () => {
    const { dialog } = setup({ hasPactSlots: true });
    expect(dialog).toHaveTextContent("Pact Magic slots are restored.");
  });

  it("starts with nothing chosen: minus disabled, and the confirm button offers to rest without spending", () => {
    setup({ pools: [pool(10, 3, 1)] });
    expect(fewer(10)).toBeDisabled();
    expect(more(10)).toBeEnabled();
    expect(screen.getByText("2/3 left")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Rest without spending" })).toBeInTheDocument();
  });

  it("the stepper counts up to the remaining dice and back down to zero", async () => {
    const { user } = setup({ pools: [pool(10, 3, 1)] });
    const row = more(10).parentElement!;

    await user.click(more(10));
    expect(within(row).getByText("1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Roll 1 Hit Die & rest" })).toBeInTheDocument();

    await user.click(more(10));
    expect(within(row).getByText("2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Roll 2 Hit Dice & rest" })).toBeInTheDocument();
    expect(more(10)).toBeDisabled();

    await user.click(fewer(10));
    await user.click(fewer(10));
    expect(within(row).getByText("0")).toBeInTheDocument();
    expect(fewer(10)).toBeDisabled();
    expect(screen.getByRole("button", { name: "Rest without spending" })).toBeInTheDocument();
  });

  it("confirming hands the chosen count per die size to onConfirm", async () => {
    const { user, onConfirm } = setup({ pools: [pool(10, 3), pool(6, 2)] });
    await user.click(more(10));
    await user.click(more(10));
    await user.click(more(6));
    await user.click(screen.getByRole("button", { name: "Roll 3 Hit Dice & rest" }));
    expect(onConfirm).toHaveBeenCalledExactlyOnceWith({ 10: 2, 6: 1 });
  });

  it("resting without spending confirms with no dice", async () => {
    const { user, onConfirm, onCancel } = setup();
    await user.click(screen.getByRole("button", { name: "Rest without spending" }));
    expect(onConfirm).toHaveBeenCalledExactlyOnceWith({});
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("shows one stepper per die size for a multiclass character", () => {
    setup({ pools: [pool(10, 3), pool(6, 2, 2)] });
    expect(screen.getByText("d10")).toBeInTheDocument();
    expect(screen.getByText("d6")).toBeInTheDocument();
    expect(screen.getByText("0/2 left")).toBeInTheDocument();
    expect(more(6)).toBeDisabled();
    expect(more(10)).toBeEnabled();
  });

  it("says there are no Hit Dice left when every pool is spent", () => {
    setup({ pools: [pool(10, 3, 3)] });
    expect(screen.getByText(/No Hit Dice left/)).toBeInTheDocument();
    expect(more(10)).toBeDisabled();
  });

  it("does not show the no-dice message while any die remains", () => {
    setup({ pools: [pool(10, 3, 3), pool(6, 1)] });
    expect(screen.queryByText(/No Hit Dice left/)).not.toBeInTheDocument();
  });

  it.each([
    ["the Cancel button", async (user: ReturnType<typeof userEvent.setup>) => user.click(screen.getByRole("button", { name: "Cancel" }))],
    ["the Dismiss (✕) button", async (user: ReturnType<typeof userEvent.setup>) => user.click(screen.getByRole("button", { name: "Dismiss" }))],
    ["Escape", async (user: ReturnType<typeof userEvent.setup>) => user.keyboard("{Escape}")],
  ])("cancels via %s without confirming", async (_label, act) => {
    const { user, onConfirm, onCancel } = setup();
    await user.click(more(10));
    await act(user);
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("clicking the backdrop does not cancel (confirm dialogs need an explicit choice)", async () => {
    const { user, onCancel, dialog } = setup();
    await user.click(dialog.parentElement!);
    expect(onCancel).not.toHaveBeenCalled();
  });

  describe("wired to getHitDicePools/spendHitDice (as the character page does)", () => {
    function Harness({ initial }: { initial: Character }) {
      const [character, setCharacter] = useState(initial);
      const [healed, setHealed] = useState<number | null>(null);
      return (
        <>
          <p>Healed: {healed ?? "-"}</p>
          <ShortRestDialog
            pools={getHitDicePools(character)}
            conModifier={1}
            currentHp={character.currentHP}
            maxHp={character.maxHP}
            hasPactSlots={false}
            onCancel={() => {}}
            onConfirm={(spend) => {
              const result = spendHitDice(character, spend);
              setHealed(result?.healed ?? 0);
              if (result) {
                setCharacter((current) => ({
                  ...current,
                  currentHP: current.currentHP + result.healed,
                  details: { ...current.details, expendedHitDice: result.expendedHitDice },
                }));
              }
            }}
          />
        </>
      );
    }

    it("spending a d10 and a d6 heals roll + Con per die and marks them spent", async () => {
      // Con 12 -> +1. Every die rolls its midpoint-ish: floor(0.5 * sides) + 1.
      vi.spyOn(Math, "random").mockReturnValue(0.5);
      const user = userEvent.setup();
      const character = makeCharacter({
        classes: [classLevel(Fighter, 2), classLevel(Wizard, 1)],
        abilityScores: { strength: 10, dexterity: 10, constitution: 12, intelligence: 10, wisdom: 10, charisma: 10 },
        currentHP: 5,
        maxHP: 30,
      });
      render(<Harness initial={character} />);

      expect(screen.getByText("2/2 left")).toBeInTheDocument();
      expect(screen.getByText("1/1 left")).toBeInTheDocument();
      await user.click(more(10));
      await user.click(more(6));
      await user.click(screen.getByRole("button", { name: "Roll 2 Hit Dice & rest" }));

      // d10 -> 6 (+1) = 7, d6 -> 4 (+1) = 5
      expect(screen.getByText("Healed: 12")).toBeInTheDocument();
      expect(screen.getByRole("dialog")).toHaveTextContent("HP 17/30");
      expect(screen.getByText("1/2 left")).toBeInTheDocument();
      expect(screen.getByText("0/1 left")).toBeInTheDocument();
    });
  });
});
