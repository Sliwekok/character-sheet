# Data model

All types live under `src/interfaces`. All static game content lives under
`src/data`. This doc covers both, plus how they connect.

## Editions: 2014 vs. 2024

The app models two parallel D&D 5e rulesets side by side:

```ts
// interfaces/Edition.ts
export type Edition = "2014" | "2024";
```

- **"2014"** — the original 5th Edition Player's Handbook.
- **"2024"** — the revised ("5.5e") Player's Handbook.

Content types that materially differ between editions carry an `edition` field:
`Race`, `CharacterClass`, `Background`, `Feat`, `Subclass`. Content that's
mechanically unchanged between editions is **edition-agnostic and shared** — no
`edition` field, one array serves both rulesets: `Weapon`, `Armor`, `Spell`,
`MagicItem`.

The clearest example of an edition difference the model bakes in: ability score
increases. Under 2014, `Race.abilityModifiers` grants flat bonuses. Under 2024,
species grant none (`abilityModifiers` is left as `{}`) — instead
`Background.abilityScoreOptions` grants a player-chosen `+2/+1` or `+1/+1/+1` split,
and `Background.originFeat` names the Origin feat the background grants.

## Ruleset assembly (`src/data/index.ts`)

Each edition's content is authored as individual files under `src/data/2014/` and
`src/data/2024/` (mirrored folder structure: `races/`, `classes/`, `subclasses/`,
`feats/`, `backgrounds/`, one file per class/subclass family). `src/data/index.ts`
imports all of them plus the shared weapon/armor/spell/magic-item lists and exposes a
single entry point:

```ts
export interface Ruleset {
  edition: Edition;
  races: Race[];
  classes: CharacterClass[];
  backgrounds: Background[];
  feats: Feat[];
  subclasses: Subclass[];
  weapons: Weapon[];   // shared across editions
  armor: Armor[];      // shared across editions
  spells: Spell[];     // shared across editions
  magicItems: MagicItem[]; // shared across editions
}

export function getRuleset(edition: Edition): Ruleset
```

This is called out in the source as **the** intended extension point: *"add new
content by adding a file under `data/2014` or `data/2024` and listing it here, not by
branching on edition elsewhere in the app."* No UI currently calls `getRuleset` —
it's the data layer waiting for the character-creation flow to consume it.

### Content sizes (informal — for orientation)

