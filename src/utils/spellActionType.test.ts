import { describe, it, expect } from "vitest";
import { SPELL_ACTION_FILTERS, getSpellActionType, matchesSpellActionFilter } from "./spellActionType";

describe("getSpellActionType", () => {
    it("reads the compendium's short casting times", () => {
        expect(getSpellActionType("Action")).toBe("action");
        expect(getSpellActionType("Bonus")).toBe("bonus");
        expect(getSpellActionType("Reaction")).toBe("reaction");
    });

    it("reads imported/custom long-form casting times, case-insensitively", () => {
        expect(getSpellActionType("1 action")).toBe("action");
        expect(getSpellActionType("1 BONUS ACTION")).toBe("bonus");
        expect(getSpellActionType("1 reaction, which you take when you are hit by an attack")).toBe("reaction");
    });

    it("prefers bonus and reaction over the word 'action' they contain", () => {
        expect(getSpellActionType("1 bonus action")).toBe("bonus");
        expect(getSpellActionType("1 reaction")).toBe("reaction");
    });

    it("treats minutes, hours and missing values as other", () => {
        for (const castingTime of ["1 Min.", "10 Min.", "1 Hr.", "24 Hr.", "", undefined]) {
            expect(getSpellActionType(castingTime)).toBe("other");
        }
    });
});

describe("matchesSpellActionFilter", () => {
    it("matches everything for the 'all' filter", () => {
        expect(matchesSpellActionFilter("1 Hr.", "all")).toBe(true);
        expect(matchesSpellActionFilter(undefined, "all")).toBe(true);
    });

    it("matches only the spell's own action type", () => {
        expect(matchesSpellActionFilter("Bonus", "bonus")).toBe(true);
        expect(matchesSpellActionFilter("Bonus", "action")).toBe(false);
        expect(matchesSpellActionFilter("Reaction", "reaction")).toBe(true);
        expect(matchesSpellActionFilter("1 Min.", "action")).toBe(false);
    });

    it("offers a filter for every type except 'other'", () => {
        expect(SPELL_ACTION_FILTERS.map((filter) => filter.key)).toEqual(["all", "action", "bonus", "reaction"]);
    });
});
