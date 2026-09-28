import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StatusPanel } from "./StatusPanel";
import type { CharacterDetails } from "@/interfaces/CharacterDetails";
import type { Edition } from "@/interfaces/Edition";
import { CONDITIONS } from "@/utils/conditions";
import { makeCharacter } from "../../../tests/fixtures/characters";

function setup(details?: CharacterDetails, edition: Edition = "2024") {
  const onUpdateDetails = vi.fn();
  const user = userEvent.setup();
  const view = render(<StatusPanel character={makeCharacter({ edition, details })} onUpdateDetails={onUpdateDetails} />);
  return { user, onUpdateDetails, ...view };
}

const pip = (label: string, n: number) => screen.getByRole("button", { name: `${label} ${n}` });
const pressedCount = (label: string, count: number) =>
  Array.from({ length: count }, (_, i) => pip(label, i + 1)).filter((el) => el.getAttribute("aria-pressed") === "true").length;

describe("StatusPanel", () => {
  it("renders blank trackers for a character with no details", () => {
    setup(undefined);
    expect(screen.getByRole("heading", { name: "Status" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Inspiration" })).not.toBeChecked();
    expect(pressedCount("Exhaustion level", 6)).toBe(0);
    expect(pressedCount("Death save success", 3)).toBe(0);
    expect(pressedCount("Death save failure", 3)).toBe(0);
    expect(screen.getByText("None")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Clear" })).not.toBeInTheDocument();
    for (const condition of CONDITIONS) {
      expect(screen.getByRole("button", { name: condition })).toHaveAttribute("aria-pressed", "false");
    }
  });

  describe("inspiration", () => {
    it("checking the box grants inspiration", async () => {
      const { user, onUpdateDetails } = setup({});
      await user.click(screen.getByRole("checkbox", { name: "Inspiration" }));
      expect(onUpdateDetails).toHaveBeenCalledExactlyOnceWith({ inspiration: true });
    });

    it("unchecking it spends inspiration", async () => {
      const { user, onUpdateDetails } = setup({ inspiration: true });
      const box = screen.getByRole("checkbox", { name: "Inspiration" });
      expect(box).toBeChecked();
      await user.click(box);
      expect(onUpdateDetails).toHaveBeenCalledExactlyOnceWith({ inspiration: false });
    });
  });

  describe("exhaustion", () => {
    it("shows the current level as filled pips", () => {
      setup({ exhaustionLevel: 2 });
      expect(pip("Exhaustion level", 1)).toHaveAttribute("aria-pressed", "true");
      expect(pip("Exhaustion level", 2)).toHaveAttribute("aria-pressed", "true");
      expect(pip("Exhaustion level", 3)).toHaveAttribute("aria-pressed", "false");
    });

    it("clicking a pip sets the level to that pip", async () => {
      const { user, onUpdateDetails } = setup({ exhaustionLevel: 1 });
      await user.click(pip("Exhaustion level", 4));
      expect(onUpdateDetails).toHaveBeenCalledExactlyOnceWith({ exhaustionLevel: 4 });
    });

    it("clicking a lower pip lowers the level to it", async () => {
      const { user, onUpdateDetails } = setup({ exhaustionLevel: 4 });
      await user.click(pip("Exhaustion level", 2));
      expect(onUpdateDetails).toHaveBeenCalledExactlyOnceWith({ exhaustionLevel: 2 });
    });

    it("clicking the topmost filled pip again steps down by one", async () => {
      const { user, onUpdateDetails } = setup({ exhaustionLevel: 3 });
      await user.click(pip("Exhaustion level", 3));
      expect(onUpdateDetails).toHaveBeenCalledExactlyOnceWith({ exhaustionLevel: 2 });
    });

    it("clicking the only filled pip clears exhaustion", async () => {
      const { user, onUpdateDetails } = setup({ exhaustionLevel: 1 });
      await user.click(pip("Exhaustion level", 1));
      expect(onUpdateDetails).toHaveBeenCalledExactlyOnceWith({ exhaustionLevel: 0 });
    });

    it("the tooltip explains the 2024 effects of the current level", async () => {
      const { user } = setup({ exhaustionLevel: 2 }, "2024");
      await user.hover(screen.getByRole("button", { name: "About Exhaustion 2" }));
      const tooltip = await screen.findByRole("tooltip");
      expect(tooltip).toHaveTextContent("-2 to every d20 Test");
      expect(tooltip).toHaveTextContent("Speed reduced by 10 ft.");
    });

    it("the tooltip lists the cumulative 2014 effects", async () => {
      const { user } = setup({ exhaustionLevel: 2 }, "2014");
      await user.hover(screen.getByRole("button", { name: "About Exhaustion 2" }));
      const tooltip = await screen.findByRole("tooltip");
      expect(tooltip).toHaveTextContent("Disadvantage on ability checks.");
      expect(tooltip).toHaveTextContent("Speed halved.");
      expect(tooltip).not.toHaveTextContent("Hit point maximum halved.");
    });

    it("the tooltip says so when there is no exhaustion", async () => {
      const { user } = setup({});
      await user.hover(screen.getByRole("button", { name: "About Exhaustion 0" }));
      expect(await screen.findByRole("tooltip")).toHaveTextContent("No exhaustion.");
    });
  });

  describe("concentration", () => {
    it("shows the spell being concentrated on, and the ✕ stops concentrating", async () => {
      const { user, onUpdateDetails } = setup({ concentratingOn: "Bless" });
      expect(screen.getByText("Bless")).toBeInTheDocument();
      expect(screen.queryByText("None")).not.toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Stop concentrating" }));
      expect(onUpdateDetails).toHaveBeenCalledExactlyOnceWith({ concentratingOn: undefined });
    });

    it("has no stop button when not concentrating", () => {
      setup({});
      expect(screen.queryByRole("button", { name: "Stop concentrating" })).not.toBeInTheDocument();
    });
  });

  describe("death saves", () => {
    it("shows successes and failures separately", () => {
      setup({ deathSaves: { successes: 1, failures: 2 } });
      expect(pressedCount("Death save success", 3)).toBe(1);
      expect(pressedCount("Death save failure", 3)).toBe(2);
    });

    it("marking a success keeps the existing failures", async () => {
      const { user, onUpdateDetails } = setup({ deathSaves: { successes: 1, failures: 2 } });
      await user.click(pip("Death save success", 2));
      expect(onUpdateDetails).toHaveBeenCalledExactlyOnceWith({ deathSaves: { successes: 2, failures: 2 } });
    });

    it("marking a failure keeps the existing successes", async () => {
      const { user, onUpdateDetails } = setup({ deathSaves: { successes: 2, failures: 0 } });
      await user.click(pip("Death save failure", 1));
      expect(onUpdateDetails).toHaveBeenCalledExactlyOnceWith({ deathSaves: { successes: 2, failures: 1 } });
    });

    it("works from a blank state", async () => {
      const { user, onUpdateDetails } = setup(undefined);
      await user.click(pip("Death save failure", 3));
      expect(onUpdateDetails).toHaveBeenCalledExactlyOnceWith({ deathSaves: { successes: 0, failures: 3 } });
    });

    it("clicking the topmost filled pip removes it", async () => {
      const { user, onUpdateDetails } = setup({ deathSaves: { successes: 2, failures: 1 } });
      await user.click(pip("Death save success", 2));
      expect(onUpdateDetails).toHaveBeenCalledExactlyOnceWith({ deathSaves: { successes: 1, failures: 1 } });
    });

    it("Clear appears once any save is marked and resets both tracks", async () => {
      const { user, onUpdateDetails } = setup({ deathSaves: { successes: 0, failures: 1 } });
      await user.click(screen.getByRole("button", { name: "Clear" }));
      expect(onUpdateDetails).toHaveBeenCalledExactlyOnceWith({ deathSaves: { successes: 0, failures: 0 } });
    });
  });

  describe("conditions", () => {
    it("marks active conditions as pressed", () => {
      setup({ conditions: ["Prone", "Poisoned"] });
      expect(screen.getByRole("button", { name: "Prone" })).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByRole("button", { name: "Poisoned" })).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByRole("button", { name: "Blinded" })).toHaveAttribute("aria-pressed", "false");
    });

    it("clicking an inactive condition adds it to the existing list", async () => {
      const { user, onUpdateDetails } = setup({ conditions: ["Prone"] });
      await user.click(screen.getByRole("button", { name: "Grappled" }));
      expect(onUpdateDetails).toHaveBeenCalledExactlyOnceWith({ conditions: ["Prone", "Grappled"] });
    });

    it("clicking an active condition removes only that one", async () => {
      const { user, onUpdateDetails } = setup({ conditions: ["Prone", "Poisoned", "Blinded"] });
      await user.click(screen.getByRole("button", { name: "Poisoned" }));
      expect(onUpdateDetails).toHaveBeenCalledExactlyOnceWith({ conditions: ["Prone", "Blinded"] });
    });

    it("each condition's tooltip describes its effect", async () => {
      const { user, onUpdateDetails } = setup({});
      await user.click(screen.getByRole("button", { name: "About Incapacitated" }));
      expect(await screen.findByRole("tooltip")).toHaveTextContent("Can't take actions or reactions.");
      expect(onUpdateDetails).not.toHaveBeenCalled();
    });
  });
});