| Content     | 2014                 | 2024                 |
|-------------|----------------------|-----------------------|
| Classes     | 13 base classes       | 13 base classes (Artificer sourced from *Eberron: Forge of the Artificer*, not an XPHB entry — see that file's header comment) |
| Subclasses  | 13 files, largest ~95 KB (`Cleric.ts`) | 13 files, largest ~85 KB (`Cleric.ts`) |
| Races       | `Races.ts`, ~515 KB   | `Races.ts`, ~69 KB     |
| Feats       | `Feats.ts`, ~143 KB   | `Feats.ts`, ~130 KB    |
| Backgrounds | `Backgrounds.ts`, ~90 KB | `Backgrounds.ts`, ~31 KB |

Weapons, armor, spells, and magic items are single shared files:
`data/weapons/Weapons.ts`, `data/armor/Armor.ts`, `data/spells/Spells.ts` (~565 KB),
`data/magicItems/MagicItems.ts`.

### Unreferenced raw data files

`src/data/backgrounds.json`, `feats.json`, `races.json`, and `spells.json` sit
directly under `src/data/` (not inside `2014/`/`2024/`) and are large (300 KB–900 KB).
Nothing under `src/` imports them — they appear to be raw source dumps (e.g. from
5etools) used at authoring time to generate the `.ts` content files, kept around for
reference/regeneration rather than consumed at runtime. Worth confirming before
deleting them, but they are not part of the app's build output or behavior today.

## The `Character` type (`interfaces/Characters.ts`)

```ts
export type AbilityScores = {
  strength: number; dexterity: number; constitution: number;
  intelligence: number; wisdom: number; charisma: number;
};

export interface CharacterClassLevel {
  class: CharacterClass;
  subclass?: Subclass;
  level: number;
}

export interface Character {
  edition: Edition;
  name: string;
  classes: CharacterClassLevel[];   // multiclass-aware: always an array
  race: Race;
  background: Background;
  feats: Feat[];
  alignment: string;
  abilityScores: AbilityScores;
  skillProficiencies: SkillName[];
  savingThrowProficiencies: (keyof AbilityScores)[];
  equippedArmor?: Armor;
  shield?: Armor;
  weapons: Weapon[];
  currency: Currency;
  initiative: number;
  currentHP: number;
  maxHP: number;
  spellsKnown: Spell[];
  languages: string[];
  magicItems?: MagicItem[];
}

export function getCharacterLevel(character: Character): number
```

Key design points:

- **Multiclassing is a first-class concern.** `classes` is always an array, even for
  a single-class character. Never read `classes[0]` as "the whole story" — use
  `getCharacterLevel()` for total level, and see [calculations.md](./calculations.md)
  for how multiclass spell slots and weapon mastery are derived.
- **Equipped magic items don't get their own type.** A magic longsword or a suit of
  +1 plate is just a `Weapon`/`Armor` with the optional magic-item fields
  (`rarity`, `requiresAttunement`, `magicDescription`, `bonus`) filled in — see below.
  `Character.magicItems` is only for things that are *neither* armor nor a weapon
  (wondrous items, rings, rods, staves, wands, potions, scrolls).

## Content interfaces at a glance

- **`Race`** (`interfaces/Race.ts`) — `traits`, `abilityModifiers` (2014-only, see
  above), `speed`, `languages`; 2024-only optional `grantedFeatChoice` /
  `grantedSkillChoice` for traits like Human's "Versatile"/"Skillful".
- **`CharacterClass`** (`interfaces/CharacterClass.ts`) — `hitDie`, `proficiencies`
  (armor/weapons/tools/saving throws/skill choices), `multiclassProficiencies`
  (a *reduced* subset granted only via multiclassing — `undefined` means "not filled
  in yet", **not** "grants everything"), `primaryAbility`, `casterProgression`
  (`"full" | "half" | "third" | "pact" | "none"`), optional `spellcasting` config,
  `subclassLevel`, and 2024-only `weaponMasteryProgression` (a level→count map).
- **`Subclass`** (`interfaces/Subclass.ts`) — `parentClass` (by name, not by
  reference), `grantedAtLevel`, an ordered `features` list, and an optional
  `casterProgressionOverride` for subclasses that grant spellcasting the base class
  lacks (Eldritch Knight/Arcane Trickster: `"third"` on top of a `"none"` base class).
- **`Background`** (`interfaces/Background.ts`) — `skillProficiencies`, `equipment`,
  2014-only `feature`, 2024-only `abilityScoreOptions`/`originFeat` (see above).
- **`Feat`** (`interfaces/Feat.ts`) — `category`:
  `"origin" | "general" | "fighting-style" | "epic-boon" | "dragonmark" | "dark-gift"`
  (the latter two cover Eberron dragonmarks and Ravenloft Dark Gifts specifically).
- **`Spell`** (`interfaces/Spell.ts`) — edition-agnostic; `level` 0 = cantrip.
- **`Weapon`** (`interfaces/Weapon.ts`) — `properties` (finesse, versatile, thrown,
  etc.), 2024-only `mastery` (`WeaponMasteryProperty`, stored on every weapon
  regardless of edition — harmless under 2014, since nothing reads it there), plus the
  shared magic-item fields below.
- **`Armor`** (`interfaces/Armor.ts`) — `baseAC`, `dexterityModifier` (whether/how
  much Dex applies), `strengthRequirement`, `stealthDisadvantage`, plus the shared
  magic-item fields below. Shields are `category: "shield"` entries in the same list.
- **`MagicItem`** (`interfaces/MagicItem.ts`) — for everything that isn't armor or a
  weapon; `category` covers wondrous items, rings, rods, staves, wands, potions,
  scrolls, ammunition. `AttunementRequirement` is `boolean | string` — a string names
  the restriction verbatim (e.g. `"by a Spellcaster"`), matching how the DMG prints it.

### Shared magic-item fields on `Weapon`/`Armor`

Both `Weapon` and `Armor` carry the same optional trio, set together when the item
represents a magic item rather than mundane equipment:

```ts
rarity?: MagicItemRarity;               // "common" | "uncommon" | ... | "varies"
requiresAttunement?: AttunementRequirement;
magicDescription?: string;
bonus?: number;                          // AC bonus (Armor) / attack+damage bonus (Weapon)
isCustom?: boolean;                      // set by the custom-item factories, see below
```

## Skills

`interfaces/Skill.ts` defines the 18 skill names (unchanged between editions) and a
`SKILL_ABILITIES` lookup mapping each to its governing ability score — e.g.
`Stealth → dexterity`, `Arcana → intelligence`.

## Spell slot tables (`interfaces/SpellSlotsProgression.ts`)

Four hand-authored progression tables, shared by both editions since the underlying
math hasn't changed:

- `fullCasterProgression` — Wizard, Cleric, Druid, Bard, Sorcerer.
- `halfCasterProgression` — Paladin, Ranger; no slots until class level 2.
- `thirdCasterProgression` — Eldritch Knight/Arcane Trickster; no slots until class
  level 3, capped at 4th-level slots even at character level 20. **Flagged in the
  source as not cross-checked against the PHB** (written without web access) — worth
  a spot-check against the book.
- `pactMagicProgression` — Warlock's Pact Magic; a wholly separate pool (all slots at
  the same, climbing, level; recovers on a short rest). See
  [calculations.md](./calculations.md) for how it's combined (or rather, not combined)
  with the others.

## Custom/homebrew content

`interfaces/MagicItem.ts` defines `CustomMagicItemInput`, the input shape for
homebrewing a magic item; the corresponding factory functions live in
`utils/customMagicItems.ts` (see [calculations.md](./calculations.md)). There's no UI
for this yet — it's plumbing for a future "add a custom item" form.
