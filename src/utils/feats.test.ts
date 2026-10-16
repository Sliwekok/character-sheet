import { describe, expect, it } from "vitest";
import { FEATS as FEATS_2024 } from "@/data/2024";
import { FEATS as FEATS_2014 } from "@/data/2014";
import { RACES_2024 } from "@/data/2024/races/Races";
import { BACKGROUNDS_2024 } from "@/data/2024/backgrounds/Backgrounds";
import { RACES_2014 } from "@/data/2014/races/Races";
import { Fighter as Fighter2024 } from "@/data/2024/classes/Fighter";
import { Wizard as Wizard2024 } from "@/data/2024/classes/Wizard";
import { SPELLS } from "@/data/spells/Spells";
import SPELL_CLASS_LISTS from "@/data/spellClassLists.json";
import { CharacterDraft } from "@/interfaces/CharacterDraft";
import { Feat, FeatSelection } from "@/interfaces/Feat";
import { createEmptyDraft, draftFromCharacter, finalizeDraft, isDraftReadyToFinalize } from "@/utils/characterDraft";
import { getFeatureChoices } from "@/utils/grantedSpells";
import {
    areDraftFeatSlotsComplete,
    checkFeatPrerequisites,
    computeFeatAbilityBonuses,
    featContextForDraft,
    featSelectionsFromCharacter,
    findFeatByName,
    getFeatChoiceRequirements,
    getFeatSlots,
    getFeatSpellSources,
    getRaceFeatGrant,
    resolveFeatSelections,
    resolveOriginFeat,
    updateFeatChoice,
} from "@/utils/feats";
import { getInitiativeBreakdown, getSpeedBreakdown, getAbilityScoreBreakdown } from "@/utils/statBreakdowns";
import { getMaxHpBreakdown } from "@/utils/calculateMaxHp";
import { skillModifier } from "@/utils/characterSheetHelpers";
import { calculateAbilityModifiers } from "@/utils/abilityModifiers";

const spellClassLists = SPELL_CLASS_LISTS as Record<string, string[]>;
const ruleset2024 = { feats: FEATS_2024, spells: SPELLS, spellClassLists };

function feat2024(name: string): Feat {
    const feat = findFeatByName(FEATS_2024, name);
    if (!feat) throw new Error(`no 2024 feat ${name}`);
    return feat;
}

function byName<T extends { name: string }>(list: T[], name: string): T {
    const found = list.find((entry) => entry.name === name);
    if (!found) throw new Error(`no ${name}`);
    return structuredClone(found);
}

/** A ready-to-save 2024 Human Fighter 4 with a Criminal background (Origin feat: Alert). */
function fighterDraft(extra: Partial<CharacterDraft> = {}): CharacterDraft {
    const draft = createEmptyDraft("2024");
    draft.race = byName(RACES_2024, "Human");
    draft.background = byName(BACKGROUNDS_2024, "Criminal");
    draft.classes = [{ characterClass: Fighter2024, level: 4, hpMethod: "average" }];
    draft.abilityScores = { method: "manual", scores: { strength: 15, dexterity: 14, constitution: 13, intelligence: 12, wisdom: 10, charisma: 8 }, unassignedPool: [] };
    const options = draft.background.abilityScoreOptions!;
    draft.backgroundAbilityBonuses = { [options.from[0]]: 2, [options.from[1]]: 1 };
    draft.name = "Feat Tester";
    draft.alignment = "Neutral";
    for (const choice of getFeatureChoices(draft.classes)) {
        draft.featureChoices[choice.key] = choice.choice.options[0].id;
    }
    return { ...draft, ...extra };
}

function withSelections(draft: CharacterDraft, selections: FeatSelection[]): CharacterDraft {
    const featSelections = Object.fromEntries(selections.map((selection) => [selection.slot, selection]));
    const feats = selections.map((selection) => feat2024(selection.featName));
    return { ...draft, featSelections, feats };
}

