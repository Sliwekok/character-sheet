# Importing a character from D&D Beyond

D&D Beyond doesn't offer an official "download as JSON" for a character -
just the PDF export on its own character sheet page. It does, however,
have an **unofficial, undocumented** endpoint that its own character sheet
page calls to get the character's data as JSON - the same one community
tools like Beyond20 and ddb-proxy have relied on for years:

```
https://character-service.dndbeyond.com/character/v5/character/<id>
```

**Where this lives in the app:** New character &rarr; Import
(`app/newCharacter/import`) has a "From D&D Beyond" section alongside the
existing file-based import - enter a character id or profile URL, confirm
the character's D&D Beyond sharing is set to **Public** (or "Anyone with
the link" - that endpoint can't see private characters), and it fetches,
converts, and previews the character before you save it, the same as
importing a `.json` file does.

Because the D&D Beyond side is unofficial, the request can't be made
directly from the browser (that endpoint sends no CORS headers), so it
goes through a small server-side proxy route,
`app/api/dndbeyond/[id]/route.ts`, which just forwards the request and
passes back either the character JSON or a plain-language error - it does
nothing else and stores nothing.

The actual conversion logic lives in this folder:

- `types.ts` - partial types for the raw D&D Beyond JSON (only the fields
  actually used - see its header comment for which parts are uncertain).
- `textUtils.ts` - HTML-to-plain-text and name-normalizing helpers.
- `matchCompendium.ts` - finds a D&D Beyond name in this app's own
  compendium arrays (`@/data`).
- `readModifiers.ts` - best-effort reading of D&D Beyond's `modifiers`
  grouping for skill proficiencies and ability-score bonuses (see "Best
  effort" below - this is read defensively and degrades to "found nothing"
  rather than crashing if the shape doesn't match).
- `reconcileAbilityScores.ts` - turns the gap between D&D Beyond's ability
  score totals and this app's into background/ASI allocations - see
  "Ability score bonuses" below.
- `convert.ts` - `convertDndBeyondCharacter()`, the entry point: takes one
  raw D&D Beyond character payload and a resolution ruleset, returns
  either `{ character, warnings, edition }` or `{ error }`. Never throws.

## What imports reliably

- Name, race, background, class(es)/levels/subclass, alignment.
- Ability scores matching D&D Beyond's totals: base scores, this app's own
  racial modifier (2014), plus the background allocation (2024) and
  Ability Score Improvements reconstructed from the difference - see
  "Ability score bonuses" below. Hit points (current/max), currency.
- Equipped weapons, armor, and shield - matched to this app's compendium by
  base item type (e.g. D&D Beyond's "Flame Tongue Greatsword" is matched to
  this app's "Greatsword" and re-enchanted with the magic properties, via
  the same `enchantWeapon`/`enchantArmor` helpers a player would use to
  homebrew a magic item by hand). Equipped rings/wands/potions/other magic
  items, similarly.
- Inspiration, and the flavor text boxes (personality/ideals/bonds/flaws,
  backstory, appearance, allies/organizations, treasure).
- The background's origin feat (2024 rules).

## Ability score bonuses - background allocation and Ability Score Improvements

This app tracks a character's background ability-score allocation (2024)
and every earned Ability Score Improvement as their own bookkeeping
(`backgroundAbilityBonuses`/`abilityScoreImprovements`) *separate* from the
final `abilityScores`, precisely so that opening a character back up for
editing can subtract exactly what was added before letting the player
change it - see `utils/characterDraft.ts`. The one hard rule: **whatever is
baked into `abilityScores` must be recorded in that bookkeeping, exactly**
(a mismatch is what once let re-editing an imported character double-apply
its bonuses).

D&D Beyond's JSON doesn't say which ASI slot a bonus came from, so the
importer reconstructs the bookkeeping from the *totals*
(`reconcileAbilityScores.ts`):

1. **Target** - what D&D Beyond shows: `stats` + `bonusStats` + every
   ability-score bonus in the `race`/`class`/`background`/`feat` modifier
   groups (items and conditions ignored), capped at 20; `overrideStats`
   wins outright.
2. **Displayed** - what this app shows without background/ASIs: base +
   this app's own race bonus (an overridden ability is exactly the
   override).
3. **Missing** = target - displayed, per ability (never negative).
4. The missing points are handed out as legal allocations only: first the
   2024 background (+2/+1 or +1/+1/+1 within its listed abilities - D&D
   Beyond's own `background` group is tried first so attribution matches),
   then each ASI slot in order (every slot takes exactly 2 points: +2 to
   the ability missing the most, else +1/+1). Every background option is
   tried and the one that places the most points wins.
5. Only what was recorded is added to the final scores. Anything else is
   reported on the Import preview:
   - an ASI slot with nothing left to match (probably a feat on D&D
     Beyond) stays unallocated - the Ability Scores step asks for it on
     the next edit;
   - leftover points that can't form a legal allocation (e.g. a
     half-feat's +1) are not applied;
   - abilities where this app shows *more* than D&D Beyond (usually a
     reassigned racial bonus) are flagged.

If `modifiers` can't be read at all, nothing is applied and the old
"allocate these in the Ability Scores step" warnings are shown instead.

## Best effort - double-check these on the sheet

D&D Beyond's public JSON doesn't cleanly expose everything this app wants,
and a couple of things weren't confirmed against a live character during
development (see `types.ts`'s header comment) - these are read
defensively and simply come up empty (with a warning shown on the preview
screen) if the shape turns out to differ from what's expected:

- **Skill proficiencies** - read from D&D Beyond's `modifiers` data if
  present; empty if it can't be read.
- **Languages known** and **spells known/prepared** - not populated; add
  them on the sheet (worth doing for every caster you import).
- **Feats taken beyond the background's origin feat** (e.g. a level-up
  Ability Score Improvement choice) - not populated.
- **HP roll history, weapon mastery choices, fighting style choices,
  feature choices** (e.g. a Warlock's Pact Boon, or their Eldritch
  Invocations - a multi-select `FeatureChoice`, same as any other) - this
  app tracks these as bookkeeping for its own wizard; an imported character
  simply starts without them, the same as any character saved before these
  features existed (the app already handles that gracefully everywhere it
  matters). Opening an imported Warlock for editing will prompt for their
  Eldritch Invocations on the Class step exactly like a freshly-created one
  would.
- Homebrew races/classes/backgrounds/subclasses, or ones from a sourcebook
  this app hasn't built, aren't supported - the import fails outright with
  a clear error naming what wasn't found, shown on the Import page, rather
  than guessing.
