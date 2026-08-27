import { Race } from "@/interfaces/Race";

/**
 * Hand-authored, matching the 2014 Human's approach - and for the same
 * reason this file needed creating at all: data/index.ts already imported
 * `Human as Human2024` from this exact path, but the file didn't exist,
 * breaking the build. RACES_2024 (the generated file) has zero "Human"
 * entries of any kind to fall back on, unlike 2014's setting-variant
 * humans, so there was nothing to source this from except the 2024 PHB
 * itself.
 *
 * 2024 species grant no ability score increases (all of those moved to
 * Background - see Background.ts's abilityScoreOptions), hence the empty
 * abilityModifiers.
 */
export const Human: Race = {
    name: "Human",
    edition: "2024",
    traits: [
        "Resourceful: You gain Heroic Inspiration whenever you finish a Long Rest.",
        "Skillful: You gain proficiency in one skill of your choice.",
        "Versatile: You gain an Origin feat of your choice, in addition to the one granted by your background.",
    ],
    abilityModifiers: {},
    speed: 30,
    languages: ["Common"],
    grantedFeatChoice: { category: "origin" },
    grantedSkillChoice: { choose: 1 },
};
