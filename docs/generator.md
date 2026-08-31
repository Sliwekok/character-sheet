# Character generator

`/newCharacter` offers two ways to build a character, matching the two entry points
described in [components.md](./components.md) and [data-model.md](./data-model.md):
a manual, step-by-step wizard and a random generator with two sub-modes. Both produce
a `StoredCharacter` and save it the same way (`utils/storage.ts`, `localStorage`) —
see [architecture.md](./architecture.md) for why there's no backend.

## Routes

```
/newCharacter                     mode chooser: "Step-by-step" or "Random"
/newCharacter/manual              the manual wizard
/newCharacter/manual?edit=<id>    the same wizard, pre-filled from a saved character
/newCharacter/random              random generator: "All random" or "Guided random"
```

There's still no dedicated "view a character" page — opening a `CharacterCard` on
`/home` goes straight into `/newCharacter/manual?edit=<id>` (see
[components.md](./components.md)'s `CharacterCard` section).

## The manual wizard (`app/newCharacter/manual`)

`page.tsx` is a thin wrapper that exists only to satisfy Next.js's requirement that
anything reading `useSearchParams()` sit inside a `<Suspense>` boundary; the actual
wizard is `ManualWizard.tsx`.

The step order is fixed and unified across both editions (a deliberate simplification
over branching the step *order* itself by edition — see that file's `canProceed()`
comment):

```
Edition → Race → Class → Background → Ability Scores → Skills & Equipment → Details → Review
```

Ability Scores sits **after** Background (not before it, as in an earlier version of
this wizard) because the 2024 rules need the chosen background's
`abilityScoreOptions` to know what bonus is even available to allocate - see "Ability
scores" below for the bonus picker this unlocks.

State is a single `CharacterDraft` object (`interfaces/CharacterDraft.ts`) held in
`ManualWizard`'s `useState`, updated via one `updateDraft(patch)` function every step
component calls into. Each step is a controlled component under
`components/character/wizard/` - it receives its slice of the draft plus an
`onChange`-style callback, and owns none of the state itself (see
[components.md](./components.md)).

`canProceed(stepIndex, draft)` gates the "Continue" button per step - e.g. step 0
requires `draft.edition`, step 4 (Ability Scores) requires the ability-score pool to
be fully assigned **and** a valid background bonus allocation
(`isValidBackgroundAllocation`, see below). `ruleset` (`getRuleset(draft.edition)`) is
recomputed via `useMemo` whenever the edition changes; an effect alongside it drops
any race/class/background selection that doesn't belong to the new ruleset (also
clearing any background bonus allocation along with the background it belonged to),
so switching edition mid-flow can't leave a 2014 race paired with a 2024 class.

### Step navigation is fully clickable

`StepProgress` (`components/character/wizard/StepProgress.tsx`) renders each step as
a button, not just a passive progress indicator - clicking any step jumps straight to
it via `onSelect`, regardless of `canProceed`. That gating function only controls the
"Continue" button; it has no bearing on manual jumps. This means a step can be
reached before its prerequisites are filled in (e.g. jumping straight to Ability
Scores with no race or background chosen yet). Each step component handles that by
rendering a `PrerequisiteNotice` instead of crashing or showing broken data - a short
message plus a button that jumps to whichever earlier step needs to be finished
first (defined inline in `ManualWizard.tsx`, reused by every gated step).

### Ability scores (`AbilityScoresStep`)

Four methods, selectable at any time (switching always resets that method's state from
scratch via `abilityScoreStateForMethod()` - `utils/characterDraft.ts`):

- **Standard Array** - assign the fixed 15/14/13/12/10/8 set, one value per ability.
- **Point Buy** - 27-point budget, scores 8-15, escalating cost above 13
  (`utils/pointBuy.ts`).
- **Roll** - six 4d6-drop-lowest results (`utils/dice.ts`), assign them the same way as
  Standard Array; a "Reroll all six" button restarts the pool.
- **Manual entry** - type any six numbers directly.

Standard Array and Roll share one mechanic - "place these six numbers, one per
ability" - modeled by `AbilityScoreState.unassignedPool` in `CharacterDraft.ts`.
Assigning a pool value to an ability removes it from the pool and returns whatever
that ability held previously.

**Important:** what this step collects is always the **base** ability scores -
`CharacterDraft.abilityScores` never has race or background bonuses baked in. The
step also renders the race's modifiers and (for a 2024 background with
`abilityScoreOptions`) a bonus-allocation picker, and shows a "final ability scores
(base + race + background)" preview - but the numbers the player types/rolls/buys
stay pure base numbers underneath. This split exists so editing a saved character
can later reconstruct exactly what was originally rolled (see "Editing" below).

#### Race and background bonuses (`utils/abilityScoreBonuses.ts`)

Two separate, edition-specific bonus sources get added on top of the base scores,
and both are combined the same way via one shared utility rather than ad hoc math
in several places:

- **Race (2014 only)** - `Race.abilityModifiers` is a flat, non-player-chosen bonus
  baked into the race data (e.g. Hill Dwarf +2 CON/+1 WIS). 2024 races don't use this
  mechanic (their `abilityModifiers` is always `{}`).
