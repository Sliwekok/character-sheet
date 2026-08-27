# Character Design — Gap Analysis (2014 & 2024 editions)

*Read directly from the repo on 2026-08-27. Covers everything related to building/designing a character: the creation flow itself, the data it would draw on, and edition-specific (2014 vs 2024) content coverage.*

## Update, same day: content gaps closed

A follow-up pass filled in most of the *data* gaps this document originally flagged (the UI/wiring gaps below are still open):

- **Armor**: added the full PHB armor table (13 items: 3 light, 5 medium, 4 heavy, shield) as a new shared `src/data/armor/Armor.ts`, plus `armor: Armor[]` on `Ruleset` (didn't exist before).
- **Weapons**: replaced the old 2-weapon `Longsword.ts`/`Shortbow.ts` pair with a full 37-weapon `src/data/weapons/Weapons.ts` (all simple + martial, melee + ranged), each carrying its 2024 Weapon Mastery property.
- **2014 feats**: added the missing epic-boon (29), dragonmark (12), and dark-gift (9) feats — ported from this repo's own 2024 feat data (same underlying Eberron/Ravenloft/DMG content) and re-tagged `edition: "2014"`. "Aberrant Dragonmark" was recategorized from `"general"` to `"dragonmark"`. Phrasing wasn't fully back-converted to 2014 terminology — see the header comment in `2014/feats/Feats.ts`.
- **2024 weapon mastery**: Paladin, Ranger, and Rogue now have `weaponMasteryProgression` (Barbarian and Fighter already had it — the original report's claim that only Fighter had it was wrong, caused by an incomplete file check that session; corrected here).
- **Magic items**: new `interfaces/MagicItem.ts`, magic-item fields added to `Armor`/`Weapon` (`bonus` on Weapon, `rarity`/`requiresAttunement`/`magicDescription`/`isCustom` on both), a 32-item starter `src/data/magicItems/MagicItems.ts`, `Character.magicItems`, and `src/utils/customMagicItems.ts` (`enchantWeapon`, `enchantArmor`, `createCustomWeapon`, `createCustomArmor`, `createCustomMagicItem`) so a future form has real functions to call.
- **Bug found and fixed along the way**: `data/index.ts` imported `Human` from `./2014/races/Human` and `./2024/races/Human` - **neither file existed**. The project could not compile. Both are now authored (2014: flat +1 to all six abilities; 2024: no ability bonus, `grantedFeatChoice`/`grantedSkillChoice` for Skillful/Versatile).
- Deleted the two broken, unused `EldritchKnight.ts` subclass files (already flagged as dead code below - turned out they also didn't type-check, missing a required `features` field).

Still open: no live web source was reachable this session (search was blocked, fetch was restricted to two JS-only pages), so weapon mastery properties, the Paladin/Ranger/Rogue mastery counts, and the 2014 feat ports are from training knowledge / in-repo derivation, not a live cross-check - each is flagged inline in its file. Everything below this point is the original report and is otherwise unchanged.

---

## TL;DR

- **The character-creation flow doesn't exist yet.** `/newCharacter` is a static "check back soon" stub — no race/class/background/ability-score picker, no random generation, nothing.
- **A large, well-modeled data layer for both editions already exists** (races, classes, subclasses, backgrounds, feats, spells) — but **nothing in the app imports it**. `getRuleset()` / `src/data/index.ts` has zero callers in `src/app` or `src/components`.
- **Armor and weapons — two categories the data model itself expects — are essentially empty**: 0 armor items in either edition, only 2 weapons total (shared, not per-edition).
- **No persistence.** `/home` renders two hardcoded mock characters; there's nowhere for a character built through a future creation flow to actually be saved.

---

## 1. Character creation flow — missing entirely

`src/app/newCharacter/page.tsx` is a placeholder Card with a dice emoji and "Check back soon." None of the following exist as components, forms, or state anywhere in the repo:

- Race/species picker (2014 race vs 2024 species selection)
- Class and subclass picker, including subclass-at-level gating (`subclassLevel` on `CharacterClass`)
- Ability score assignment (standard array / point buy / manual roll)
- Background picker — and specifically the **2024 flow**, where the background (not the species) grants the ability score increases (`abilityScoreOptions`) and an origin feat (`originFeat`)
- Skill proficiency choices (`ClassProficiencies.skills.choose`, `Race.grantedSkillChoice`)
- Starting equipment selection — weapons and armor (see §3, both are effectively unpopulated)
- Spell selection for casters (cantrips known, spells known/prepared, ritual casting)
- Feat selection (origin feats, general feats, fighting-style feats, epic boons, and the Eberron/Ravenloft-specific categories)
- Computed sheet output (AC, HP, initiative, spell slots) surfaced back to the player — the calculation utilities exist (`calculateArmorClass`, `calculateMaxHP`, `getSpellSlots`) but have no UI consumer
- Multiclassing UI — `Character.classes` is already modeled as an array of `CharacterClassLevel` and the multiclass spell-slot math exists in `utils/spellcasting.ts`, but there's no way to add a second class through the UI
- The random-generation option the landing page and About page both advertise ("Got idea? → Create it → Upgrade it → Play it" / "roll up a random one")
- Any later "upgrade"/level-up flow

## 2. The data layer is fully disconnected from the app

`src/data/index.ts` exports `getRuleset(edition)`, which is the single intended entry point for "everything a character builder needs to populate its pickers." A repo-wide search turns up **no import of `getRuleset` or `@/data` anywhere under `src/app` or `src/components`.** Even once a creation form exists, it still needs to be wired to this function — right now the two are built independently of each other.

## 3. Content completeness by edition

| Category | 2014 | 2024 | Notes |
|---|---|---|---|
| Races / Species | ~303 raw entries | 51 entries | 2014 pulls in many subrace/sourcebook variants. **2024 data has quality issues**: source tags have leaked into names (`"Elf [XPHB]"`, `"Elf [LFL]"`), and a few entries look like non-D&D crossover/homebrew content (`"Kithkin"`, `"Kithkin; Lorwyn"`, `"Lupin"` — these read like Magic: The Gathering or third-party names, not PHB species) mixed in alongside real ones. Worth an audit pass before these hit a picker. |
| Classes | 13/13 | 13/13 | Both editions include Artificer, which isn't actually in either core PHB — already flagged in the code's own comments as sourced from Eberron material. Not wrong, just worth knowing if you want a "PHB-only" toggle later. |
| Subclasses | 124 total across 13 classes (e.g. Cleric 19, Wizard 13, Fighter 10) | 157 total across 13 classes (e.g. Wizard 18, Warlock 14, Sorcerer 15) | Reasonably populated both sides. **Dead code**: `src/data/2014/subclasses/EldritchKnight.ts` and the 2024 equivalent are duplicate files not imported anywhere (`data/index.ts` only imports `Fighter.ts`, whose own subclass list already includes Eldritch Knight) — safe to delete. |
| Backgrounds | ~100+ entries | 60 entries | All 60 2024 backgrounds correctly carry both `abilityScoreOptions` and `originFeat`, so the data itself is 2024-rules-correct where it exists. |
| Feats | 114 entries, **100% category `"general"`** | 171 entries across all 6 categories (`origin`, `general`, `fighting-style`, `epic-boon`, `dragonmark`, `dark-gift`) | The 2014 side has **zero** epic-boon, dragonmark, or dark-gift feats, even though Epic Boons (2014 DMG), Eberron dragonmarks (2019), and Ravenloft Dark Gifts (2021) all predate the 2024 PHB and are valid 2014-rules content. This looks like a real content gap rather than an edition difference. |
| Spells | ~550, shared between editions | (same list) | `Spell` has no `edition` field, so the same 550 spells serve both rulesets. Several spells changed name, level, or school between the 2014 and 2024 PHBs (e.g. renamed cantrips) — worth spot-checking a sample against the 2024 book, since right now there's no way to represent an edition-specific difference even if you find one. |
| Weapons | 2 total (Longsword, Shortbow), shared | (same 2) | Nowhere near the ~30+ weapons across the simple/martial, melee/ranged tables in either PHB. No unarmed strike entry either. This alone blocks any "choose your starting weapons" step. |
| Armor | **0 items** | **0 items** | `Armor.ts` (the interface) and `Character.equippedArmor` / `Character.shield` exist, but there is no concrete armor data at all, and `data/index.ts`'s `Ruleset` type doesn't even have an `armor` field to hold it. This needs both a data-model addition and actual content. |

## 4. 2024-specific mechanic gaps

`CharacterClass.weaponMasteryProgression` (2024's Weapon Mastery feature) is only filled in for **Fighter**. Per the 2024 PHB, Weapon Mastery is also granted to **Barbarian, Paladin, Ranger, and Rogue** — worth confirming against your book and filling in the other four; right now `getWeaponMasteryCount()` will silently return 0 extra mastery slots for those classes even though they should have some.

## 5. Adjacent housekeeping noticed while reading through

- `src/data/2014/subclasses/EldritchKnight.ts` and `src/data/2024/subclasses/EldritchKnight.ts` are unused duplicate files (see §3).
- Three large raw 5etools JSON dumps sit directly under `src/data/` — `races-5etools.json` (~700 KB), `feats-5etools.json` (~365 KB), `backgrounds-5etools.json` (~865 KB). None are imported by any `.ts`/`.tsx` file; they look like leftover scraping/generation intermediates and are worth moving out of `src/` (or deleting) so they don't risk getting bundled.
- `react-router` / `react-router-dom` (+ their `@types` packages) are installed but unused — the app navigates entirely with `next/link`.
- The nav bar's "Search for wisdom" input has no `onChange`/state — purely decorative right now.
- `DOCS.md` at the repo root was generated on 2026-08-25 and still describes a Human/Fighter/Wizard-only data model with no `Edition`, `Subclass`, `Background`, `Feat`, `Skill`, or `Weapon` interfaces — the repo has grown substantially since (this file you're reading now reflects the current state). Worth regenerating.

## 6. Previously-flagged bugs that are now actually fixed

For anyone cross-referencing against `DOCS.md`, these are resolved and don't need re-fixing:

- `calculateArmorClass` now correctly calls `calculateAbilityModifiers(...)` instead of treating `getModifiers` as a plain object.
- `calculateMaxHP` now runs Constitution through `calculateAbilityModifiers` instead of adding the raw ability score.
- `halfCasterProgression` and `thirdCasterProgression` are now distinct tables (third-caster now correctly caps at 4th-level slots and starts at class level 3).
- The nav bar's SVG icons use JSX-correct `fillRule`/`clipRule`, not the old HTML casing.

## Suggested priority order

1. Build the actual `/newCharacter` flow and wire it to `getRuleset()` — this is the app's entire reason for existing and currently doesn't work at all.
2. Populate `Armor` data and expand `Weapons` well beyond 2 entries — the creation flow needs a real starting-equipment list.
3. Add persistence (local storage at minimum) so a character built through the new flow can actually be kept.
4. Fill the 2024 weapon-mastery gaps (Barbarian/Paladin/Ranger/Rogue) and the 2014 feat-category gaps (epic boons, dragonmarks, dark gifts).
5. Clean up the dead `EldritchKnight.ts` files, the unused `react-router*` deps, and the stray 5etools JSON dumps; regenerate `DOCS.md`.
