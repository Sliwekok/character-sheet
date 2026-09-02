import { getRuleset, Ruleset } from "@/data";
import { Edition } from "@/interfaces/Edition";

/** Every Ruleset key that holds a searchable list - i.e. every key except `edition` itself. */
export type SearchableType = Exclude<keyof Ruleset, "edition">;

export interface SearchIndexEntry {
  name: string;
  ruleset: Edition;
  type: SearchableType;
}

const EDITIONS: Edition[] = ["2014", "2024"];

/**
 * Flat, searchable index of every named item across both rulesets - every
 * race/class/background/feat/subclass/weapon/piece of armor/spell/magic
 * item (plain and magic variants alike), tagged with which edition and
 * which `Ruleset` key it came from. `type` is exactly the key `data/
 * index.ts`'s `getSpecificItem` expects, so an index entry can be resolved
 * straight back to its full record via `getSpecificItem(entry.ruleset,
 * entry.type, entry.name)`.
 *
 * Shared by the nav bar's quick search and the `/search` results page so
 * the two stay in sync rather than each re-deriving their own list of
 * "everything" from `getRuleset`.
 */
export function buildSearchIndex(): SearchIndexEntry[] {
  const entries: SearchIndexEntry[] = [];

  for (const edition of EDITIONS) {
    const ruleset = getRuleset(edition);

    for (const key of Object.keys(ruleset) as Array<keyof Ruleset>) {
      const value = ruleset[key];
      if (!Array.isArray(value)) continue;

      for (const item of value) {
        entries.push({ name: item.name, ruleset: edition, type: key as SearchableType });
      }
    }
  }

  return entries;
}