- **Background (2024 only)** - `Background.abilityScoreOptions` describes a
  player-chosen allocation: `{ from: [...abilities], allocation: "2-1" | "1-1-1" }`.
  "2-1" means +2 to one ability and +1 to a different one, both drawn from `from`;
  "1-1-1" means +1 to three different abilities from `from`. `AbilityScoresStep`
  renders this as toggle buttons per eligible ability (mutually exclusive for "2-1",
  capped at three picks for "1-1-1"), tracked in `CharacterDraft.backgroundAbilityBonuses`.
  A 2014 background has no `abilityScoreOptions` at all, so the step shows a short
  note instead of a picker.

`abilityScoreBonuses.ts` exports:

- `sumAbilityScores(base, ...bonusSets)` - adds any number of partial bonus sets onto
  a base `AbilityScores`. Used by `finalizeDraft` (race + background bonuses) and by
  the random generator.
- `subtractAbilityScores(final, ...bonusSets)` - the exact inverse, used by
  `draftFromCharacter` to recover the original base scores from a saved character's
  final ones.
- `isValidBackgroundAllocation(background, bonuses)` - true if `bonuses` is a
  complete, correctly-shaped allocation for that background (empty for a 2014
  background or one with no `abilityScoreOptions`; exactly the "2-1" or "1-1-1" shape
  otherwise, with every chosen ability drawn from `from`). Gates both `canProceed`
  for the Ability Scores step and `isDraftReadyToFinalize`.
- `randomBackgroundAllocation(background)` - picks a random valid allocation, used by
  the random generator (see below).

Before this existed, both the manual wizard and the random generator computed
`abilityScores` as just the raw base roll/buy/entry, with **no** race or background
bonus ever added - every character with a race that has modifiers, or a 2024
background, silently ended up with wrong final ability scores. This is now fixed:
`finalizeDraft` computes `sumAbilityScores(draft.abilityScores.scores,
draft.race.abilityModifiers, draft.backgroundAbilityBonuses)` for the stored
`abilityScores`, and stores the chosen `backgroundAbilityBonuses` alongside it (see
"Editing" below for why).

### Skills & equipment (`SkillsEquipmentStep`)

Skills already granted by the chosen background are excluded from the class's skill
choice list rather than modeling the RAW "pick a replacement instead of a true
duplicate" rule (documented in the component and reused identically by the random
generator). Armor/shield/weapon options are filtered to what the class is actually
proficient with via `utils/proficiencyMatch.ts`, which matches the class's freeform
proficiency strings ("Light armor", "Martial weapons") against `Armor.category`/
`Weapon.category` by substring - noted there as an approximation, not a full
proficiency-string parser.

Clicking any skill/weapon/armor/shield pill both toggles it on the draft (same as
before) and feeds an `ItemDetailPanel` (`components/character/wizard/ItemDetailPanel.tsx`)
docked to the right of the step on wide screens (stacked below it on narrow ones) -
the full `Skill`/`Weapon`/`Armor` data behind whatever was last clicked, rather than
just its short pill label. Armor and shield were converted from `<Select>` dropdowns
to the same pill style as weapons so they, too, have something clickable to open the
panel with; "Unarmored"/"None" pills clear the equipped item and the panel. The
clicked item (`SelectedEquipmentItem`, a small discriminated union) is transient view
state local to `SkillsEquipmentStep` - unlike every other piece of state on this step,
it's never lifted into `CharacterDraft`, since it's not something a saved character
needs to remember.

### Review & save (`ReviewStep`)

Computes a preview via `finalizeDraft(draft)` (`utils/characterDraft.ts`) and shows
it - name, race/class/level, AC, HP, initiative, ability modifiers, background,
skills, equipment, languages - with a Save button. If the draft isn't ready
(`isDraftReadyToFinalize` fails), it shows a message instead of a broken preview
rather than letting `finalizeDraft` return `null` silently.

`finalizeDraft` computes the same derived fields the rest of the app does -
`initiative` from `calculateAbilityModifiers`, `maxHP`/`currentHP` from
`calculateMaxHP` (see [calculations.md](./calculations.md)) - so a generated
character's numbers are computed identically to any other character in the app, not
via separate logic.

## Editing (`draftFromCharacter`)

`?edit=<id>` loads the saved `StoredCharacter` via `loadCharacter(id)`
(`utils/storage.ts`) and converts it back into a `CharacterDraft` via
`draftFromCharacter()`. Saving then upserts by `id` instead of creating a new record -
`utils/storage.ts`'s `saveCharacter()` also pins `createdAt` to whatever was already
stored, since a draft has no memory of the original creation time.

