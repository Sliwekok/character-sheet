import { describe, it, expect } from "vitest";
import { CONDITIONS, CONDITION_DESCRIPTIONS, MAX_EXHAUSTION_LEVEL, getExhaustionEffectLines } from "./conditions";

describe("CONDITION_DESCRIPTIONS", () => {
    it("has a non-empty description for every one of the 14 conditions, and nothing else", () => {
        expect(CONDITIONS).toHaveLength(14);
        expect(Object.keys(CONDITION_DESCRIPTIONS).sort()).toEqual([...CONDITIONS].sort());
        for (const condition of CONDITIONS) {
            expect(CONDITION_DESCRIPTIONS[condition].trim().length).toBeGreaterThan(0);
        }
    });
});

describe("getExhaustionEffectLines", () => {
    it("caps the exhaustion track at 6", () => {
        expect(MAX_EXHAUSTION_LEVEL).toBe(6);
    });

    it.each(["2014", "2024"] as const)("reports no exhaustion at level 0 or below (%s)", (edition) => {
        expect(getExhaustionEffectLines(0, edition)).toEqual(["No exhaustion."]);
        expect(getExhaustionEffectLines(-1, edition)).toEqual(["No exhaustion."]);
    });

    describe("2024", () => {
        it("applies a flat d20 penalty and 5 ft of speed loss per level", () => {
            expect(getExhaustionEffectLines(1, "2024")).toEqual([
                "-1 to every d20 Test (ability checks, attack rolls, and saving throws).",
                "Speed reduced by 5 ft.",
            ]);
            expect(getExhaustionEffectLines(3, "2024")).toEqual([
                "-3 to every d20 Test (ability checks, attack rolls, and saving throws).",
                "Speed reduced by 15 ft.",
            ]);
        });

        it("adds death at level 6", () => {
            const lines = getExhaustionEffectLines(6, "2024");
            expect(lines).toHaveLength(3);
            expect(lines[0]).toMatch(/^-6 to every d20 Test/);
            expect(lines[1]).toBe("Speed reduced by 30 ft.");
            expect(lines[2]).toBe("At level 6, the character dies.");
        });

        it("does not mention death below level 6", () => {
            expect(getExhaustionEffectLines(5, "2024").join(" ")).not.toMatch(/dies/);
        });
    });

    describe("2014", () => {
        it("lists each level's effect cumulatively", () => {
            expect(getExhaustionEffectLines(1, "2014")).toEqual(["Disadvantage on ability checks."]);
            expect(getExhaustionEffectLines(3, "2014")).toEqual([
                "Disadvantage on ability checks.",
                "Speed halved.",
                "Disadvantage on attack rolls and saving throws.",
            ]);
        });

        it("ends in death at level 6", () => {
            const lines = getExhaustionEffectLines(6, "2014");
            expect(lines).toHaveLength(6);
            expect(lines[3]).toBe("Hit point maximum halved.");
            expect(lines[4]).toBe("Speed reduced to 0.");
            expect(lines[5]).toBe("Death.");
        });

        it("never lists more than the six levels", () => {
            expect(getExhaustionEffectLines(9, "2014")).toHaveLength(6);
        });
    });
});
