import type { Character, CharacterClassLevel } from "@/interfaces/Characters";
import type { StoredCharacter } from "@/interfaces/StoredCharacter";
import type { CharacterClass } from "@/interfaces/CharacterClass";
import type { Armor } from "@/interfaces/Armor";
import type { Weapon } from "@/interfaces/Weapon";
import type { Edition } from "@/interfaces/Edition";
import { RACES_2024 } from "@/data/2024/races/Races";
import { BACKGROUNDS_2024 } from "@/data/2024/backgrounds/Backgrounds";
import { RACES_2014 } from "@/data/2014/races/Races";
import { BACKGROUNDS_2014 } from "@/data/2014/backgrounds/Backgrounds";
import { Fighter as Fighter2024 } from "@/data/2024/classes/Fighter";
import { Fighter as Fighter2014 } from "@/data/2014/classes/Fighter";
import { ARMOR } from "@/data/armor/Armor";
import { WEAPONS } from "@/data/weapons/Weapons";

/**
 * Test-data builders. They use the app's real compendium entries (classes,
 * races, backgrounds, armor, weapons) so tests exercise the same shapes the
 * wizard produces, and let each test override only what it cares about.
 */

function byName<T extends { name: string }>(list: T[], name: string): T {
  const found = list.find((entry) => entry.name === name);
  if (!found) throw new Error(`fixture: no entry named "${name}"`);
  return structuredClone(found);
}

export const armor = (name: string, extra: Partial<Armor> = {}): Armor => ({ ...byName(ARMOR, name), ...extra });
export const weapon = (name: string, extra: Partial<Weapon> = {}): Weapon => ({ ...byName(WEAPONS, name), ...extra });

export function classLevel(cls: CharacterClass, level: number, extra: Partial<CharacterClassLevel> = {}): CharacterClassLevel {
  return { class: cls, level, ...extra };
}

/**
 * A level-1 human Fighter with 10s across the board. Pass `edition: "2014"`
 * to get the 2014 Fighter/Human/Soldier instead.
 */
export function makeCharacter(overrides: Partial<Character> = {}): Character {
  const edition: Edition = overrides.edition ?? "2024";
  const is2014 = edition === "2014";
  return {
    edition,
    name: "Testy McTestface",
    classes: [classLevel(is2014 ? Fighter2014 : Fighter2024, 1)],
    race: byName(is2014 ? RACES_2014 : RACES_2024, "Human"),
    background: byName(is2014 ? BACKGROUNDS_2014 : BACKGROUNDS_2024, "Soldier"),
    feats: [],
    alignment: "Neutral",
    abilityScores: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
    skillProficiencies: [],
    savingThrowProficiencies: ["strength", "constitution"],
    weapons: [],
    currency: { copper: 0, silver: 0, electrum: 0, gold: 0, platinum: 0 },
    initiative: 0,
    currentHP: 10,
    maxHP: 10,
    spellsKnown: [],
    languages: ["Common"],
    ...overrides,
  };
}

let storedCounter = 0;

/** A `makeCharacter` with the id/timestamps storage and sync need. */
export function makeStoredCharacter(overrides: Partial<StoredCharacter> = {}): StoredCharacter {
  storedCounter += 1;
  const now = new Date().toISOString();
  return {
    ...makeCharacter(overrides),
    id: `char-${storedCounter}`,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}