describe("feat mechanics data", () => {
    it("attaches mechanics to (almost) every feat in both editions", () => {
        const missing2024 = FEATS_2024.filter((feat) => !feat.mechanics).map((feat) => feat.name);
        const missing2014 = FEATS_2014.filter((feat) => !feat.mechanics).map((feat) => feat.name);
        expect(missing2024).toEqual([]);
        expect(missing2014).toEqual([]);
    });

    it("includes the newer 5e.tools feats (AU source)", () => {
        expect(feat2024("Abjuration Adept").mechanics?.source).toBe("AU");
        expect(feat2024("Familiar Friend").category).toBe("origin");
    });

    it("encodes Bomber's fixed +1 Dexterity", () => {
        expect(feat2024("Bomber").mechanics?.abilityIncrease).toEqual({ max: 20, fixed: { dexterity: 1 } });
        expect(computeFeatAbilityBonuses(feat2024("Bomber"))).toEqual({ dexterity: 1 });
    });

    it("has curated flat bonuses", () => {
        expect(feat2024("Tough").mechanics?.hpPerLevel).toBe(2);
        expect(feat2024("Alert").mechanics?.initiativeProficiency).toBe(true);
        expect(feat2024("Speedy").mechanics?.speedBonus).toBe(10);
        expect(findFeatByName(FEATS_2014, "Alert")?.mechanics?.initiativeBonus).toBe(5);
        expect(findFeatByName(FEATS_2014, "Mobile")?.mechanics?.speedBonus).toBe(10);
    });

    it("only references spells that exist in the compendium (one AU spell excepted)", () => {
        const names = new Set(SPELLS.map((spell) => spell.name));
        const unknown = new Set<string>();
        for (const feat of [...FEATS_2014, ...FEATS_2024]) {
            for (const option of feat.mechanics?.spellOptions ?? []) {
                for (const grant of option.grants) if (grant.spell && !names.has(grant.spell)) unknown.add(grant.spell);
            }
        }
        expect([...unknown]).toEqual(["Battle Familiar"]);
    });
});

describe("slots", () => {
    it("resolves free-text origin feats", () => {
        expect(resolveOriginFeat({ ...byName(BACKGROUNDS_2024, "Criminal") }, FEATS_2024)).toEqual({ featName: "Alert" });
        expect(resolveOriginFeat({ ...byName(BACKGROUNDS_2024, "Criminal"), originFeat: "Magic initiate; cleric" }, FEATS_2024)?.featName).toBe(
            "Magic Initiate; Cleric"
        );
        expect(resolveOriginFeat({ ...byName(BACKGROUNDS_2024, "Criminal"), originFeat: "Magic Initiate (Wizard)" }, FEATS_2024)?.featName).toBe(
            "Magic Initiate; Wizard"
        );
        expect(
            resolveOriginFeat({ ...byName(BACKGROUNDS_2024, "Criminal"), originFeat: "A Dark Gift feat of your choice (Mist Walker is recommended)" }, FEATS_2024)
        ).toEqual({ categories: ["dark-gift"], recommended: "Mist Walker" });
    });

    it("finds species feats", () => {
        expect(getRaceFeatGrant(byName(RACES_2024, "Human"))).toEqual({ categories: ["origin"] });
        expect(getRaceFeatGrant(byName(RACES_2014, "Human (Variant)"))).toEqual({});
        expect(getRaceFeatGrant(byName(RACES_2014, "Human"))).toBeUndefined();
    });

    it("lists origin, species, ASI-as-feat and bonus slots", () => {
        const draft = fighterDraft({ featSelections: { "asi:0:4": { slot: "asi:0:4", featName: "" }, "bonus:1": { slot: "bonus:1", featName: "" } } });
        const slots = getFeatSlots({ ...draft, feats: FEATS_2024 });
        expect(slots.map((slot) => slot.key)).toEqual(["origin", "species", "asi:0:4", "bonus:1"]);
        expect(slots[0].fixedFeatName).toBe("Alert");
    });

    it("adds an Epic Boon slot at level 19", () => {
        const draft = fighterDraft({ classes: [{ characterClass: Fighter2024, level: 19 }] });
        expect(getFeatSlots({ ...draft, feats: FEATS_2024 }).some((slot) => slot.kind === "epic-boon")).toBe(true);
    });
});

describe("prerequisites", () => {
    it("checks level and ability scores", () => {
        const draft = fighterDraft({ classes: [{ characterClass: Fighter2024, level: 3 }] });
        const ctx = featContextForDraft(draft, ruleset2024, "asi:0:4");
        const check = checkFeatPrerequisites(feat2024("Speedy"), ctx);
        expect(check.met).toBe(false);
        expect(check.unmet).toContain("Level 4");

        const ctx4 = featContextForDraft(fighterDraft(), ruleset2024, "asi:0:4");
        expect(checkFeatPrerequisites(feat2024("Speedy"), ctx4).met).toBe(true);
    });

    it("checks spellcasting", () => {
        const fighter = featContextForDraft(fighterDraft(), ruleset2024, "x");
        expect(checkFeatPrerequisites(feat2024("War Caster"), fighter).met).toBe(false);
        const wizard = featContextForDraft(fighterDraft({ classes: [{ characterClass: Wizard2024, level: 4 }] }), ruleset2024, "x");
        expect(checkFeatPrerequisites(feat2024("War Caster"), wizard).met).toBe(true);
    });
});