Because a saved `Character.abilityScores` is always the **final** (base + race +
background) score - every other calculation in the app (`calculateAbilityModifiers`,
`calculateArmorClass`, `calculateMaxHP`, `CharacterCard`, ...) expects that -
`draftFromCharacter` has to reverse the bonuses back out to repopulate the Ability
Scores step with base numbers. It does this via
`subtractAbilityScores(character.abilityScores, character.race.abilityModifiers,
character.backgroundAbilityBonuses ?? {})`, and carries the original
`backgroundAbilityBonuses` forward into the draft so the bonus picker reopens with
the same allocation the player originally chose. This is why
`Character.backgroundAbilityBonuses` exists as its own field on the stored character
(`interfaces/Characters.ts`) rather than only ever being baked into `abilityScores` -
without it, re-opening a 2024 character for editing would have no way to tell "what
was the base roll" apart from "what did the background add."

**Characters saved before this fix:** older saved characters have no
`backgroundAbilityBonuses` recorded, so `draftFromCharacter` treats it as `{}` -
meaning any background bonus that was silently missing from their ability scores
stays missing when reopened. `isDraftReadyToFinalize` requires a *valid* allocation
for any 2024 background before the draft can be finalized again, so re-saving such a
character forces the player to allocate the bonus at that point, correcting the
character going forward.

**Known limitation:** the wizard only edits `classes[0]` - a multiclassed character
loaded for editing only shows its first class, and `finalizeDraft` always writes back
a single-entry `classes` array. Editing and re-saving a multiclass character through
this flow currently drops its other classes. Flagged in `draftFromCharacter`'s header
comment; not addressed here since it would need the class/ability/skill steps to
become per-class-entry, a bigger change than this generator makes.

## Random generation (`app/newCharacter/random`)

One function, `generateRandomCharacter(overrides?)` in `utils/randomCharacter.ts`,
backs both modes described in the "New Character" mode chooser:

- **All random** - call with no overrides (`{}`). Even the edition is randomized.
- **Guided random** - a small form (edition, name, level, race, class, alignment, all
  optional) collects `RandomCharacterOverrides`; anything left blank is randomized the
  same way "All random" would fill it.

What gets randomized, and how:

- **Race/class** - `pickRandom()` from the (possibly edition-narrowed) ruleset, unless
  named by an override.
- **Level** - a random level in **[1, 10]**, not the full 1-20 range, so a "quick
  sample character" doesn't skew unrealistically high by default (see
  `DEFAULT_MAX_RANDOM_LEVEL` in that file).
- **Subclass** - picked only if the (random or given) level meets the class's
  `subclassLevel` and it has any subclasses in that ruleset.
- **Ability scores** - `randomAbilityScores()` (`utils/dice.ts`): six 4d6-drop-lowest
  rolls, assigned to abilities in **random** order rather than strategically (e.g.
  toward the class's `primaryAbility`) - an intentional simplification, flagged in
  that function's comment as the place to change if that matters later. The random
  background's bonus (if any) is allocated via `randomBackgroundAllocation()` and,
  like the manual wizard, combined into the final `abilityScores` via
  `sumAbilityScores()` alongside the race's modifiers - a random character's final
  ability scores are never just the raw roll.
- **Skills** - background's automatic skills, plus a random subset of the class's
  skill pool (same background-overlap exclusion as the manual wizard, see above).
- **Armor/shield/weapons** - filtered to what the class is proficient with
  (`proficiencyMatch.ts`), then picked with some randomness in whether armor/shield
  are equipped at all and how many weapons are carried, so generated characters vary
  rather than always maxing out their kit.
- **Name/alignment** - `utils/randomNames.ts`'s small, generic fantasy name-word list
  and the nine-alignment grid, unless given.
- **Gold** - a flat 5d4×10 gp roll (`rollGold()`), not the full per-class/background
  starting-equipment gold tables, which aren't modeled.

The result screen reuses `ReviewStep` exactly as the manual wizard does - it's fed
`draftFromCharacter(generatedCharacter)` - plus a "Reroll" button that calls
`generateRandomCharacter()` again with the same overrides. Save goes through
`finalizeDraft` + `saveCharacter` like every other path, so a saved random character
is indistinguishable in storage from a manually-built one.

## Persistence (`utils/storage.ts`)

Everything lives under one `localStorage` key
(`character-sheet:characters:v1`, versioned so a future breaking change to
`StoredCharacter`'s shape doesn't silently misread old data). `loadCharacters()`,
`loadCharacter(id)`, `saveCharacter(character)` (insert-or-update by `id`), and
`deleteCharacter(id)` (not yet wired to any UI) are the whole API. Every function
no-ops safely outside the browser (SSR/build), and `loadCharacters()` fails soft
(returns `[]`) on corrupt/foreign JSON under that key rather than crashing the
character list.

`/home` (`app/home/page.tsx`) is a client component that loads stored characters in a
`useEffect` (avoiding a server/client hydration mismatch, same reasoning as the
landing page's sketch shuffle - see [architecture.md](./architecture.md)) and maps
them through `toCharacterSummary()`. If storage is empty, it falls back to the
original two hardcoded `MOCK_CHARACTERS` so a first-time visitor doesn't land on a
blank page - those never round-trip through storage and use `mock-`-prefixed ids
specifically so `CharacterCard` (see [components.md](./components.md)) knows not to
treat them as editable.
