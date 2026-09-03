import { getRulesetAsync } from "@/data";
import { Edition } from "@/interfaces/Edition";
import { StoredCharacter } from "@/interfaces/StoredCharacter";
import { CharacterClass } from "@/interfaces/CharacterClass";
import { Subclass } from "@/interfaces/Subclass";
import { AbilityScores } from "@/interfaces/Characters";
import { pickRandom, pickRandomN, randomAbilityScores, rollDie } from "@/utils/dice";
import { randomAlignment, randomCharacterName } from "@/utils/randomNames";
import { classCanUseArmor, classCanUseWeapon } from "@/utils/proficiencyMatch";
import { calculateAbilityModifiers } from "@/utils/abilityModifiers";
import { buildHpHistory, HpClassInput, rollsNeededForClassEntry } from "@/utils/calculateMaxHp";
import { HpMethod } from "@/interfaces/Hp";
import { generateId } from "@/utils/id";
import { randomBackgroundAllocation, sumAbilityScores } from "@/utils/abilityScoreBonuses";
import { getSpellLimits } from "@/utils/spellcasting";
import { Spell } from "@/interfaces/Spell";

/**
 * Everything the "guided random" flow lets a player pin down before the
 * rest is randomized. Every field is optional - `generateRandomCharacter()`
 * called with no overrides at all IS the "all random" mode; "guided" is
 * just this same function with some fields supplied by the player's form.
 */
export interface RandomCharacterOverrides {
    edition?: Edition;
    name?: string;
    /** Level in the (randomly or explicitly chosen) class. Defaults to a random level in [1, 10] - a full random 1-20 spread skews unrealistically high for a "quick sample character" generator. */
    level?: number;
    raceName?: string;
    className?: string;
    alignment?: string;
}

const DEFAULT_MAX_RANDOM_LEVEL = 10;

/** Random level in [1, DEFAULT_MAX_RANDOM_LEVEL] - see RandomCharacterOverrides.level's comment for why this isn't the full 1-20 range. */
function randomLevel(): number {
    return Math.floor(Math.random() * DEFAULT_MAX_RANDOM_LEVEL) + 1;
}

/**
 * Produces a complete, ready-to-save character, filling in anything not
 * specified in `overrides` at random from the chosen edition's ruleset.
 * This is the single implementation behind both random-generation modes
 * described in the "New Character" flow:
 *
 * - "All random" - call with no overrides (or just `{}`); even the edition
 *   is randomized.
 * - "Guided random" - call with whatever the player filled in on the
 *   basics form (name/level/race/class/alignment); everything else -
 *   ability scores, subclass (if the level qualifies), background, skill
 *   choices, starting armor/weapons, and any basic left blank - is random.
 *
 * Async - fetches the chosen (or randomly picked) edition's compendium via
 * `getRulesetAsync` rather than having it already loaded, since that data
 * is no longer bundled/loaded eagerly (see data/index.ts). Cached there
 * per edition, so a "Reroll" click after the first generate resolves
 * immediately.
 */
