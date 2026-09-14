import type { DdbActions, DdbClassEntry, DdbClassSpellsEntry, DdbGrantedSpellEntry, DdbSpells } from "./types";

/**
 * Every distinct name inside a list of `DdbGrantedSpellEntry` - shared by
 * every reader function below, since all of them are read the same
 * defensive way: skip anything that doesn't have a usable name rather than
 * throwing on it. Checks `definition.name` first (the usual convention),
 * falling back to a top-level `name` (seen on some Actions-tab entries) -
 * see `DdbGrantedSpellEntry`'s header comment.
 */
function namesFrom(entries: DdbGrantedSpellEntry[] | undefined): string[] {
  if (!Array.isArray(entries)) return [];

  const names: string[] = [];
  for (const entry of entries) {
    const name = entry?.definition?.name ?? entry?.name;
    if (typeof name === "string" && name.trim()) names.push(name.trim());
  }
  return names;
}

/**
 * Every distinct spell name D&D Beyond's `classSpells` grouping lists for
 * this character - known and prepared aren't distinguished (this app
 * doesn't track that split, see `interfaces/Characters.ts`'s
 * `spellsKnown`), and every class's entries are pooled together rather than
 * kept separate.
 *
 * Read defensively, the same spirit as `readModifiers.ts`: `classSpells`'
 * exact shape was never confirmed against a live character (see this
 * folder's types.ts), so anything that doesn't look like
 * `{ spells: [{ definition: { name } }] }` is simply skipped rather than
 * thrown on - a schema surprise costs an incomplete spell list, never a
 * crashed import.
 */
export function readKnownSpellNames(classSpells: DdbClassSpellsEntry[] | undefined): string[] {
  if (!Array.isArray(classSpells)) return [];

  const names = new Set<string>();
  for (const entry of classSpells) {
    for (const name of namesFrom(entry?.spells)) names.add(name);
  }

  return Array.from(names);
}

/**
 * Every distinct spell name D&D Beyond's `spells` grouping lists as granted
 * outright (race/feat/item, e.g. a race's innate spellcasting or a feat-
 * granted spell) rather than chosen as part of a class's known/prepared
 * list - see `classSpells`/`readKnownSpellNames` for that instead. Read
 * just as defensively, and for the same reason: this grouping's exact
 * shape was never confirmed against a live character either.
 */
export function readGrantedSpellNames(spells: DdbSpells | undefined): string[] {
  if (!spells || typeof spells !== "object") return [];

  const names = new Set<string>();
  for (const group of [spells.race, spells.class, spells.feat, spells.item]) {
    for (const name of namesFrom(group)) names.add(name);
  }

  return Array.from(names);
}

/**
 * Every distinct spell name found in D&D Beyond's `actions` grouping
 * (class/feat/item/race, same shape as `spells` above) - some innate
 * spellcasting (e.g. a Tiefling's at-will Thaumaturgy) shows up here
 * instead of under `spells`, so this is checked as an independent source
 * rather than assumed to duplicate `readGrantedSpellNames`. Just as
 * defensive, for the same reason: this grouping's exact shape was never
 * confirmed against a live character either.
 */
export function readActionSpellNames(actions: DdbActions | undefined): string[] {
  if (!actions || typeof actions !== "object") return [];

  const names = new Set<string>();
  for (const group of [actions.class, actions.feat, actions.item, actions.race]) {
    for (const name of namesFrom(group)) names.add(name);
  }

  return Array.from(names);
}

/**
 * Every distinct spell name embedded directly on a class entry or its
 * subclass definition (e.g. a Cleric domain's or Warlock patron's bonus
 * spells listed right on the subclass rather than surfaced through
 * `classSpells`/`spells` at the top level) - see `DdbClassEntry.spells`/
 * `DdbSubclassDefinition.spells`'s header comments. Pools every class's
 * (and its subclass's) entries together, the same "don't keep sources
 * separate" approach `readKnownSpellNames` already takes.
 */
export function readClassEmbeddedSpellNames(classes: DdbClassEntry[] | undefined): string[] {
  if (!Array.isArray(classes)) return [];

  const names = new Set<string>();
  for (const entry of classes) {
    for (const name of namesFrom(entry?.spells)) names.add(name);
    for (const name of namesFrom(entry?.subclassDefinition?.spells)) names.add(name);
  }

  return Array.from(names);
}