describe("choices", () => {
    it("asks Magic Initiate for spell ability and filtered spells", () => {
        const feat = feat2024("Magic Initiate; Wizard");
        const ctx = featContextForDraft(fighterDraft(), ruleset2024, "species");
        const requirements = getFeatChoiceRequirements(feat, {}, ctx);
        expect(requirements.map((r) => r.key)).toEqual(["spellAbility", "spells:0", "spells:1"]);
        const cantrips = requirements.find((r) => r.key === "spells:0")!;
        expect(cantrips.count).toBe(2);
        expect(cantrips.options).toContain("Fire Bolt");
        expect(cantrips.options).not.toContain("Sacred Flame");
        expect(requirements.find((r) => r.key === "spells:1")!.options).toContain("Magic Missile");
    });

    it("resets spell picks when the spell list changes", () => {
        const feat = feat2024("Magic Initiate");
        let selection: FeatSelection = { slot: "species", featName: feat.name };
        selection = updateFeatChoice(feat, selection, "spellOption", ["2"]);
        selection = updateFeatChoice(feat, selection, "spells:0", ["Fire Bolt", "Light"]);
        selection = updateFeatChoice(feat, selection, "spellOption", ["0"]);
        expect(selection.choices).toEqual({ spellOption: ["0"] });
    });

    it("offers only skills the character doesn't have yet", () => {
        const draft = fighterDraft({ skillProficiencies: ["Athletics"] });
        const ctx = featContextForDraft(draft, ruleset2024, "species");
        const skilled = getFeatChoiceRequirements(feat2024("Skilled"), {}, ctx)[0];
        expect(skilled.options).not.toContain("Athletics");
        expect(skilled.options).toContain("Thieves' Tools");
    });
});

