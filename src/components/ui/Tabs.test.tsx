import { useState } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tabs, type TabItem } from "./Tabs";

type Key = "actions" | "spells" | "inventory";
const tabs: TabItem<Key>[] = [
  { key: "actions", label: "Actions" },
  { key: "spells", label: "Spells", count: 7 },
  { key: "inventory", label: "Inventory", count: 0 },
];

describe("Tabs", () => {
  it("renders a tablist with one tab per item and marks the active one selected", () => {
    render(<Tabs tabs={tabs} active="spells" onChange={() => {}} />);
    expect(screen.getByRole("tablist")).toBeInTheDocument();
    const all = screen.getAllByRole("tab");
    expect(all).toHaveLength(3);
    expect(screen.getByRole("tab", { name: /Spells/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Actions" })).toHaveAttribute("aria-selected", "false");
  });

  it("shows a count badge only when the count is non-zero", () => {
    render(<Tabs tabs={tabs} active="actions" onChange={() => {}} />);
    expect(screen.getByRole("tab", { name: "Spells 7" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Inventory" })).toHaveTextContent(/^Inventory$/);
  });

  it("clicking a tab calls onChange with its key", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Tabs tabs={tabs} active="actions" onChange={onChange} />);
    await user.click(screen.getByRole("tab", { name: "Inventory" }));
    expect(onChange).toHaveBeenCalledExactlyOnceWith("inventory");
  });

  it("is controlled: selection follows the parent's state", async () => {
    function Harness() {
      const [active, setActive] = useState<Key>("actions");
      return (
        <>
          <Tabs tabs={tabs} active={active} onChange={setActive} />
          <p>Showing {active}</p>
        </>
      );
    }
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("tab", { name: /Spells/ }));
    expect(screen.getByRole("tab", { name: /Spells/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Actions" })).toHaveAttribute("aria-selected", "false");
    expect(screen.getByText("Showing spells")).toBeInTheDocument();
  });

  it("does not change selection by itself when the parent ignores onChange", async () => {
    const user = userEvent.setup();
    render(<Tabs tabs={tabs} active="actions" onChange={() => {}} />);
    await user.click(screen.getByRole("tab", { name: /Spells/ }));
    expect(screen.getByRole("tab", { name: "Actions" })).toHaveAttribute("aria-selected", "true");
  });
});
