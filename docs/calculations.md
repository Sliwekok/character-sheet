# Game-math utilities (`src/utils`)

Every function here is a pure function of a `Character` (or a smaller slice of one) —
no state, no side effects, so they're straightforward to unit test even though no
tests exist yet.

## `abilityModifiers.ts`

```ts
export type AbilityModifiers = { [K in keyof AbilityScores]: number };
export function calculateAbilityModifiers(scores: AbilityScores): AbilityModifiers
```

Standard 5e formula, applied per ability: `floor((score - 10) / 2)`. Every other
calculation in this directory that needs a modifier calls this rather than
re-deriving it.

## `calculateArmorClass.ts`

```ts
export function calculateArmorClass(character: Character): number
```

- No armor equipped → `10 + Dex modifier` (standard unarmored AC).
- Armor equipped → `armor.baseAC`, plus Dex modifier only if
  `armor.dexterityModifier.enabled`, capped at `armor.dexterityModifier.max` when set
  (e.g. medium armor's +2 cap), plus `armor.bonus` if the armor is magic.
- Shield equipped → adds `shield.baseAC` (+ `shield.bonus` if magic) on top.

**Fixed bug, noted in the source comment:** the unarmored branch previously added the
raw Dexterity *score* instead of the *modifier* — e.g. a Dex 16 character would have
gotten `10 + 16 = 26` AC instead of the correct `10 + 3 = 13`. Now fixed; flagged here
in case older character data or downstream assumptions still reflect the old (wrong)
numbers.

## `calculateMaxHp.ts`

```ts
export function calculateMaxHP(character: Character): number
```

RAW (rules-as-written) multiclass HP: the character's *very first* level ever taken
(`classes[0]`) uses that class's full hit die + Con modifier; every level after that —
in any class, whether multiclassed or not — uses that class's own hit-die *average*
(`floor(hitDie / 2) + 1`) + Con modifier. Implemented as a single `reduce` over
`character.classes`, branching only on whether the current entry is index `0`.

**Two fixed bugs, noted in the source comment:**
1. The function previously only handled a single class at all (no multiclass support).
2. Like `calculateArmorClass`, it added the raw Constitution *score* instead of the
   modifier, overstating HP for any character with Constitution above 10.

## `spellcasting.ts`

Three functions covering the two independent spell-slot pools a character can have.

```ts
export function getEffectiveCasterLevel(classes: CharacterClassLevel[]): number
```
RAW multiclass caster level for the **shared** slot table: full casters contribute
their whole class level, half casters (Paladin, Ranger) contribute `floor(level / 2)`,
third casters (Eldritch Knight, Arcane Trickster — always via a subclass's
`casterProgressionOverride`) contribute `floor(level / 3)`. Each class's contribution
is rounded down individually *before* summing — not summed first and rounded once.
Warlock (`"pact"`) and non-casters (`"none"`) contribute nothing here.

```ts
export function getSpellSlots(character: Character): SpellSlots | null
```
Looks up `fullCasterProgression[getEffectiveCasterLevel(character.classes)]`. Works
identically for single-class and multiclass characters, since a single-class
character is just a one-entry `classes` array and the combined-level math degenerates
to that class's own level. Returns `null` if nothing the character has contributes.

```ts
export function getPactMagicSlots(character: Character): SpellSlots | null
```
Warlock's Pact Magic — driven **purely** by Warlock level, looked up in that class's
own `spellcasting.pactMagic` table. Never combined with `getSpellSlots`'s result, even
when multiclassing with another caster class. Returns `null` if the character has no
Warlock levels.

> A character with both Warlock levels and another caster class therefore has *two*
> separate slot pools to track — callers need to call both functions and present them
> separately, not sum them.

## `weaponMastery.ts`

```ts
export function getWeaponMasteryCount(classes: CharacterClassLevel[], edition: Edition): number
```

2024-only mechanic — returns `0` immediately if `edition !== "2024"`. Otherwise, for
each class the character has levels in, finds the highest unlocked threshold in that
class's `weaponMasteryProgression` table (a level→count map, e.g. Fighter 2024's
`{ 1: 3, 4: 4, 10: 5, 16: 6 }`) at or below the character's current level in that
class, and sums the counts across classes.

## `customMagicItems.ts`

Two complementary ways to produce a homebrew magic item, matching how players
actually do this at the table — neither has a UI yet; both are plumbing for a future
"add a magic item" form.

**1. Enchant an existing base item** — start from any `Weapon`/`Armor` (official or
otherwise) and layer magic properties on top:

```ts
export function enchantWeapon(base: Weapon, input: EnchantmentInput): Weapon
export function enchantArmor(base: Armor, input: EnchantmentInput): Armor
```

`EnchantmentInput` takes `bonus`, `rarity`, `requiresAttunement`, `magicDescription`,
and an optional `nameOverride`. Naming defaults to `` `${base.name} +${bonus}` `` when
a `bonus` is given (e.g. "Longsword" → "Longsword +1"), otherwise the base name is
left unchanged (for named artifacts with no numeric bonus). Both spread the base item
and set `isCustom: true`.

**2. Homebrew from scratch** — no mundane base item required:

```ts
export function createCustomWeapon(input: CustomWeaponInput): Weapon
export function createCustomArmor(input: CustomArmorInput): Armor
export function createCustomMagicItem(input: CustomMagicItemInput): MagicItem
```

All three produce a plain `Weapon`/`Armor`/`MagicItem` tagged `isCustom: true` — not a
separate type — so custom items drop straight into `Character.weapons` /
`equippedArmor` / `shield` / `magicItems` with no additional plumbing anywhere else in
the app.

## Known caveats across this directory

These are called out directly in source comments, worth keeping visible rather than
letting them get buried in code:

- **`thirdCasterProgression`** (`interfaces/SpellSlotsProgression.ts`) — the exact
  slot numbers were written from training knowledge, not cross-checked against the
  PHB (web access was unavailable when authored). Spot-check against the book before
  relying on it for anything precision-sensitive.
- **2024 `weaponMasteryProgression` values** (e.g. `data/2024/classes/Fighter.ts`) —
  sourced from 5etools' class table data, not hand-recalled, but likewise not
  cross-checked against a live/official source this session. Same spot-check caveat.
- **2024 weapon `mastery` assignments** (`data/weapons/Weapons.ts`) — from training
  knowledge of the 2024 PHB table, not cross-checked. The file also flags that the
  Lance and Net entries have rules text (mounted-only two-handed use, no-damage
  restrain effect) the current `Weapon` interface can't fully capture — approximated
  rather than silently misrepresented, flagged inline in that file.
- **2014 Human race** (`data/2014/races/Races.ts`) is intentionally hand-authored
  rather than generated from the same pipeline as the rest of that file, because the
  5etools data this project's races were generated from is missing an `ability` field
  for the PHB Human entry entirely — see that file's header comment for detail.
