import { describe, it, expect } from "vitest";
import { formatEquationTerm, formatSigned } from "./statLine";

describe("formatSigned", () => {
    it("prefixes non-negative numbers with +", () => {
        expect(formatSigned(2)).toBe("+2");
        expect(formatSigned(0)).toBe("+0");
    });

    it("keeps the minus sign on negative numbers", () => {
        expect(formatSigned(-1)).toBe("-1");
    });
});

describe("formatEquationTerm", () => {
    it("formats a term with a spaced sign for use inside an equation", () => {
        expect(formatEquationTerm(2)).toBe("+ 2");
        expect(formatEquationTerm(0)).toBe("+ 0");
        expect(formatEquationTerm(-3)).toBe("- 3");
    });

    it("never doubles the sign", () => {
        expect(`8 ${formatEquationTerm(2)} = 10`).toBe("8 + 2 = 10");
        expect(`8 ${formatEquationTerm(-3)} = 5`).toBe("8 - 3 = 5");
    });
});