describe("finalizeDraft / draftFromCharacter with feats", () => {
    const base = () =>
        withSelections(fighterDraft({ skillProficiencies: ["Athletics", "Perception"] }), [
            { slot: "origin", featName: "Alert" },
            { slot: "species", featName: "Skilled", choices: { skillsOrTools: ["Arcana", "History", "Thieves' Tools"] } },
            { slot: "asi:0:4", featName: "Bomber", abilityBonuses: { dexterity: 1 } },
        ]);

    it("is ready without an ASI allocation for a level taken as a feat", () => {
        const draft = base();
        expect(areDraftFeatSlotsComplete(draft, ruleset2024)).toBe(true);
        expect(isDraftReadyToFinalize(draft)).toBe(true);
    });

    it("is not ready while a feat slot is empty", () => {
        const draft = base();
        draft.featSelections = { ...draft.featSelections, "bonus:1": { slot: "bonus:1", featName: "" } };
        expect(isDraftReadyToFinalize(draft)).toBe(false);
    });

    it("bakes the feat's effects into the saved character", () => {
        const draft = base();
        const character = finalizeDraft(draft)!;
        const backgroundDex = draft.backgroundAbilityBonuses.dexterity ?? 0;
        expect(character.abilityScores.dexterity).toBe(14 + backgroundDex + 1);
        expect(character.skillProficiencies).toEqual(expect.arrayContaining(["Arcana", "History", "Athletics", "Perception"]));
        expect(character.feats.map((feat) => feat.name)).toEqual(["Alert", "Skilled", "Bomber"]);
        // 2024 Alert: initiative + proficiency bonus (+2 at level 4).
        const dexMod = calculateAbilityModifiers(character.abilityScores).dexterity;
        expect(character.initiative).toBe(dexMod + 2);
        expect(getInitiativeBreakdown(character).total).toBe(dexMod + 2);
        expect(character.abilityScoreImprovements).toBeUndefined();
        expect(getAbilityScoreBreakdown(character, "dexterity").lines).toContainEqual({ label: "Bomber feat", value: "+1" });
    });

    it("round-trips through edit without double-counting", () => {
        const first = finalizeDraft(base())!;
        const draft = draftFromCharacter(first);
        expect(draft.abilityScores.scores.dexterity).toBe(14);
        expect(draft.skillProficiencies).toEqual(["Athletics", "Perception"]);
        expect(Object.keys(draft.featSelections).sort()).toEqual(["asi:0:4", "origin", "species"]);
        const second = finalizeDraft(draft)!;
        expect(second.abilityScores).toEqual(first.abilityScores);
        expect(second.skillProficiencies.sort()).toEqual(first.skillProficiencies.sort());
        expect(second.languages).toEqual(first.languages);
    });

    it("applies Tough to max HP and Speedy to speed", () => {
        const draft = withSelections(fighterDraft(), [
            { slot: "origin", featName: "Alert" },
            { slot: "species", featName: "Tough" },
            { slot: "asi:0:4", featName: "Speedy", abilityBonuses: { dexterity: 1 }, choices: { ability: ["dexterity"] } },
        ]);
        const character = finalizeDraft(draft)!;
        const breakdown = getMaxHpBreakdown(character);
        expect(breakdown.lines).toContainEqual({ label: "Tough feat", value: "+8" });
        expect(character.maxHP).toBe(breakdown.total);
        expect(getSpeedBreakdown(character).total).toBe(character.race.speed + 10);
    });

    it("gives Expertise from Skill Expert", () => {
        const draft = withSelections(fighterDraft({ skillProficiencies: ["Athletics", "Perception"] }), [
            { slot: "origin", featName: "Alert" },
            { slot: "species", featName: "Tough" },
            {
                slot: "asi:0:4",
                featName: "Skill Expert",
                abilityBonuses: { strength: 1 },
                choices: { ability: ["strength"], skills: ["Stealth"], expertise: ["Athletics"] },
            },
        ]);
        const character = finalizeDraft(draft)!;
        expect(character.skillExpertise).toEqual(["Athletics"]);
        const mods = calculateAbilityModifiers(character.abilityScores);
        expect(skillModifier(character, "Athletics", mods, 2)).toBe(mods.strength + 4);
        expect(character.skillProficiencies).toContain("Stealth");
    });

    it("migrates feats of a character saved before feat selections existed", () => {
        const character = finalizeDraft(base())!;
        const legacy = { ...character, featSelections: undefined };
        const selections = featSelectionsFromCharacter(legacy);
        expect(selections.origin?.featName).toBe("Alert");
        expect(Object.keys(selections).filter((key) => key.startsWith("bonus:"))).toHaveLength(2);
    });
});

describe("feat spells", () => {
    it("records source, frequency and the chosen ability for feat spells", () => {
        const resolved = resolveFeatSelections(
            [
                {
                    slot: "species",
                    featName: "Magic Initiate; Wizard",
                    choices: { spellAbility: ["intelligence"], "spells:0": ["Fire Bolt", "Light"], "spells:1": ["Shield"] },
                },
                { slot: "asi:0:4", featName: "Fey-Touched", abilityBonuses: { wisdom: 1 }, choices: { ability: ["wisdom"], "spells:1": ["Command"] } },
            ],
            FEATS_2024
        );
        const sources = getFeatSpellSources(resolved);
        expect(sources["Fire Bolt"]).toEqual({ source: "Magic Initiate; Wizard", usage: "known", ability: "intelligence" });
        expect(sources["Shield"]).toMatchObject({ frequency: "1/long rest", ability: "intelligence" });
        // Fey-Touched's spells use the ability it increased ("inherit"), and Misty Step is always granted.
        expect(sources["Misty Step"]).toMatchObject({ source: "Fey-Touched", ability: "wisdom" });
        expect(sources["Command"]).toMatchObject({ ability: "wisdom" });
    });

    it("saves grantedSpellSources on the character", () => {
        const draft = withSelections(fighterDraft(), [
            { slot: "origin", featName: "Alert" },
            {
                slot: "species",
                featName: "Magic Initiate; Wizard",
                choices: { spellAbility: ["intelligence"], "spells:0": ["Fire Bolt", "Light"], "spells:1": ["Shield"] },
            },
            { slot: "asi:0:4", featName: "Bomber", abilityBonuses: { dexterity: 1 } },
        ]);
        const character = finalizeDraft(draft)!;
        expect(Object.keys(character.grantedSpellSources ?? {}).sort()).toEqual(["Fire Bolt", "Light", "Shield"]);
    });
});
