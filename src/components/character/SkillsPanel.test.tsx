import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SkillsPanel } from "./SkillsPanel";
import { SKILL_LIST } from "@/utils/characterSheetHelpers";
import { SKILL_ABILITIES, type SkillName } from "@/interfaces/Skill";
import { Fighter } from "@/data/2024/classes/Fighter";
import { classLevel, makeCharacter } from "../../../tests/fixtures/characters";

// STR 8 (-1), DEX 16 (+3), CON 12 (+1), INT 10 (+0), WIS 14 (+2), CHA 13 (+1)
const scores = { strength: 8, dexterity: 16, constitution: 12, intelligence: 10, wisdom: 14, charisma: 13 };
const mods: Record<string, number> = { strength: -1, dexterity: 3, constitution: 1, intelligence: 0, wisdom: 2, charisma: 1 };

const fmt = (n: number) => (n >= 0 ? `+${n}` : `${n}`);

/** The row for one skill - the element holding its name, ability, modifier and Roll button. */
function skillRow(skill: SkillName): HTMLElement {
  return screen.getByText(skill, { selector: "span" }).parentElement!;
}

function setup(overrides: Parameters<typeof makeCharacter>[0] = {}) {
  const onRoll = vi.fn();
  const user = userEvent.setup();
  const character = makeCharacter({ abilityScores: scores, ...overrides });
  render(<SkillsPanel character={character} onRoll={onRoll} />);
  return { user, onRoll, character };
}

describe("SkillsPanel", () => {
  it("lists all 18 skills in sheet order, each with its own Roll button", () => {
    setup();
    expect(screen.getByRole("heading", { name: "Skills" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Roll" })).toHaveLength(18);
    const names = SKILL_LIST.map((skill) => screen.getByText(skill, { selector: "span" }));
    for (let i = 1; i < names.length; i++) {
      expect(names[i - 1].compareDocumentPosition(names[i]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
  });

  it("shows each skill's governing ability and its ability modifier when not proficient", () => {
    setup({ skillProficiencies: [] });
    for (const skill of SKILL_LIST) {
      const ability = SKILL_ABILITIES[skill];
      const row = skillRow(skill);
      expect(within(row).getByText(ability.slice(0, 3).toUpperCase())).toBeInTheDocument();
      expect(row).toHaveTextContent(new RegExp(`\\${fmt(mods[ability])}`));
    }
  });

  it("adds the proficiency bonus only to proficient skills", () => {
    setup({ skillProficiencies: ["Stealth", "Athletics"] });
    // Level 1 -> +2 proficiency bonus.
    expect(skillRow("Stealth")).toHaveTextContent("+5");
    expect(skillRow("Athletics")).toHaveTextContent("+1"); // -1 STR + 2
    expect(skillRow("Acrobatics")).toHaveTextContent("+3"); // same DEX, not proficient
    expect(within(skillRow("Stealth")).getByTitle("Proficient")).toBeInTheDocument();
    expect(within(skillRow("Acrobatics")).getByTitle("Not proficient")).toBeInTheDocument();
  });

  it("uses the proficiency bonus for the character's total level", () => {
    setup({ classes: [classLevel(Fighter, 5)], skillProficiencies: ["Stealth"] });
    expect(skillRow("Stealth")).toHaveTextContent("+6"); // +3 DEX, +3 PB
  });

  it("shows passive Perception as 10 + the Perception modifier", () => {
    setup({ skillProficiencies: ["Perception"] });
    expect(screen.getByText("Passive Perception 14")).toBeInTheDocument();
  });

  it("the Passive Perception tooltip explains the sum", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "About Passive Perception" }));
    const tooltip = await screen.findByRole("tooltip");
    expect(tooltip).toHaveTextContent("Base10");
    expect(tooltip).toHaveTextContent("Perception modifier+2");
    expect(tooltip).toHaveTextContent("Total12");
  });

  it("a skill's tooltip breaks the modifier down, with a proficiency line only when proficient", async () => {
    const { user } = setup({ skillProficiencies: ["Stealth"] });
    await user.click(screen.getByRole("button", { name: "About Stealth" }));
    const tooltip = await screen.findByRole("tooltip");
    expect(tooltip).toHaveTextContent("DEX modifier+3");
    expect(tooltip).toHaveTextContent("Proficiency bonus+2");
    expect(tooltip).toHaveTextContent("Total+5");

    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "About Arcana" }));
    const arcana = await screen.findByRole("tooltip");
    expect(arcana).toHaveTextContent("INT modifier+0");
    expect(arcana).not.toHaveTextContent("Proficiency bonus");
  });

  it("Roll calls onRoll with the skill label and a d20 plus that skill's modifier", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.7); // d20 -> 15
    const { user, onRoll } = setup({ skillProficiencies: ["Stealth"] });

    await user.click(within(skillRow("Stealth")).getByRole("button", { name: "Roll" }));

    expect(onRoll).toHaveBeenCalledExactlyOnceWith("Stealth check", {
      formula: "1d20",
      rolls: [15],
      diceTotal: 15,
      modifier: 5,
      total: 20,
    });
    expect(within(skillRow("Stealth")).getByText("15 + 5 = 20")).toBeInTheDocument();
  });

  it("shows a negative modifier as a subtraction in the inline result", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0); // d20 -> 1
    const { user, onRoll } = setup();
    await user.click(within(skillRow("Athletics")).getByRole("button", { name: "Roll" }));
    expect(onRoll).toHaveBeenCalledWith("Athletics check", expect.objectContaining({ rolls: [1], modifier: -1, total: 0 }));
    expect(within(skillRow("Athletics")).getByText("1 - 1 = 0")).toBeInTheDocument();
  });

  it("keeps each skill's latest inline result independently", async () => {
    const random = vi.spyOn(Math, "random");
    const { user } = setup();

    random.mockReturnValue(0.45); // 10
    await user.click(within(skillRow("Insight")).getByRole("button", { name: "Roll" }));
    random.mockReturnValue(0.95); // 20
    await user.click(within(skillRow("History")).getByRole("button", { name: "Roll" }));

    expect(within(skillRow("Insight")).getByText("10 + 2 = 12")).toBeInTheDocument();
    expect(within(skillRow("History")).getByText("20 = 20")).toBeInTheDocument();

    random.mockReturnValue(0); // 1
    await user.click(within(skillRow("Insight")).getByRole("button", { name: "Roll" }));
    expect(within(skillRow("Insight")).getByText("1 + 2 = 3")).toBeInTheDocument();
    expect(within(skillRow("Insight")).queryByText("10 + 2 = 12")).not.toBeInTheDocument();
  });

  it("still rolls and shows the result without an onRoll callback", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5); // 11
    const user = userEvent.setup();
    render(<SkillsPanel character={makeCharacter({ abilityScores: scores })} />);
    await user.click(within(skillRow("Survival")).getByRole("button", { name: "Roll" }));
    expect(within(skillRow("Survival")).getByText("11 + 2 = 13")).toBeInTheDocument();
  });
});
