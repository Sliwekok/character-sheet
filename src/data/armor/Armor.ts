import { Armor } from "@/interfaces/Armor";

/**
 * The full armor table (light/medium/heavy/shield), PHB Chapter 5 (2014) /
 * Chapter 6 (2024) - AC, weight, cost, Dex-modifier rules, strength
 * requirements, and stealth disadvantage are all unchanged between the two
 * editions, so - like Weapons.ts and Spells.ts - this is a single shared
 * list rather than split per-edition. See src/data/index.ts for how both
 * rulesets pull from the same ARMOR array.
 *
 * This is the project's first concrete armor data - previously `Armor`
 * (the interface) existed with zero items behind it and no `armor` field
 * on `Ruleset` at all. Both are filled in as part of this same change.
 */
export const ARMOR: Armor[] = [
    // ---- Light armor (full Dex modifier applies) ----
    {
        name: "Padded",
        category: "light",
        baseAC: 11,
        dexterityModifier: { enabled: true },
        stealthDisadvantage: true,
        weight: 8,
        cost: "5 gp",
    },
    {
        name: "Leather",
        category: "light",
        baseAC: 11,
        dexterityModifier: { enabled: true },
        weight: 10,
        cost: "10 gp",
    },
    {
        name: "Studded Leather",
        category: "light",
        baseAC: 12,
        dexterityModifier: { enabled: true },
        weight: 13,
        cost: "45 gp",
    },

    // ---- Medium armor (Dex modifier applies, capped at +2) ----
    {
        name: "Hide",
        category: "medium",
        baseAC: 12,
        dexterityModifier: { enabled: true, max: 2 },
        weight: 12,
        cost: "10 gp",
    },
    {
        name: "Chain Shirt",
        category: "medium",
        baseAC: 13,
        dexterityModifier: { enabled: true, max: 2 },
        weight: 20,
        cost: "50 gp",
    },
    {
        name: "Scale Mail",
        category: "medium",
        baseAC: 14,
        dexterityModifier: { enabled: true, max: 2 },
        stealthDisadvantage: true,
        weight: 45,
        cost: "50 gp",
    },
    {
        name: "Breastplate",
        category: "medium",
        baseAC: 14,
        dexterityModifier: { enabled: true, max: 2 },
        weight: 20,
        cost: "400 gp",
    },
    {
        name: "Half Plate",
        category: "medium",
        baseAC: 15,
        dexterityModifier: { enabled: true, max: 2 },
        stealthDisadvantage: true,
        weight: 40,
        cost: "750 gp",
    },

    // ---- Heavy armor (no Dex modifier; may require minimum Strength) ----
    {
        name: "Ring Mail",
        category: "heavy",
        baseAC: 14,
        dexterityModifier: { enabled: false },
        stealthDisadvantage: true,
        weight: 40,
        cost: "30 gp",
    },
    {
        name: "Chain Mail",
        category: "heavy",
        baseAC: 16,
        dexterityModifier: { enabled: false },
        strengthRequirement: 13,
        stealthDisadvantage: true,
        weight: 55,
        cost: "75 gp",
    },
    {
        name: "Splint",
        category: "heavy",
        baseAC: 17,
        dexterityModifier: { enabled: false },
        strengthRequirement: 15,
        stealthDisadvantage: true,
        weight: 60,
        cost: "200 gp",
    },
    {
        name: "Plate",
        category: "heavy",
        baseAC: 18,
        dexterityModifier: { enabled: false },
        strengthRequirement: 15,
        stealthDisadvantage: true,
        weight: 65,
        cost: "1500 gp",
    },

    // ---- Shield ----
    // baseAC here is the shield's AC BONUS (+2), not a total - matches how
    // utils/calculateArmorClass.ts adds it on top of worn-armor/unarmored AC.
    {
        name: "Shield",
        category: "shield",
        baseAC: 2,
        weight: 6,
        cost: "10 gp",
    },
];
