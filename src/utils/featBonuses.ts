import { Feat } from "@/interfaces/Feat";

/**
 * Flat bonuses a character's feats add to derived stats that the sheet
 * computes live (speed, initiative, max HP, passive scores) - kept in their
 * own dependency-free module so the stat calculators (calculateMaxHp.ts,
 * statBreakdowns.ts, ...) can use them without importing all of utils/feats.ts.
 * Each returns one entry per contributing feat, for tooltip lines.
 */
/** Flat numbers the sheet adds live (not baked into the saved character). */
export interface FeatStatBonus {
    featName: string;
    value: number;
}

export function getFeatSpeedBonuses(feats: Feat[]): FeatStatBonus[] {
    return feats.filter((feat) => feat.mechanics?.speedBonus).map((feat) => ({ featName: feat.name, value: feat.mechanics!.speedBonus! }));
}

export function getFeatInitiativeBonuses(feats: Feat[], proficiencyBonus: number): FeatStatBonus[] {
    return feats
        .map((feat) => ({
            featName: feat.name,
            value: (feat.mechanics?.initiativeBonus ?? 0) + (feat.mechanics?.initiativeProficiency ? proficiencyBonus : 0),
        }))
        .filter((bonus) => bonus.value !== 0);
}

export function getFeatHpBonuses(feats: Feat[], characterLevel: number): FeatStatBonus[] {
    return feats
        .map((feat) => ({
            featName: feat.name,
            value: (feat.mechanics?.hpPerLevel ?? 0) * characterLevel + (feat.mechanics?.hpFlat ?? 0),
        }))
        .filter((bonus) => bonus.value !== 0);
}

export function getFeatPassiveBonus(feats: Feat[], skill: "perception" | "investigation"): FeatStatBonus[] {
    return feats
        .filter((feat) => feat.mechanics?.passiveBonus?.[skill])
        .map((feat) => ({ featName: feat.name, value: feat.mechanics!.passiveBonus![skill]! }));
}

/** Sum of a bonus list. */
export function totalFeatBonus(bonuses: FeatStatBonus[]): number {
    return bonuses.reduce((total, bonus) => total + bonus.value, 0);
}

/** Medium Armor Master: the best (highest) medium-armor Dex cap any feat grants, or undefined. */
export function getFeatMediumArmorDexCap(feats: Feat[]): { featName: string; cap: number } | undefined {
    return feats
        .filter((feat) => feat.mechanics?.mediumArmorDexCap)
        .map((feat) => ({ featName: feat.name, cap: feat.mechanics!.mediumArmorDexCap! }))
        .sort((a, b) => b.cap - a.cap)[0];
}

/** Dragon Hide: the best unarmored base AC (base + Dex) any feat grants, or undefined. */
export function getFeatUnarmoredBaseAc(feats: Feat[]): { featName: string; base: number } | undefined {
    return feats
        .filter((feat) => feat.mechanics?.unarmoredBaseAc)
        .map((feat) => ({ featName: feat.name, base: feat.mechanics!.unarmoredBaseAc! }))
        .sort((a, b) => b.base - a.base)[0];
}

/** Defense-style "+N AC while wearing armor" from feats. */
export function getFeatArmoredAcBonuses(feats: Feat[]): FeatStatBonus[] {
    return feats.filter((feat) => feat.mechanics?.armoredAcBonus).map((feat) => ({ featName: feat.name, value: feat.mechanics!.armoredAcBonus! }));
}
