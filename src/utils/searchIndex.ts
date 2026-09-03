import { getRulesetAsync, Ruleset } from "@/data";
import { Edition } from "@/interfaces/Edition";

/** Every Ruleset key that holds a searchable list - i.e. every key except `edition` itself. */
export type SearchableType = Exclude<keyof Ruleset, "edition">;

export interface SearchIndexEntry {
  name: string;
  /** `name.toLowerCase()`, precomputed once here rather than on every keystroke of every search. */
  nameLower: string;
  ruleset: Edition;
  type: SearchableType;
}

const EDITIONS: Edition[] = ["2014", "2024"];

/**
 * Module-level cache for `buildSearchIndexAsync()` - both rulesets, once
 * fetched and walked into ~8-10k flat entries, are static for the life of
 * the app, so there's nothing to gain by re-fetching or re-walking them
 * every time this is called. Caching the in-flight PROMISE (not just the
 * resolved array) also means several callers requesting the index at once
 * (e.g. the nav bar's search box firing on every keystroke before the
 * first fetch resolves) share the one fetch instead of each starting their
 * own.
 */
let cachedIndexPromise: Promise<SearchIndexEntry[]> | null = null;

/**
 * Flat, searchable index of every named item across both rulesets - every
 * race/class/background/feat/subclass/weapon/piece of armor/spell/magic
 * item (plain and magic variants alike), tagged with which edition and
 * which `Ruleset` key it came from. `type` is exactly the key `data/
 * index.ts`'s `getSpecificItem` expects, so an index entry can be resolved
 * straight back to its full record via `getSpecificItem(entry.ruleset,
 * entry.type, entry.name)`.
 *
 * Async - building this means fetching BOTH editions' full compendiums
 * (via `getRulesetAsync`, itself on-demand/cached - see data/index.ts),
 * which is the single biggest chunk of data in the app. Callers should
 * only invoke this once the player actually starts using search (e.g. the
 * nav bar's search box calls this on first keystroke, not on mount) so
 * visiting an ordinary page never pays this cost. Shared by the nav bar's
 * quick search and the `/search` results page so the two stay in sync
 * rather than each re-deriving their own list of "everything". Built (and
 * fetched) once and cached - see `cachedIndexPromise`.
 */
export function buildSearchIndexAsync(): Promise<SearchIndexEntry[]> {
  if (!cachedIndexPromise) {
    cachedIndexPromise = Promise.all(EDITIONS.map((edition) => getRulesetAsync(edition))).then((rulesets) => {
      const entries: SearchIndexEntry[] = [];

      for (const ruleset of rulesets) {
        for (const key of Object.keys(ruleset) as Array<keyof Ruleset>) {
          const value = ruleset[key];
          if (!Array.isArray(value)) continue;

          for (const item of value) {
            entries.push({
              name: item.name,
              nameLower: item.name.toLowerCase(),
              ruleset: ruleset.edition,
              type: key as SearchableType,
            });
          }
        }
      }

      return entries;
    });
  }
  return cachedIndexPromise;
}
