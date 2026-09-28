import type { Spell, SpellDiceRoll, SpellMechanics } from "@/interfaces/Spell";
import type { CharacterClass, ClassFeature } from "@/interfaces/CharacterClass";
import type { Subclass } from "@/interfaces/Subclass";
import { SPELLS } from "@/data/spells/Spells";

/**
 * Spell-related test builders. Kept separate from characters.ts so several
 * test suites can grow their own builders without editing a shared file.
 */

/** A plain spell with sensible defaults - override only what a test cares about. */
export function makeSpell(overrides: Partial<Spell> = {}): Spell {
  return {
    name: "Test Spell",
    level: 1,
    school: "Evocation",
    description: "A test spell.",
    castingTime: "Action",
    range: "60 feet",
    components: ["V", "S"],
    duration: "Instantaneous",
    ritual: false,
    concentration: false,
    ...overrides,
  };
}

/** A spell of `level` named `name` (handy for prune/limit tests). */
export const spellAt = (level: number, name = `Level ${level} spell`): Spell => makeSpell({ name, level });

/** One real compendium spell by exact name (deep-cloned so tests can't mutate shared data). */
export function compendiumSpell(name: string): Spell {
  const found = SPELLS.find((spell) => spell.name === name);
  if (!found) throw new Error(`fixture: no spell named "${name}"`);
  return structuredClone(found);
}

/** Shortcut for the mechanics block of a real compendium spell. */
export function compendiumMechanics(name: string): SpellMechanics {
  const mechanics = compendiumSpell(name).mechanics;
  if (!mechanics) throw new Error(`fixture: spell "${name}" has no mechanics`);
  return mechanics;
}

export const diceRoll = (dice: string, extra: Partial<SpellDiceRoll> = {}): SpellDiceRoll => ({ dice, ...extra });

/** A minimal synthetic class, for testing feature/grant plumbing without depending on real data. */
export function makeClass(overrides: Partial<CharacterClass> = {}): CharacterClass {
  return {
    name: "Testclass",
    edition: "2024",
    hitDie: 8,
    proficiencies: { armor: [], weapons: [], savingThrows: [], skills: { choose: 0, from: [] } },
    primaryAbility: "intelligence",
    casterProgression: "none",
    subclassLevel: 3,
    features: [],
    ...overrides,
  } as CharacterClass;
}

export function makeSubclass(overrides: Partial<Subclass> = {}): Subclass {
  return {
    name: "Testsubclass",
    parentClass: "Testclass",
    edition: "2024",
    grantedAtLevel: 3,
    features: [],
    ...overrides,
  };
}

export const feature = (name: string, level: number, extra: Partial<ClassFeature> = {}): ClassFeature => ({
  name,
  level,
  description: `${name} description`,
  ...extra,
});
