import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RollHistoryWidget, type RollHistoryEntry } from "./RollHistoryWidget";

const entry = (id: string, label: string, rolls: number[], modifier: number, rolledAt = Date.UTC(2026, 0, 1, 12, 0, 0)): RollHistoryEntry => {
  const diceTotal = rolls.reduce((a, b) => a + b, 0);
  return {
    id,
    label,
    result: { formula: `${rolls.length}d20`, rolls, diceTotal, modifier, total: diceTotal + modifier },
    rolledAt,
  };
};

const history = [
  entry("1", "Stealth check", [12], 3),
  entry("2", "Longsword — Attack roll", [18], 5),
  entry("3", "Fireball — Damage", [3, 5, 6], 0),
];

const toggle = () => screen.getByRole("button", { name: /^Roll History/ });

function setup(entries = history) {
  const onClear = vi.fn();
  const user = userEvent.setup();
  const view = render(<RollHistoryWidget history={entries} onClear={onClear} />);
  return { user, onClear, ...view };
}

describe("RollHistoryWidget", () => {
  it("renders nothing until the first roll", () => {
    const { container } = setup([]);
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("appears collapsed once there is a roll, badging the count", () => {
    setup();
    expect(toggle()).toHaveAttribute("aria-expanded", "false");
    expect(toggle()).toHaveTextContent("3");
    expect(screen.queryByText("Stealth check")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Clear" })).not.toBeInTheDocument();
  });

  it("shows up when the first roll arrives and keeps the count current", () => {
    const onClear = vi.fn();
    const { rerender } = render(<RollHistoryWidget history={[]} onClear={onClear} />);
    expect(screen.queryByRole("button", { name: /Roll History/ })).not.toBeInTheDocument();

    rerender(<RollHistoryWidget history={history.slice(0, 1)} onClear={onClear} />);
    expect(toggle()).toHaveTextContent("1");

    rerender(<RollHistoryWidget history={history} onClear={onClear} />);
    expect(toggle()).toHaveTextContent("3");
  });

  it("clicking the toggle opens the log with every entry, newest first", async () => {
    const { user } = setup();
    await user.click(toggle());

    expect(toggle()).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Roll History", { selector: "span" })).toBeInTheDocument();
    const labels = screen.getAllByText(/check$|Attack roll$|Damage$/).map((el) => el.textContent);
    expect(labels).toEqual(["Fireball — Damage", "Longsword — Attack roll", "Stealth check"]);
  });

  it("shows each roll's dice and total", async () => {
    const { user } = setup();
    await user.click(toggle());
    expect(screen.getByText("12 + 3 = 15")).toBeInTheDocument();
    expect(screen.getByText("18 + 5 = 23")).toBeInTheDocument();
    expect(screen.getByText("[3, 5, 6] = 14")).toBeInTheDocument();
  });

  it("stamps each entry with its wall-clock time", async () => {
    const rolledAt = new Date(2026, 0, 1, 14, 32, 5).getTime();
    const { user } = setup([entry("1", "Stealth check", [12], 3, rolledAt)]);
    await user.click(toggle());
    const expected = new Date(rolledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it("clicking the toggle again, or the ✕, collapses the log", async () => {
    const { user } = setup();
    await user.click(toggle());
    await user.click(toggle());
    expect(toggle()).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Stealth check")).not.toBeInTheDocument();

    await user.click(toggle());
    await user.click(screen.getByRole("button", { name: "Close roll history" }));
    expect(toggle()).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Stealth check")).not.toBeInTheDocument();
  });

  it("Clear calls onClear", async () => {
    const { user, onClear } = setup();
    await user.click(toggle());
    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("disappears entirely once the parent clears the history", async () => {
    const onClear = vi.fn();
    const user = userEvent.setup();
    const { rerender, container } = render(<RollHistoryWidget history={history} onClear={onClear} />);
    await user.click(toggle());
    rerender(<RollHistoryWidget history={[]} onClear={onClear} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("new rolls appear at the top of an open log", async () => {
    const onClear = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(<RollHistoryWidget history={history.slice(0, 1)} onClear={onClear} />);
    await user.click(toggle());
    rerender(<RollHistoryWidget history={[...history.slice(0, 1), entry("9", "Perception check", [7], 2)]} onClear={onClear} />);
    expect(screen.getAllByText(/check$/).map((el) => el.textContent)).toEqual(["Perception check", "Stealth check"]);
  });
});
