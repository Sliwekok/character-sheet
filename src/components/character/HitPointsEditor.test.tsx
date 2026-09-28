import { useState } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HitPointsEditor } from "./HitPointsEditor";
import { applyCurrentHp, getSheetMaxHp } from "@/utils/hitDice";
import type { Character } from "@/interfaces/Characters";
import { makeCharacter } from "../../../tests/fixtures/characters";

const INPUT_NAME = /current hit points/i;

function setup(currentHp = 10, maxHp = 20) {
  const onChange = vi.fn();
  const user = userEvent.setup();
  render(<HitPointsEditor currentHp={currentHp} maxHp={maxHp} onChange={onChange} />);
  return { user, onChange };
}

async function openEditor(user: ReturnType<typeof userEvent.setup>) {
  await user.dblClick(screen.getByRole("button", { name: /HP \d+\/\d+/ }));
  return screen.getByRole("textbox", { name: INPUT_NAME });
}

async function enter(user: ReturnType<typeof userEvent.setup>, input: HTMLElement, text: string) {
  await user.clear(input);
  await user.type(input, text);
}

describe("HitPointsEditor", () => {
  it("shows current and max HP as a button, with no input until edited", () => {
    setup(7, 12);
    expect(screen.getByRole("button", { name: "HP 7/12" })).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("does not start editing on a single click", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "HP 10/20" }));
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("double-click swaps in a focused input pre-filled with the current HP, keeping the max visible", async () => {
    const { user } = setup(10, 20);
    const input = await openEditor(user);
    expect(input).toHaveValue("10");
    expect(input).toHaveFocus();
    expect(screen.getByText(/\/20/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "HP 10/20" })).not.toBeInTheDocument();
  });

  it("pressing Enter on the focused badge also starts editing", async () => {
    const { user } = setup(10, 20);
    screen.getByRole("button", { name: "HP 10/20" }).focus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("textbox", { name: INPUT_NAME })).toHaveValue("10");
  });

  it("selects the existing value on focus so typing replaces it", async () => {
    const { user, onChange } = setup(10, 20);
    const input = (await openEditor(user)) as HTMLInputElement;
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe(2);
    await user.keyboard("15{Enter}");
    expect(onChange).toHaveBeenCalledExactlyOnceWith(15);
  });

  it("a bare number sets HP outright on Enter and closes the editor", async () => {
    const { user, onChange } = setup(10, 20);
    const input = await openEditor(user);
    await enter(user, input, "17{Enter}");
    expect(onChange).toHaveBeenCalledExactlyOnceWith(17);
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /HP/ })).toBeInTheDocument();
  });

  it('"-8" applies damage relative to the current HP', async () => {
    const { user, onChange } = setup(10, 20);
    await enter(user, await openEditor(user), "-8{Enter}");
    expect(onChange).toHaveBeenCalledExactlyOnceWith(2);
  });

  it('"+5" heals relative to the current HP', async () => {
    const { user, onChange } = setup(10, 20);
    await enter(user, await openEditor(user), "+5{Enter}");
    expect(onChange).toHaveBeenCalledExactlyOnceWith(15);
  });

  it("tolerates surrounding whitespace and a space after the sign", async () => {
    const { user, onChange } = setup(10, 20);
    await enter(user, await openEditor(user), "  - 3 {Enter}");
    expect(onChange).toHaveBeenCalledExactlyOnceWith(7);
  });

  it("leaves clamping to the caller: over-damage and over-healing are passed through unclamped", async () => {
    const { user, onChange } = setup(10, 20);
    await enter(user, await openEditor(user), "-50{Enter}");
    expect(onChange).toHaveBeenLastCalledWith(-40);

    await enter(user, await openEditor(user), "+50{Enter}");
    expect(onChange).toHaveBeenLastCalledWith(60);
  });

  it("clicking away (blur) saves the draft", async () => {
    const { user, onChange } = setup(10, 20);
    await enter(user, await openEditor(user), "+3");
    await user.tab();
    expect(onChange).toHaveBeenCalledExactlyOnceWith(13);
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("Escape cancels without calling onChange", async () => {
    const { user, onChange } = setup(10, 20);
    await enter(user, await openEditor(user), "-8{Escape}");
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "HP 10/20" })).toBeInTheDocument();
  });

  it("garbage input is discarded rather than saved", async () => {
    const { user, onChange } = setup(10, 20);
    for (const text of ["abc", "5+", "+", "1.5", "--2"]) {
      await enter(user, await openEditor(user), `${text}{Enter}`);
    }
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "HP 10/20" })).toBeInTheDocument();
  });

  it("an empty draft is discarded", async () => {
    const { user, onChange } = setup(10, 20);
    const input = await openEditor(user);
    await user.clear(input);
    await user.keyboard("{Enter}");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("doesn't call onChange when the value is unchanged", async () => {
    const { user, onChange } = setup(10, 20);
    await enter(user, await openEditor(user), "10{Enter}");
    await enter(user, await openEditor(user), "+0{Enter}");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("re-opening the editor starts from the latest current HP, not the previous draft", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(<HitPointsEditor currentHp={10} maxHp={20} onChange={onChange} />);
    await enter(user, await openEditor(user), "-8{Escape}");
    rerender(<HitPointsEditor currentHp={4} maxHp={20} onChange={onChange} />);
    expect(await openEditor(user)).toHaveValue("4");
  });

  describe("wired to applyCurrentHp (as the character page does)", () => {
    function Harness({ initial }: { initial: Character }) {
      const [character, setCharacter] = useState(initial);
      return (
        <HitPointsEditor
          currentHp={character.currentHP}
          maxHp={getSheetMaxHp(character)}
          onChange={(next) => setCharacter((current) => ({ ...current, ...applyCurrentHp(current, next) }))}
        />
      );
    }

    it("clamps damage at 0 and healing at the sheet's max HP", async () => {
      const user = userEvent.setup();
      const character = makeCharacter({ currentHP: 6 });
      const max = getSheetMaxHp(character);
      render(<Harness initial={character} />);

      await enter(user, await openEditor(user), "-50{Enter}");
      expect(screen.getByRole("button", { name: `HP 0/${max}` })).toBeInTheDocument();

      await enter(user, await openEditor(user), "+999{Enter}");
      expect(screen.getByRole("button", { name: `HP ${max}/${max}` })).toBeInTheDocument();
    });
  });
});