export async function generateRandomCharacter(overrides: RandomCharacterOverrides = {}): Promise<StoredCharacter> {
    const edition = overrides.edition ?? pickRandom<Edition>(["2014", "2024"]);
    const ruleset = await getRulesetAsync(edition);

    const race = ruleset.races.find((r) => r.name === overrides.raceName) ?? pickRandom(ruleset.races);
    const characterClass =
        ruleset.classes.find((c) => c.name === overrides.className) ?? pickRandom(ruleset.classes);
    const level = overrides.level && overrides.level > 0 ? overrides.level : randomLevel();

    const eligibleSubclasses = ruleset.subclasses.filter((s) => s.parentClass === characterClass.name);
    const subclass =
        level >= characterClass.subclassLevel && eligibleSubclasses.length > 0
            ? pickRandom(eligibleSubclasses)
            : undefined;

    const background = pickRandom(ruleset.backgrounds);
    // Base rolled scores, then race's flat modifiers (2014) and the
    // background's randomly-allocated bonus (2024) on top - see
    // utils/abilityScoreBonuses.ts. Previously neither was applied at all,
    // so a random character's final scores never actually reflected its
    // race or background.
    const backgroundAbilityBonuses = randomBackgroundAllocation(background);
    const abilityScores = sumAbilityScores(randomAbilityScores(), race.abilityModifiers, backgroundAbilityBonuses);

    // Class-granted skills, minus anything the background already grants (see
    // the same simplification noted in components/character/wizard/SkillsEquipmentStep.tsx -
    // RAW lets you pick a replacement instead of a true duplicate; this generator
    // just avoids picking the duplicate in the first place).
    const classSkillPool = characterClass.proficiencies.skills.from.filter(
        (skill) => !background.skillProficiencies.includes(skill)
    );
    const skillProficiencies = [
        ...background.skillProficiencies,
        ...pickRandomN(classSkillPool, characterClass.proficiencies.skills.choose),
    ];

    const usableArmor = ruleset.armor.filter((a) => a.category !== "shield" && classCanUseArmor(characterClass, a));
    const usableShields = ruleset.armor.filter((a) => a.category === "shield" && classCanUseArmor(characterClass, a));
    const usableWeapons = ruleset.weapons.filter((w) => classCanUseWeapon(characterClass, w));

    // Roughly half the time go armored/shielded/two-weapon-ish rather than always
    // maxing out a randomly-generated character's kit - keeps sample characters varied.
    const equippedArmor = usableArmor.length > 0 && Math.random() > 0.3 ? pickRandom(usableArmor) : undefined;
    const shield = usableShields.length > 0 && Math.random() > 0.5 ? pickRandom(usableShields) : undefined;
    const weapons = usableWeapons.length > 0 ? pickRandomN(usableWeapons, Math.random() > 0.5 ? 2 : 1) : [];

    // `abilityScores` here is already the character's FINAL score (race +
    // background bonus included), same as what SpellsStep/ManualWizard pass
    // to getSpellLimits - needed since a "prepared" caster's cap is an
    // ability-modifier formula, not a flat table.
    const spellsKnown = randomSpellsKnown(ruleset.spells, characterClass, subclass, level, abilityScores);

    // Picked per generated character rather than fixed, purely for variety -
    // a "random character" generator producing every sample with the exact
    // same (average) HP method felt like it wasn't really random at all.
    const hpMethod: HpMethod = pickRandom<HpMethod>(["average", "roll"]);
    const hpRolls =
        hpMethod === "roll"
            ? Array.from({ length: rollsNeededForClassEntry(level, true) }, () => rollDie(characterClass.hitDie))
            : undefined;

    const base: StoredCharacter = {
        id: generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        edition,
        name: overrides.name?.trim() || randomCharacterName(),
        classes: [{ class: characterClass, subclass, level, hpMethod }],
        race,
        background,
        feats: [],
        alignment: overrides.alignment || randomAlignment(),
        abilityScores,
        backgroundAbilityBonuses: Object.keys(backgroundAbilityBonuses).length > 0 ? backgroundAbilityBonuses : undefined,
        skillProficiencies,
        savingThrowProficiencies: characterClass.proficiencies.savingThrows,
        equippedArmor,
        shield,
        weapons,
        currency: { copper: 0, silver: 0, electrum: 0, gold: rollGold(), platinum: 0 },
        initiative: 0,
        currentHP: 0,
        maxHP: 0,
        hpHistory: [],
        spellsKnown,
        languages: [...race.languages],
    };

    base.initiative = calculateAbilityModifiers(base.abilityScores).dexterity;

    const conModifier = calculateAbilityModifiers(base.abilityScores).constitution;
    const hpEntries: HpClassInput[] = [{ hitDie: characterClass.hitDie, level, hpMethod, rolls: hpRolls }];
    base.hpHistory = buildHpHistory(hpEntries, conModifier);
    base.maxHP = base.hpHistory.reduce((total, entry) => total + entry.hpGained, 0);
    base.currentHP = base.maxHP;

    return base;
}

/** Starting gold, standalone-adventurer-style flat roll (5d4 x 10 gp) rather than the full per-class/background starting-equipment tables, which the generator doesn't model yet. */
function rollGold(): number {
    let total = 0;
    for (let i = 0; i < 5; i++) total += Math.floor(Math.random() * 4) + 1;
    return total * 10;
}

/**
 * A random spellcaster's starting `spellsKnown` - empty for a non-caster.
 * Uses the SAME cap system the manual wizard's Spells step enforces
 * (utils/spellcasting.ts's `getSpellLimits`) rather than an independent
 * heuristic, so a randomly generated caster's spell COUNT matches what
 * SpellsStep would actually allow that class/level/ability combination to
 * know, and cantrips/leveled spells are drawn from - and capped against -
 * their own separate pools rather than one mixed bag (RAW never lets a
 * "2 cantrips known" caster end up with, say, 5 cantrips and 0 leveled
 * spells just because a random pick happened to land there).
 *
 * Previously this picked `2 + floor(level / 2)` spells from every
 * available level lumped together, with no cantrip/leveled split and no
 * reference to the class's actual known/prepared cap at all - which is
 * why a randomly generated caster's spell count and level spread didn't
 * line up with what that same class/level/ability combination could
 * actually have.
 */
function randomSpellsKnown(
    spells: Spell[],
    characterClass: CharacterClass,
    subclass: Subclass | undefined,
    level: number,
    abilityScores: AbilityScores
): Spell[] {
    const limits = getSpellLimits([{ characterClass, subclass, level }], abilityScores);
    if (limits.availableLevels.length === 0) return [];

    const pool = spells.filter((spell) => limits.availableLevels.includes(spell.level));
    const cantripPool = pool.filter((spell) => spell.level === 0);
    const leveledPool = pool.filter((spell) => spell.level > 0);

    // pickRandomN clamps internally (never asks for more than the pool
    // has), so this stays correct even if the spell data has fewer spells
    // at a level than the character could otherwise know.
    return [...pickRandomN(cantripPool, limits.maxCantrips), ...pickRandomN(leveledPool, limits.maxLeveled)];
}
