import { useState } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FeatureGroup } from "./FeatureGroup";

function setup(props: Partial<React.ComponentProps<typeof FeatureGroup>> = {}) {
  const onToggle = vi.fn();
  const user = userEvent.setup();
  render(
    <FeatureGroup id="fighter" title="Fighter" collapsed={false} onToggle={onToggle} featureCount={2} {...props}>
      <p>Second Wind</p>
      <p>Action Surge</p>
    </FeatureGroup>
  );
  return { user, onToggle, header: screen.getByRole("button", { name: /Fighter/ }) };
}

describe("FeatureGroup", () => {
  it("when expanded, shows its features and a Hide control wired via aria-controls", () => {
    const { header } = setup({ collapsed: false });
    expect(header).toHaveAttribute("aria-expanded", "true");
    expect(header).toHaveTextContent("Hide");
    expect(screen.getByText("Second Wind")).toBeInTheDocument();
    const panel = document.getElementById(header.getAttribute("aria-controls")!);
    expect(panel).toContainElement(screen.getByText("Action Surge"));
  });

  it("when collapsed, hides its features but still reports how many there are", () => {
    const { header } = setup({ collapsed: true });
    expect(header).toHaveAttribute("aria-expanded", "false");
    expect(header).toHaveTextContent("Show");
    expect(header).toHaveTextContent("2 features");
    expect(screen.queryByText("Second Wind")).not.toBeInTheDocument();
  });

  it("uses the singular for a single feature", () => {
    const { header } = setup({ featureCount: 1 });
    expect(header).toHaveTextContent("1 feature");
    expect(header).not.toHaveTextContent("1 features");
  });

  it("shows a subtitle when given", () => {
    const { header } = setup({ subtitle: "Level 3" });
    expect(header).toHaveTextContent("Level 3");
  });

  it("hints at hidden locked features only when some are hidden", () => {
    const { header } = setup({ hiddenLockedCount: 4 });
    expect(header).toHaveTextContent("4 locked hidden");
  });

  it("has no locked hint by default", () => {
    const { header } = setup();
    expect(header).not.toHaveTextContent("locked hidden");
  });

  it("clicking anywhere on the header calls onToggle", async () => {
    const { user, onToggle, header } = setup();
    await user.click(header);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("toggles from the keyboard with Enter and Space", async () => {
    const { user, onToggle, header } = setup();
    header.focus();
    await user.keyboard("{Enter}");
    await user.keyboard(" ");
    expect(onToggle).toHaveBeenCalledTimes(2);
  });

  it("collapses and expands when the parent owns the state", async () => {
    function Harness() {
      const [collapsed, setCollapsed] = useState(false);
      return (
        <FeatureGroup id="g" title="Rogue" collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} featureCount={1}>
          <p>Sneak Attack</p>
        </FeatureGroup>
      );
    }
    const user = userEvent.setup();
    render(<Harness />);
    const header = screen.getByRole("button", { name: /Rogue/ });

    await user.click(header);
    expect(screen.queryByText("Sneak Attack")).not.toBeInTheDocument();
    await user.click(header);
    expect(screen.getByText("Sneak Attack")).toBeInTheDocument();
  });
});
