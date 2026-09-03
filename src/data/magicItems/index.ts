/**
 * Single barrel for every magic item/weapon/armor list. Together these
 * (mostly the auto-generated files under magicItems/generated/) are ~2.7MB
 * of source - the single biggest chunk of compendium data in this app - so
 * this whole subtree is loaded ONLY via a dynamic `import("./magicItems")`
 * in data/index.ts, fetched once on first use rather than bundled into
 * every page. Keep magic item/weapon/armor imports going through this file
 * (not data/index.ts directly) so that split stays intact.
 */
export { MAGIC_ITEMS } from "./MagicItems";
export { MAGIC_WEAPONS } from "./MagicWeapons";
export { MAGIC_ARMOR } from "./MagicArmor";
