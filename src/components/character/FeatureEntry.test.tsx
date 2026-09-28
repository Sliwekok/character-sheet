import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FeatureEntry, type FeatureLike } from "./FeatureEntry";
import { Rogue } from "@/data/2024/classes/Rogue";

const secondWind: FeatureLike = { name: "Second Wind", level: 1, description: "Regain 1d10 + fighter level HP." };

function sneakAttack(): FeatureLike {
  const found = Rogue.features.find((f) => f.name === "Sneak Attack");
  if (!found) throw new Error("Rogue data has no Sneak Attack");
  return structuredClone(found);
}

describe("FeatureEntry", () => {
  it("shows the feature name and level, with its description collapsed by default", () => {
    render(<FeatureEntry feature={secondWind} reached edition="2024" />);
    const summary = screen.getByText("Second Wind").closest("summary")!;
    expect(summary).toHaveTextContent("Level 1");
    expect(screen.getByText(secondWind.description)).not.toBeVisible();
    expect(screen.queryByText("Locked")).not.toBeInTheDocument();
  });

  it("clicking the summary expands and collapses the description", async () => {
    const user = userEvent.setup();
    render(<FeatureEntry feature={secondWind} reached edition="2024" />);
    const summary = screen.getByText("Second Wind").closest("summary")!;

    await user.click(summary);
    expect(screen.getByText(secondWind.description)).toBeVisible();

    await user.click(summary);
    expect(screen.getByText(secondWind.description)).not.toBeVisible();
  });

  it("alwaysExpanded shows the description with no disclosure toggle", () => {
    const { container } = render(<FeatureEntry feature={secondWind} reached edition="2024" alwaysExpanded />);
    expect(screen.getByText(secondWind.description)).toBeVisible();
    expect(container.querySelector("summary, details")).toBeNull();
  });

  it("marks a feature above the character's level as Locked", () => {
    render(<FeatureEntry feature={{ ...secondWind, level: 5 }} reached={false} edition="2024" />);
    expect(screen.getByText("Locked")).toBeInTheDocument();
    expect(screen.getByText("Level 5")).toBeInTheDocument();
  });

  describe("granted spells", () => {
    const feature: FeatureLike = {
      name: "Fey Step",
      level: 3,
      description: "You always have Misty Step prepared. You can cast misty step without a slot.",
      grantedSpells: [{ spellName: "Misty Step" }],
    };

    it("badges a fixed free spell once the feature is reached", () => {
      render(<FeatureEntry feature={feature} reached edition="2024" />);
      expect(screen.getByText("Free spell: Misty Step")).toBeInTheDocument();
    });

    it("hides free-spell badges while the feature is still locked", () => {
      render(<FeatureEntry feature={feature} reached={false} edition="2024" />);
      expect(screen.queryByText(/Free spell/)).not.toBeInTheDocument();
      expect(screen.getByText("Locked")).toBeInTheDocument();
    });

    it("links every case-insensitive mention of the spell to its search page", async () => {
      const user = userEvent.setup();
      render(<FeatureEntry feature={feature} reached edition="2014" />);
      await user.click(screen.getByText("Fey Step").closest("summary")!);

      const links = screen.getAllByRole("link");
      expect(links.map((link) => link.textContent)).toEqual(["Misty Step", "misty step"]);
      for (const link of links) {
        expect(link).toHaveAttribute("href", "/search?edition=2014&type=spells&name=Misty%20Step");
        expect(link).toHaveAttribute("target", "_blank");
      }
    });

    it("describes a choice-type grant by count and level", () => {
      render(
        <FeatureEntry
          feature={{
            name: "Mystic Arcanum",
            level: 11,
            description: "Choose spells.",
            grantedSpells: [{ choice: { count: 1, spellLevel: 6 } }],
          }}
          reached
          edition="2024"
        />
      );
      expect(screen.getByText("Free spell: choose 1 level 6 spell")).toBeInTheDocument();
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });
  });

  describe("Sneak Attack progression table", () => {
    it("lists damage by level range", () => {
      render(<FeatureEntry feature={sneakAttack()} reached edition="2024" alwaysExpanded />);
      const table = screen.getByRole("table");
      const rows = within(table).getAllByRole("row").slice(1);
      expect(rows).toHaveLength(10);
      expect(rows[0]).toHaveTextContent("1–21d6");
      expect(rows[9]).toHaveTextContent("19–2010d6");
    });

    it("highlights the row for the character's class level", () => {
      render(<FeatureEntry feature={sneakAttack()} reached edition="2024" alwaysExpanded classLevel={6} />);
      const current = within(screen.getByRole("table"))
        .getAllByRole("row")
        .filter((row) => row.getAttribute("aria-current") === "true");
      expect(current).toHaveLength(1);
      expect(current[0]).toHaveTextContent("5–63d6");
    });

    it("highlights nothing without a class level (compendium view)", () => {
      render(<FeatureEntry feature={sneakAttack()} reached edition="2024" alwaysExpanded />);
      const rows = within(screen.getByRole("table")).getAllByRole("row");
      expect(rows.some((row) => row.hasAttribute("aria-current"))).toBe(false);
    });
  });
});
