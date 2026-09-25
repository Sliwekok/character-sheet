"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Container,
  SectionHeading,
  Tabs,
  Tooltip,
  formatModifier,
  type TabItem,
} from "@/components/ui";
import { StoredCharacter } from "@/interfaces/StoredCharacter";
import { getCharacterLevel } from "@/interfaces/Characters";
import { deleteCharacter, saveCharacter } from "@/utils/storage";
import { useStoredCharacter } from "@/components/auth/useStoredCharacter";
import { useAuth } from "@/components/auth/AuthProvider";
import CharacterLoading from "./loading";
import { getChosenWeaponMasteryIndexes, getWeaponMasteryCount, toggleWeaponMasteryChoice } from "@/utils/weaponMastery";
import { downloadCharacterAsJson } from "@/utils/characterImportExport";
import { getArmorClassBreakdown } from "@/utils/calculateArmorClass";
import { getMaxHpBreakdown } from "@/utils/calculateMaxHp";
import { getInitiativeBreakdown } from "@/utils/statBreakdowns";
import { getSpellcastingInfo, getUnarmedStrikeWeapon } from "@/utils/attackCalculations";
import { getPactMagicSlots, getSpellSlots } from "@/utils/spellcasting";
import { levelLabel } from "@/components/character/wizard/SpellsStep";
import { WeaponEntry } from "@/components/character/WeaponEntry";
import { SpellEntry } from "@/components/character/SpellEntry";
import { SpellSlotsPanel } from "@/components/character/SpellSlotsPanel";
import { SlotPool, adjustExpendedSlots, castableLevels, remainingSlots, useSpellMechanicsLookup } from "@/utils/spellRolls";
import { StatusPanel } from "@/components/character/StatusPanel";
import { SkillsPanel } from "@/components/character/SkillsPanel";
import { AbilityScoresPanel } from "@/components/character/AbilityScoresPanel";
import { FeatureEntry, FeatureLike } from "@/components/character/FeatureEntry";
import { FeatureGroup } from "@/components/character/FeatureGroup";
import { FeatEntry } from "@/components/character/FeatEntry";
import { PdfExportPanel } from "@/components/character/PdfExportPanel";
import { RollHistoryEntry, RollHistoryWidget } from "@/components/character/RollHistoryWidget";
import { Shop } from "@/components/character/Shop";
import { HitPointsEditor } from "@/components/character/HitPointsEditor";
import { ShortRestDialog } from "@/components/character/ShortRestDialog";
import { applyCurrentHp, formatHitDicePools, getHitDicePools, getSheetMaxHp, hitDiceAfterLongRest, spendHitDice } from "@/utils/hitDice";
import { calculateAbilityModifiers } from "@/utils/abilityModifiers";
import { decodeFeatureChoiceSelection, featureChoiceKey, featureChoiceMaxSelections } from "@/utils/grantedSpells";
import { Spell } from "@/interfaces/Spell";
import { ClassFeature } from "@/interfaces/CharacterClass";
import { CharacterDetails } from "@/interfaces/CharacterDetails";
import { MagicItem } from "@/interfaces/MagicItem";
import { GearItem } from "@/interfaces/GearItem";
import { Weapon } from "@/interfaces/Weapon";
import { Armor } from "@/interfaces/Armor";
import { addArmor, getEquippedArmor, getEquippedShield, removeArmor, toggleArmorEquipped } from "@/utils/armor";
import {calculateProficiencyBonus, getProficiencyBonusBreakdown} from "@/utils/calculateProficiencyBonus";
import { DiceRollResult } from "@/utils/dice";
import { generateId } from "@/utils/id";

/** Most roll history entries anyone actually wants to scroll back through - oldest entries fall off past this so the list (and the id it's stored under, if this ever gets persisted) can't grow unbounded over a long session. */
const MAX_ROLL_HISTORY = 50;

/** The character sheet's main content area is one of these five sections at a time - see `TAB_DEFINITIONS` below. */
type SheetTab = "actions" | "spells" | "inventory" | "features" | "background";

/** localStorage key for the Features & Traits tab's "Show locked features" toggle - a per-browser viewing preference, not character data. */
const SHOW_LOCKED_FEATURES_KEY = "characterSheet.showLockedFeatures";

/** Groups spells by level (0 = cantrip) and sorts each group alphabetically - used to render `spellsKnown` as a proper spellbook rather than one flat list. */
function groupSpellsByLevel(spells: Spell[]): [number, Spell[]][] {
  const groups = new Map<number, Spell[]>();
  for (const spell of spells) {
    const group = groups.get(spell.level) ?? [];
    group.push(spell);
    groups.set(spell.level, group);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a - b)
    .map(([level, group]) => [level, [...group].sort((a, b) => a.name.localeCompare(b.name))]);
}

/** " (+1 AC)" / " (+1 attack, +1 damage)" / "" - the parenthetical suffix shown after a carried magic item's name on the Inventory tab, so its AC/attack/damage bonus (already folded into the AC and weapon tooltips - see utils/calculateArmorClass.ts, utils/attackCalculations.ts) is visible at a glance too. */
function magicItemBonusSuffix(item: MagicItem): string {
  const bonuses = item.bonuses;
  if (!bonuses) return "";
  const parts: string[] = [];
  if (bonuses.armorClass) parts.push(`${formatModifier(bonuses.armorClass)} AC`);
  if (bonuses.attackRolls) parts.push(`${formatModifier(bonuses.attackRolls)} attack`);
  if (bonuses.damageRolls) parts.push(`${formatModifier(bonuses.damageRolls)} damage`);
  return parts.length > 0 ? ` (${parts.join(", ")})` : "";
}

/**
 * One owned armor/shield row on the Inventory tab's Armor section - its
 * category/rarity/attunement pills, magic description if any (mundane
 * armor simply has none of these to show), a "Wear"/"Take Off" toggle (see
 * `handleToggleArmorEquipped` - equipping one unequips whatever else was in
 * that same slot, body armor and shields being independent slots), and a
 * "Remove" control that drops it from the owned list entirely (see
 * `handleRemoveArmor`).
 */
function ArmorEntry({
  armor,
  onToggleEquip,
  onRemove,
}: {
  armor: Armor;
  onToggleEquip: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-(--radius-sm) bg-background-darken/60 px-3 py-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-fontcolor">
            {armor.name}
            {armor.bonus ? ` (${formatModifier(armor.bonus)} AC)` : ""}
          </span>
          <Badge variant="outline">{armor.category}</Badge>
          {armor.equipped ? (
            <Badge variant="muted">Worn</Badge>
          ) : null}
          {armor.rarity && <Badge variant="muted">{armor.rarity}</Badge>}
          {armor.requiresAttunement && <Badge variant="muted">Attunement</Badge>}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={onToggleEquip}
            className="text-xs text-fontcolor-secondary underline-offset-2 hover:text-fontcolor hover:underline cursor-pointer"
          >
            {armor.equipped ? "Take Off" : "Wear"}
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="text-xs text-fontcolor-secondary underline-offset-2 hover:text-fontcolor hover:underline cursor-pointer"
          >
            Remove
          </button>
        </div>
      </div>
      {armor.magicDescription && <p className="mt-1 whitespace-pre-line text-xs">{armor.magicDescription}</p>}
    </div>
  );
}

/**
 * One class entry's base class features plus its subclass's features (if a subclass has been chosen), merged and
 * sorted by the level they're gained at - the order a player would actually earn them in.
 *
 * Characters are stored in localStorage as full snapshots of the class/subclass data at save time (see
 * utils/storage.ts). A character saved before `features` existed on `CharacterClass`/`Subclass` - or from any
 * other older shape - won't have an array there, so this falls back to `[]` instead of crashing on `[...undefined]`.
 *
 * A feature gated behind a `FeatureChoice` (a Pact Boon, a Fighting Style,
 * a Warlock's Eldritch Invocations, etc. - see utils/grantedSpells.ts) is
 * resolved here before display: every chosen option's own `grantedSpells`
 * are merged into the feature's (so FeatureEntry's badge/decoration just
 * works, unaware any choice was involved), and a line naming the pick(s)
 * is appended to the description - one option for an ordinary single-select
 * choice, or several for a multi-select one (see `FeatureChoice
 * .countByLevel`'s header comment), with a note of how many picks are
 * still available if the player hasn't used them all yet. `classIndex` and
 * `featureChoices` are what `featureChoiceKey()` needs to look the pick(s)
 * up - see `CharacterDraft.featureChoices`'s header comment for the key
 * shape.
 */
function combinedFeatures(
  entry: StoredCharacter["classes"][number],
  classIndex: number,
  featureChoices: Record<string, string> | undefined
): FeatureLike[] {
  const { classFeatures, subclassFeatures } = splitFeatures(entry, classIndex, featureChoices);
  return [...classFeatures, ...subclassFeatures].sort(byLevelThenName);
}

function byLevelThenName(a: FeatureLike, b: FeatureLike) {
  return a.level - b.level || a.name.localeCompare(b.name);
}

/**
 * Same resolution as `combinedFeatures`, but keeps the base class's features
 * and the subclass's features apart - the Features & Traits tab renders them
 * under separate, individually collapsible class/subclass headings (see
 * FeatureGroup). Each list is sorted by level, then name.
 */
function splitFeatures(
  entry: StoredCharacter["classes"][number],
  classIndex: number,
  featureChoices: Record<string, string> | undefined
): { classFeatures: FeatureLike[]; subclassFeatures: FeatureLike[] } {
  const classFeatures = Array.isArray(entry.class.features) ? entry.class.features : [];
  const subclassFeatures = Array.isArray(entry.subclass?.features) ? entry.subclass!.features : [];
  const resolve = (list: ClassFeature[]) =>
    [...list].sort(byLevelThenName).map((feature) => resolveFeatureChoice(feature, entry, classIndex, featureChoices));
  return { classFeatures: resolve(classFeatures), subclassFeatures: resolve(subclassFeatures) };
}

/** Applies a feature's `FeatureChoice` pick(s) - see `combinedFeatures`'s header comment. */
function resolveFeatureChoice(
  feature: ClassFeature,
  entry: StoredCharacter["classes"][number],
  classIndex: number,
  featureChoices: Record<string, string> | undefined
): FeatureLike {
  if (!feature.choice) return feature;
  const key = featureChoiceKey(classIndex, feature);
  const selectedIds = decodeFeatureChoiceSelection(featureChoices?.[key]);
  const chosenOptions = feature.choice.options.filter((option) => selectedIds.includes(option.id));
  if (chosenOptions.length === 0) {
    return { ...feature, description: `${feature.description}\n\n(Choice not yet made - edit this character to pick one.)` };
  }
  const chosenLines = chosenOptions
    .map((option) => `${option.label}${option.summary ? ` — ${option.summary}` : ""}`)
    .join("\n");
  const remaining = featureChoiceMaxSelections(feature.choice, entry.level) - chosenOptions.length;
  return {
    ...feature,
    description: `${feature.description}\n\nChosen: ${chosenLines}${
      remaining > 0 ? `\n\n(${remaining} more pick${remaining === 1 ? "" : "s"} available - edit this character to choose.)` : ""
    }`,
    grantedSpells: [...(feature.grantedSpells ?? []), ...chosenOptions.flatMap((option) => option.grantedSpells ?? [])],
  };
}

/**
 * True if `details` has anything worth its own "Character details" card - a
 * character created before CharacterDetails existed, or from the random
 * generator, has no `details` at all (see CharacterDetails.ts), and one
 * from the wizard can still have every field left blank. Inspiration,
 * death saves, conditions, exhaustion, and concentration are deliberately
 * NOT checked here - they always have their own always-visible Status card
 * (see StatusPanel) regardless of whether any flavor text exists, so
 * they're not a reason to show this separate card too.
 */
function hasCharacterDetails(details: CharacterDetails | undefined): boolean {
  if (!details) return false;
  return Boolean(
    details.playerName ||
      details.otherProficienciesNotes ||
      details.featuresAndTraitsNotes ||
      details.backstory ||
      details.alliesAndOrganizations ||
      details.organizationSymbolName ||
      details.additionalFeaturesAndTraits ||
      details.treasure ||
      details.appearanceNotes ||
      (details.appearance && Object.values(details.appearance).some(Boolean)) ||
      (details.flavor && Object.values(details.flavor).some(Boolean))
  );
}

/**
 * Read-only "character sheet" view - everything about a saved character in
 * one place, including spells known, which previously had nowhere to be
 * shown at all (the wizard collected `spellsKnown` but no page ever
 * rendered it - see SpellsStep). Clicking a character on /home lands here
 * now instead of jumping straight into editing (see CharacterCard); this
 * page's "Edit character" button is the new way in.
 *
 * Layout: a wide (`Container size="2xl"`) two-column body below the header
 * stat bar - a narrow, sticky left sidebar (ability scores, skills, status)
 * and a right-hand main column whose content is switched by a D&D
 * Beyond-style tab strip (Actions / Spells / Inventory / Features & Traits /
 * Background - see `SheetTab`/`TAB_DEFINITIONS`) rather than one long
 * vertical stack of every card at once. The Status card (inspiration, death
 * saves, exhaustion, conditions, concentration) deliberately sits LAST in
 * the sidebar and is styled densely - it's meant to be reachable at a
 * glance during play, not the first thing the page shows.
 *
 * Every derived number (ability modifiers, AC, HP, initiative, spellcasting,
 * weapon attack/damage) carries a small info Tooltip explaining how it was
 * computed - see utils/statBreakdowns.ts and utils/attackCalculations.ts -
 * and weapons/spells get "Roll ..." buttons that actually roll the dice
 * (utils/dice.ts) rather than just displaying the numbers. Every one of
 * those rolls (plus skill checks from SkillsPanel) also lands in
 * `rollHistory` via `recordRoll`, feeding the floating RollHistoryWidget
 * rendered at the very end of this component - see its own header comment
 * for why it renders nothing until the first roll and starts collapsed even
 * then.
 */
export default function CharacterDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  // Drives the "Delete character" confirmation alert below - kept separate
  // from `character` so closing it doesn't touch the loaded data.
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Which tab of the main column is showing - "actions" (attacks) is the
  // most immediately useful one mid-combat, so it's the default, same as
  // D&D Beyond's own character sheet.
  const [activeTab, setActiveTab] = useState<SheetTab>("actions");

  // Features & Traits tab: whether features above the character's current
  // level in that class ("Locked") are listed at all. Hidden by default so
  // the tab shows what the character can actually use; remembered per
  // browser (a viewing convenience, not character data - never saved to the
  // character). Read after mount so server and first client render match.
  const [showLockedFeatures, setShowLockedFeatures] = useState(false);
  useEffect(() => {
    try {
      setShowLockedFeatures(window.localStorage.getItem(SHOW_LOCKED_FEATURES_KEY) === "true");
    } catch {
      // Storage unavailable (private mode etc.) - keep the default.
    }
  }, []);
  function toggleShowLockedFeatures() {
    const next = !showLockedFeatures;
    setShowLockedFeatures(next);
    try {
      window.localStorage.setItem(SHOW_LOCKED_FEATURES_KEY, String(next));
    } catch {
      // Ignore - the toggle still works for this visit.
    }
  }

  // Which class/subclass feature groups are collapsed, keyed
  // `${classIndex}:class` / `${classIndex}:subclass` - all expanded by
  // default; see FeatureGroup.
  const [collapsedFeatureGroups, setCollapsedFeatureGroups] = useState<Record<string, boolean>>({});
  function toggleFeatureGroup(key: string) {
    setCollapsedFeatureGroups((current) => ({ ...current, [key]: !current[key] }));
  }

  // Every "Roll ..." button press anywhere on the page (weapons, spells,
  // skills - see the `onRoll` prop threaded into WeaponEntry/SpellEntry/
  // SkillsPanel below), newest first. Feeds the floating RollHistoryWidget,
  // which renders nothing at all while this is empty and otherwise starts
  // collapsed - see that component's header comment.
  const [rollHistory, setRollHistory] = useState<RollHistoryEntry[]>([]);

  // `null` once loaded means "no such character" - kept distinct from the
  // initial `undefined` "still loading" state so the not-found message
  // doesn't flash before storage has even been read. Local first: read
  // straight from localStorage; only if it isn't on this device and the
  // player is signed in is it fetched from the server (skeleton meanwhile) -
  // see useStoredCharacter. Edits below still go through
  // `setCharacter(current => saveCharacter(...))`, which saves locally and
  // queues the upload.
  const [character, setCharacter] = useStoredCharacter(id);
  const { status: authStatus } = useAuth();

  const [showShop, setShowShop] = useState(false);

  // The "Short rest" dialog (how many Hit Dice to spend) - see ShortRestDialog.
  const [showShortRest, setShowShortRest] = useState(false);

  const derived = useMemo(() => {
    if (!character) return null;
    return {
      ac: getArmorClassBreakdown(character),
      hp: getMaxHpBreakdown(character),
      initiative: getInitiativeBreakdown(character),
      spellSlots: getSpellSlots(character),
      pactMagicSlots: getPactMagicSlots(character),
      spellcasting: getSpellcastingInfo(character),
    };
  }, [character]);

  // Resolves each spell's structured roll data (roles, attack/save, dice,
  // upcasting) from the compendium by name - stored `spellsKnown` copies
  // may predate it. Must stay above the early returns below (it's a hook).
  const resolveSpellMechanics = useSpellMechanicsLookup();

  if (character === undefined) {
    return <CharacterLoading />;
  }

  if (character === null) {
    return (
      <Container size="md" className="pb-24">
        <Card>
          <CardContent className="flex flex-col items-start gap-3 text-sm text-fontcolor-secondary">
            <p>No character found with that id - it may have been deleted.</p>
            {authStatus === "anonymous" && (
              <p>If you saved it on another device, sign in to load it from your account.</p>
            )}
            <div className="flex flex-wrap gap-3">
              <Button href="/home">Back to characters</Button>
              {authStatus === "anonymous" && (
                <Button href={`/login?next=${encodeURIComponent(`/character/${id}`)}`} variant="secondary">
                  Sign in
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </Container>
    );
  }

  const { ac, hp, initiative, spellSlots, pactMagicSlots, spellcasting } = derived!;
  const classSummary = character.classes
    .map((entry) => `${entry.class.name}${entry.subclass ? ` (${entry.subclass.name})` : ""} ${entry.level}`)
    .join(", ");
  const spellGroups = groupSpellsByLevel(character.spellsKnown);
  const characterLevel = getCharacterLevel(character);
  const remainingSpellSlots = remainingSlots(spellSlots, character.details?.expendedSpellSlots);
  const remainingPactSlots = remainingSlots(pactMagicSlots, character.details?.expendedPactSlots);
  const slotLevelsOwned = [...Object.keys(remainingSlots(spellSlots, undefined)), ...Object.keys(remainingSlots(pactMagicSlots, undefined))].map(Number);
  const maxSlotLevel = slotLevelsOwned.length > 0 ? Math.max(...slotLevelsOwned) : 0;
  const hasAnySlots = maxSlotLevel > 0;
  const hasPactSlots = Object.keys(remainingSlots(pactMagicSlots, undefined)).length > 0;
  const hitDicePools = getHitDicePools(character);
  const totalSpellCount = character.spellsKnown.length + (character.grantedSpells?.length ?? 0);
  const magicItemCount = character.magicItems?.length ?? 0;
  const gearItemCount = character.inventory?.reduce((total, entry) => total + entry.quantity, 0) ?? 0;
  const armorCount = character.armors?.length ?? 0;
  const featureCount =
    character.classes.reduce(
      (total, entry) =>
        total + combinedFeatures(entry, 0, undefined).filter((feature) => showLockedFeatures || feature.level <= entry.level).length,
      0
    ) +
    character.feats.length;

  const TAB_DEFINITIONS: TabItem<SheetTab>[] = [
    { key: "actions", label: "Actions" },
    { key: "spells", label: "Spells", count: totalSpellCount },
    { key: "inventory", label: "Inventory", count: magicItemCount + gearItemCount + armorCount },
    { key: "features", label: "Features & Traits", count: featureCount },
    { key: "background", label: "Background" },
  ];

  function handleDeleteCharacter() {
    if (!character?.id) return false;
    deleteCharacter(character.id);
    router.push("/home");
  }

  /**
   * Assigns/unassigns one of the character's limited 2024 Weapon Mastery
   * slots to `character.weapons[weaponIndex]` and persists it immediately
   * (see utils/weaponMastery.ts's `toggleWeaponMasteryChoice`, which already
   * enforces the `getWeaponMasteryCount` cap - this never needs to check it
   * itself). Mirrors `loadCharacter`/`setCharacter`'s pattern but adds the
   * write half, since this is the first thing on this page that persists an
   * in-place change rather than only reading what the wizard produced.
   */
  function handleToggleWeaponMastery(weaponIndex: number) {
    setCharacter((current) => {
      if (!current) return current;
      const chosenWeaponMasteryIndexes = toggleWeaponMasteryChoice(current, weaponIndex);
      return saveCharacter({ ...current, chosenWeaponMasteryIndexes });
    });
  }

  /**
   * Merges `patch` into `character.details` and persists it immediately -
   * the single write path behind every control on the Status card
   * (inspiration, exhaustion, death saves, conditions) below, mirroring
   * `handleToggleWeaponMastery`'s "update in place, then `saveCharacter`"
   * pattern. `details` itself may not exist yet (see CharacterDetails.ts),
   * hence spreading over `{}` rather than `current.details` directly.
   */
  function handleUpdateDetails(patch: Partial<CharacterDetails>) {
    setCharacter((current) => {
      if (!current) return current;
      return saveCharacter({ ...current, details: { ...current.details, ...patch } });
    });
  }

  /**
   * Starts (or stops) concentrating on `spellName`, called from a
   * concentration spell's "Concentrate" button (see SpellEntry). Only one
   * spell can be concentrated on at a time, so picking a new one always
   * overwrites whatever was there; clicking the currently-active spell's
   * button again clears it.
   */
  function handleToggleConcentration(spellName: string) {
    setCharacter((current) => {
      if (!current) return current;
      const concentratingOn = current.details?.concentratingOn === spellName ? undefined : spellName;
      return saveCharacter({ ...current, details: { ...current.details, concentratingOn } });
    });
  }

  /**
   * Spends (`delta = 1`) or restores (`delta = -1`) one slot of `level` in
   * the given pool and persists it - the clickable pips on the Spells tab
   * (see SpellSlotsPanel). Only the expended count is stored, clamped to
   * the class-table maximum (see utils/spellRolls.ts's
   * `adjustExpendedSlots`).
   */
  function handleAdjustSlot(pool: SlotPool, level: number, delta: number) {
    setCharacter((current) => {
      if (!current) return current;
      const max = pool === "pact" ? getPactMagicSlots(current) : getSpellSlots(current);
      const patch = adjustExpendedSlots(current.details, pool, level, delta, max);
      return saveCharacter({ ...current, details: { ...current.details, ...patch } });
    });
  }

  /**
   * A spell's "Cast" button (see SpellEntry): spends one slot of
   * `slotLevel`. Pact Magic slots are used first when they match that
   * level, since they come back on a Short rest while regular slots need
   * a Long rest.
   */
  function handleCastSpell(slotLevel: number) {
    const pool: SlotPool = (remainingPactSlots[slotLevel] ?? 0) > 0 ? "pact" : "spell";
    handleAdjustSlot(pool, slotLevel, 1);
  }

  /**
   * Sets current HP from the header's inline editor (see HitPointsEditor) -
   * clamped to 0..max, and clears death saves when coming back from 0 (see
   * utils/hitDice.ts's `applyCurrentHp`).
   */
  function handleSetCurrentHp(nextHp: number) {
    setCharacter((current) => {
      if (!current) return current;
      return saveCharacter({ ...current, ...applyCurrentHp(current, nextHp) });
    });
  }

  /**
   * "Long rest" in the sheet header: HP back to max, every spent spell slot
   * (both pools) comes back, and spent Hit Dice are recovered (half of the
   * total in 2014, all of them in 2024 - see `hitDiceAfterLongRest`).
   */
  function handleLongRest() {
    setCharacter((current) => {
      if (!current) return current;
      const hpPatch = applyCurrentHp(current, getSheetMaxHp(current));
      return saveCharacter({
        ...current,
        ...hpPatch,
        details: {
          ...hpPatch.details,
          expendedSpellSlots: {},
          expendedPactSlots: {},
          expendedHitDice: hitDiceAfterLongRest(current),
        },
      });
    });
  }

  /**
   * Confirming the Short rest dialog: rolls the chosen Hit Dice (each heals
   * its roll + Con modifier, logged to the roll history), then restores
   * Pact Magic slots. Regular spell slots only come back on a Long rest.
   * The dice are rolled here, against the character as rendered, so the
   * result logged and the HP saved are the same roll.
   */
  function handleShortRest(spend: Record<number, number>) {
    setShowShortRest(false);
    if (!character) return;
    const spent = spendHitDice(character, spend);
    if (spent) recordRoll("Short rest - Hit Dice", spent.roll);
    setCharacter((current) => {
      if (!current) return current;
      const hpPatch = spent ? applyCurrentHp(current, current.currentHP + spent.healed) : { currentHP: current.currentHP, details: current.details };
      return saveCharacter({
        ...current,
        ...hpPatch,
        details: {
          ...hpPatch.details,
          expendedPactSlots: {},
          ...(spent ? { expendedHitDice: spent.expendedHitDice } : {}),
        },
      });
    });
  }

  /**
   * Appends one magic item to `character.magicItems` and persists it
   * immediately - the Shop's "Add" callback for its Magic Items browser
   * (see components/character/Shop.tsx), mirroring `handleUpdateDetails`'s
   * "update in place, then `saveCharacter`" pattern.
   */
  function handleAddMagicItem(item: MagicItem) {
    setCharacter((current) => {
      if (!current) return current;
      return saveCharacter({ ...current, magicItems: [...(current.magicItems ?? []), item] });
    });
  }

  /**
   * Appends one magic weapon to `character.weapons` and persists it
   * immediately - the Shop's "Add" callback for its Weapons browser (see
   * components/character/Shop.tsx), mirroring `handleAddMagicItem`.
   */
  function handleAddWeapon(weapon: Weapon) {
    setCharacter((current) => {
      if (!current) return current;
      return saveCharacter({ ...current, weapons: [...current.weapons, weapon] });
    });
  }

  /**
   * Adds one armor/shield (mundane or magic) to `character.armors` and
   * persists it immediately - the Shop's "Add" callback for its Armor
   * browser. Auto-equips it only if that slot (body armor vs. shield) is
   * currently empty, replicating the old "first pick equips" feel while
   * letting the player own more than one - see utils/armor.ts's `addArmor`.
   */
  function handleAddArmor(armor: Armor) {
    setCharacter((current) => {
      if (!current) return current;
      return saveCharacter({ ...current, armors: addArmor(current, armor) });
    });
  }

  /**
   * Toggles whether the armor/shield at `index` in `character.armors` is
   * worn, and persists it immediately - the "Wear"/"Take Off" control on
   * each Inventory tab Armor row. Equipping one unequips whatever else was
   * occupying that same slot (body armor and shields are independent
   * slots) - see utils/armor.ts's `toggleArmorEquipped`.
   */
  function handleToggleArmorEquipped(index: number) {
    setCharacter((current) => {
      if (!current) return current;
      return saveCharacter({ ...current, armors: toggleArmorEquipped(current, index) });
    });
  }

  /**
   * Removes one armor/shield from `character.armors` entirely and persists
   * it immediately - the "Remove" control on each Inventory tab Armor row.
   * Unlike taking it off, there's no getting it back without re-adding it
   * from the Shop.
   */
  function handleRemoveArmor(index: number) {
    setCharacter((current) => {
      if (!current) return current;
      return saveCharacter({ ...current, armors: removeArmor(current, index) });
    });
  }

  /**
   * Adds `quantity` of a mundane gear item to `character.inventory` - the
   * Shop's "Add" callback for its General Gear browser. Stacks onto an
   * existing entry for the same (non-custom) item rather than creating a
   * duplicate row, so clicking "Add" on Rations a second time increments
   * the one "Rations (1 day)" stack instead of listing it twice.
   */
  function handleAddGearItem(item: GearItem, quantity: number) {
    setCharacter((current) => {
      if (!current) return current;
      const inventory = current.inventory ?? [];
      const existingIndex = inventory.findIndex((entry) => entry.item.name === item.name && !item.isCustom);
      const nextInventory =
        existingIndex >= 0
          ? inventory.map((entry, index) =>
              index === existingIndex ? { ...entry, quantity: entry.quantity + quantity } : entry
            )
          : [...inventory, { item, quantity }];
      return saveCharacter({ ...current, inventory: nextInventory });
    });
  }

  /** Removes one gear stack from `character.inventory` - the "Remove" button next to each stack on the Inventory tab. */
  function handleRemoveGearItem(index: number) {
    setCharacter((current) => {
      if (!current) return current;

      const inventory = [...(current.inventory ?? [])];
      const item = inventory[index];

      if (!item) return current;

      if (item.quantity > 1) {
        inventory[index] = {
          ...item,
          quantity: item.quantity - 1,
        };
      } else {
        inventory.splice(index, 1);
      }

      return saveCharacter({
        ...current,
        inventory,
      });
    });
  }

  /**
   * Appends one roll to the shared history (newest first, capped at
   * `MAX_ROLL_HISTORY`) - passed as `onRoll` to every WeaponEntry/SpellEntry/
   * SkillsPanel on the page, so every "Roll ..." button feeds this one log
   * on top of its own existing inline result display. Purely in-memory (not
   * persisted via `saveCharacter`) - a roll log is a table-session thing,
   * not part of the character itself.
   */
  function recordRoll(label: string, result: DiceRollResult) {
    setRollHistory((current) => [{ id: generateId(), label, result, rolledAt: Date.now() }, ...current].slice(0, MAX_ROLL_HISTORY));

    // Forwards the roll to the "Character Sheet -> Roll20 Chat" browser
    // extension, if installed - it listens for this postMessage on the page
    // and relays it into whatever Roll20 tab is open. A no-op with the
    // extension absent (nothing is listening, so the message just goes
    // nowhere). See roll20-chat-extension/README.md for the other half.
    if (typeof window !== "undefined") {
      window.postMessage(
        {
          source: "dnd-character-sheet-roll20-bridge",
          type: "ROLL",
          label,
          result,
          characterName: character?.name,
        },
        window.location.origin
      );
    }
  }

  return (
    <>
      {showDeleteConfirm && (
        <Alert
          modal
          variant="confirm"
          title="Delete this character?"
          onDismiss={() => setShowDeleteConfirm(false)}
          actions={
            <>
              <Button variant="danger" size="sm" onClick={handleDeleteCharacter}>
                Yes, delete
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
            </>
          }
        >
          This will permanently remove <span className="font-semibold text-fontcolor">{character.name}</span> - this
          can&apos;t be undone.
        </Alert>
      )}

      {showShortRest && (
        <ShortRestDialog
          pools={hitDicePools}
          conModifier={calculateAbilityModifiers(character.abilityScores).constitution}
          currentHp={character.currentHP}
          maxHp={hp.total}
          hasPactSlots={hasPactSlots}
          onConfirm={handleShortRest}
          onCancel={() => setShowShortRest(false)}
        />
      )}

      {showShop && (
        <Shop
          character={character}
          onClose={() => setShowShop(false)}
          onAddMagicItem={handleAddMagicItem}
          onAddWeapon={handleAddWeapon}
          onAddArmor={handleAddArmor}
          onAddGearItem={handleAddGearItem}
        />
      )}

      <Container size="2xl" className="pb-24">
        <SectionHeading
          eyebrow="Character sheet"
          title={character.name}
          subtitle={`${character.race.name} ${classSummary} · ${character.edition} rules · Level ${getCharacterLevel(
            character
          )}`}
        />

        <div className="mt-8 flex flex-col gap-6">
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1">
                  <Badge variant="solid">AC {ac.total}</Badge>
                  <Tooltip title="Armor Class" lines={ac.lines} />
                </span>
                <span className="flex items-center gap-1">
                  {/* `hp.total` (the tooltip's own sum), not the stored `character.maxHP` -
                      they agree for anything saved since per-level HP history/the minimum-1-per-level
                      fix, but this keeps a character saved before either existed from showing a
                      badge that disagrees with its own tooltip breakdown. Double-click to edit. */}
                  <HitPointsEditor currentHp={character.currentHP} maxHp={hp.total} onChange={handleSetCurrentHp} />
                  <Tooltip title="Max HP" lines={hp.lines} />
                </span>
                <span className="flex items-center gap-1">
                  <Badge variant="muted">Hit Dice {formatHitDicePools(hitDicePools)}</Badge>
                  <Tooltip
                    title="Hit Dice"
                    lines={hitDicePools.map((pool) => ({ label: `d${pool.hitDie}`, value: `${pool.remaining}/${pool.total} left` }))}
                  />
                </span>
                <span className="flex items-center gap-1">
                  <Badge variant="muted">Initiative {formatModifier(character.initiative)}</Badge>
                  <Tooltip title="Initiative" lines={initiative.lines} />
                </span>
                <span className="flex items-center gap-1">
                  <Badge variant="muted">Proficiency {formatModifier(calculateProficiencyBonus(character))}</Badge>
                  <Tooltip title="Proficiency" lines={getProficiencyBonusBreakdown(character)} />
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1">
                  <Button size="sm" variant="secondary" onClick={() => setShowShortRest(true)}>
                    Short rest
                  </Button>
                  <Tooltip title="Short rest">
                    <p>
                      Choose how many Hit Dice to spend - each heals its roll plus your Constitution modifier. Also
                      restores all spent Pact Magic slots; regular spell slots only come back on a Long rest.
                    </p>
                  </Tooltip>
                </span>
                <span className="flex items-center gap-1">
                  <Button size="sm" variant="secondary" onClick={handleLongRest}>
                    Long rest
                  </Button>
                  <Tooltip title="Long rest">
                    <p>
                      Restores HP to max and every spent spell slot (and Pact Magic slot) to full, and recovers spent Hit
                      Dice ({character.edition === "2024" ? "all of them" : "up to half your total"}).
                    </p>
                  </Tooltip>
                </span>
                <Badge variant="outline">{character.alignment}</Badge>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr] lg:items-start">
            {/* Sidebar - reference stats a player checks constantly. Status is
                deliberately last: it's the least-needed-at-a-glance of the
                three, so it isn't the first thing under the header. */}
            <div className="flex flex-col gap-4 lg:sticky lg:top-24">
              <AbilityScoresPanel character={character} onRoll={recordRoll} />
              <SkillsPanel character={character} onRoll={recordRoll} />
              <StatusPanel character={character} onUpdateDetails={handleUpdateDetails} />
            </div>

            {/* Main column - the tab strip swaps what's shown below it rather
                than stacking every section at once, the way D&D Beyond's own
                character sheet separates Actions/Spells/Inventory/Features. */}
            <div className="flex min-w-0 flex-col gap-4">
              <Tabs tabs={TAB_DEFINITIONS} active={activeTab} onChange={setActiveTab} />

              {activeTab === "actions" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Actions</CardTitle>
                    {getWeaponMasteryCount(character.classes, character.edition) > 0 && (
                      <Badge variant="muted">
                        Mastery {getChosenWeaponMasteryIndexes(character).length}/
                        {getWeaponMasteryCount(character.classes, character.edition)}
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3 text-sm text-fontcolor-secondary">
                    <div className="flex flex-col gap-2">
                      <p className="font-semibold text-fontcolor">Unarmed Strike</p>
                      <WeaponEntry
                        character={character}
                        weapon={getUnarmedStrikeWeapon(character)}
                        index={-1}
                        onRoll={recordRoll}
                      />
                    </div>

                    {character.weapons.length > 0 ? (
                      <div className="flex flex-col gap-2 border-t border-border pt-3">
                        <p className="font-semibold text-fontcolor">Weapons</p>
                        {character.weapons.map((weapon, index) => (
                          <WeaponEntry
                            key={`${weapon.name}-${index}`}
                            character={character}
                            weapon={weapon}
                            index={index}
                            onToggleMastery={handleToggleWeaponMastery}
                            onRoll={recordRoll}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="border-t border-border pt-3">No other weapons - edit this character to add some.</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {activeTab === "spells" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Spells</CardTitle>
                    {character.spellsKnown.length > 0 && (
                      <Badge variant="muted">{character.spellsKnown.length} known</Badge>
                    )}
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4 text-sm text-fontcolor-secondary">
                    {spellcasting && (
                      <p className="flex items-center gap-1 text-xs">
                        Casts as a {spellcasting.className} using {spellcasting.abilityLabel} — Spell attack{" "}
                        {formatModifier(spellcasting.spellAttackBonus)}, Save DC {spellcasting.spellSaveDC}
                        <Tooltip title="Spellcasting" lines={spellcasting.lines} />
                      </p>
                    )}

                    {hasAnySlots && (
                      <div className="border-b border-border pb-3">
                        <SpellSlotsPanel
                          spellSlots={spellSlots}
                          pactMagicSlots={pactMagicSlots}
                          expendedSpellSlots={character.details?.expendedSpellSlots}
                          expendedPactSlots={character.details?.expendedPactSlots}
                          onAdjust={handleAdjustSlot}
                        />
                      </div>
                    )}

                    {spellGroups.length === 0 ? (
                      <p>
                        {character.classes.some(
                          (entry) => entry.class.casterProgression !== "none" || entry.subclass?.casterProgressionOverride
                        )
                          ? "No spells picked yet - edit this character to add some."
                          : "This character doesn't cast spells."}
                      </p>
                    ) : (
                      spellGroups.map(([level, spells]) => (
                        <div key={level} className="flex flex-col gap-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
                            {levelLabel(level)}
                          </p>
                          <div className="flex flex-col gap-2">
                            {spells.map((spell) => (
                              <SpellEntry
                                key={spell.name}
                                spell={spell}
                                mechanics={resolveSpellMechanics(spell)}
                                spellcasting={spellcasting}
                                characterLevel={characterLevel}
                                maxSlotLevel={maxSlotLevel}
                                castableSlotLevels={castableLevels(spell.level, remainingSpellSlots, remainingPactSlots)}
                                onCast={hasAnySlots ? handleCastSpell : undefined}
                                concentratingOn={character.details?.concentratingOn}
                                onToggleConcentration={handleToggleConcentration}
                                onRoll={recordRoll}
                              />
                            ))}
                          </div>
                        </div>
                      ))
                    )}

                    {character.grantedSpells && character.grantedSpells.length > 0 && (
                      <div className="flex flex-col gap-2 border-t border-border pt-3">
                        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-foreground">
                          Granted spells (free)
                          <Badge variant="muted">{character.grantedSpells.length}</Badge>
                        </p>
                        <p className="text-xs">
                          Always known and castable without expending a spell slot, on top of the spells above - see
                          the granting class/subclass feature (under &quot;Features &amp; Traits&quot;) for its own
                          free-cast limit.
                        </p>
                        <div className="flex flex-col gap-2">
                          {character.grantedSpells.map((spell) => (
                            <SpellEntry
                              key={spell.name}
                              spell={spell}
                              mechanics={resolveSpellMechanics(spell)}
                              spellcasting={spellcasting}
                              characterLevel={characterLevel}
                              maxSlotLevel={maxSlotLevel}
                              castableSlotLevels={castableLevels(spell.level, remainingSpellSlots, remainingPactSlots)}
                              onCast={hasAnySlots ? handleCastSpell : undefined}
                              concentratingOn={character.details?.concentratingOn}
                              onToggleConcentration={handleToggleConcentration}
                              onRoll={recordRoll}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {activeTab === "inventory" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Inventory</CardTitle>
                    {armorCount > 0 && <Badge variant="muted">{armorCount} armor{armorCount === 1 ? "" : "s"}</Badge>}
                    {magicItemCount > 0 && <Badge variant="muted">{magicItemCount} magic item{magicItemCount === 1 ? "" : "s"}</Badge>}
                    {gearItemCount > 0 && <Badge variant="muted">{gearItemCount} gear item{gearItemCount === 1 ? "" : "s"}</Badge>}
                    <div onClick={() => setShowShop(true)} className="cursor-pointer flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border-strong text-[16px] font-bold leading-none text-fontcolor-secondary select-none">
                      <span className="relative top-[-1px]">+</span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3 text-sm text-fontcolor-secondary">
                    <div className="flex flex-col gap-2">
                      <p className="font-semibold text-fontcolor">Armor</p>
                      {!getEquippedArmor(character) && !getEquippedShield(character) && (
                        <p>Unarmored.</p>
                      )}
                      {character.armors && character.armors.length > 0 ? (
                        character.armors.map((armor, index) => (
                          <ArmorEntry
                            key={`${armor.name}-${index}`}
                            armor={armor}
                            onToggleEquip={() => handleToggleArmorEquipped(index)}
                            onRemove={() => handleRemoveArmor(index)}
                          />
                        ))
                      ) : (
                        <p>No armor or shields owned yet - add some from the Shop.</p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
                      <span className="font-semibold text-fontcolor">Currency:</span>
                      <Badge variant="muted">{character.currency.gold} gp</Badge>
                      <Badge variant="muted">{character.currency.silver} sp</Badge>
                      <Badge variant="muted">{character.currency.copper} cp</Badge>
                      {character.currency.electrum ? <Badge variant="muted">{character.currency.electrum} ep</Badge> : null}
                      {character.currency.platinum ? <Badge variant="muted">{character.currency.platinum} pp</Badge> : null}
                    </div>

                    <div className="flex flex-col gap-2 border-t border-border pt-3">
                      <p className="font-semibold text-fontcolor">Magic Weapons</p>
                      {character.weapons && character.weapons.length > 0 ? (
                          character.weapons.map((item, index) => (
                              <div key={`${item.name}-${index}`} className="rounded-(--radius-sm) bg-background-darken/60 px-3 py-2">
                                <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-fontcolor">
                                {item.name}
                              </span>
                                  <Badge variant="outline">{item.category}</Badge>
                                  <Badge variant="outline">{item.type}</Badge>
                                  {item.rarity && <Badge variant="muted">{item.rarity}</Badge>}
                                  {item.requiresAttunement && <Badge variant="muted">Attunement</Badge>}
                                  {item.properties && item.properties.map((property) => (
                                      <Badge variant="muted">{property}</Badge>
                                  ))}
                                </div>
                                {item.magicDescription && <p className="mt-1 whitespace-pre-line text-xs">{item.magicDescription}</p>}
                              </div>
                          ))
                      ) : (
                          <p>No magic items yet - edit this character to add some.</p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 border-t border-border pt-3">
                      <p className="font-semibold text-fontcolor">Magic Items</p>
                      {character.magicItems && character.magicItems.length > 0 ? (
                        character.magicItems.map((item, index) => (
                          <div key={`${item.name}-${index}`} className="rounded-(--radius-sm) bg-background-darken/60 px-3 py-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-fontcolor">
                                {item.name}
                                {magicItemBonusSuffix(item)}
                              </span>
                              <Badge variant="outline">{item.category}</Badge>
                              <Badge variant="muted">{item.rarity}</Badge>
                              {item.requiresAttunement && <Badge variant="muted">Attunement</Badge>}
                            </div>
                            {item.description && <p className="mt-1 whitespace-pre-line text-xs">{item.description}</p>}
                          </div>
                        ))
                      ) : (
                        <p>No magic items yet - edit this character to add some.</p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 border-t border-border pt-3">
                      <p className="font-semibold text-fontcolor">General Gear</p>
                      {character.inventory && character.inventory.length > 0 ? (
                        character.inventory.map((entry, index) => (
                          <div
                            key={`${entry.item.name}-${index}`}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-(--radius-sm) bg-background-darken/60 px-3 py-2"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-fontcolor">{entry.item.name}</span>
                              <Badge variant="outline">{entry.item.category}</Badge>
                              <Badge variant="muted">×{entry.quantity}</Badge>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveGearItem(index)}
                              className="text-xs text-fontcolor-secondary underline-offset-2 hover:text-fontcolor hover:underline cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        ))
                      ) : (
                        <p>No general gear yet - use the shop to add some.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === "features" && (
                <div className="flex flex-col gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Class &amp; subclass features</CardTitle>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={toggleShowLockedFeatures}
                        aria-pressed={showLockedFeatures}
                        title="Features gained at higher levels than this character has reached"
                      >
                        {showLockedFeatures ? "Hide locked features" : "Show locked features"}
                      </Button>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-6 text-sm text-fontcolor-secondary">
                      {character.classes.map((entry, index) => {
                        const { classFeatures, subclassFeatures } = splitFeatures(entry, index, character.featureChoices);
                        const subclassPending = !entry.subclass && entry.level < entry.class.subclassLevel;
                        const isReached = (feature: FeatureLike) => feature.level <= entry.level;
                        const visible = (list: FeatureLike[]) => (showLockedFeatures ? list : list.filter(isReached));
                        const hiddenLocked = (list: FeatureLike[]) =>
                          showLockedFeatures ? 0 : list.filter((feature) => !isReached(feature)).length;
                        const renderFeatures = (list: FeatureLike[], emptyText: string) =>
                          list.length === 0 ? (
                            <p className="text-xs italic">{emptyText}</p>
                          ) : (
                            list.map((feature, featureIndex) => (
                              <FeatureEntry
                                key={`${feature.name}-${feature.level}-${featureIndex}`}
                                feature={feature}
                                reached={isReached(feature)}
                                edition={character.edition}
                                classLevel={entry.level}
                              />
                            ))
                          );
                        const shownClassFeatures = visible(classFeatures);
                        const shownSubclassFeatures = visible(subclassFeatures);
                        const classKey = `${index}:class`;
                        const subclassKey = `${index}:subclass`;
                        return (
                          <div key={`${entry.class.name}-${index}`} className="flex flex-col gap-3">
                            <FeatureGroup
                              id={`features-${index}-class`}
                              title={entry.class.name}
                              subtitle={`Level ${entry.level}`}
                              collapsed={Boolean(collapsedFeatureGroups[classKey])}
                              onToggle={() => toggleFeatureGroup(classKey)}
                              featureCount={shownClassFeatures.length}
                              hiddenLockedCount={hiddenLocked(classFeatures)}
                            >
                              {renderFeatures(
                                shownClassFeatures,
                                classFeatures.length === 0 ? "No class features listed." : "No unlocked class features yet."
                              )}
                            </FeatureGroup>
                            {entry.subclass && (
                              <FeatureGroup
                                id={`features-${index}-subclass`}
                                variant="subclass"
                                title={entry.subclass.name}
                                subtitle={`${entry.class.name} subclass`}
                                collapsed={Boolean(collapsedFeatureGroups[subclassKey])}
                                onToggle={() => toggleFeatureGroup(subclassKey)}
                                featureCount={shownSubclassFeatures.length}
                                hiddenLockedCount={hiddenLocked(subclassFeatures)}
                              >
                                {renderFeatures(
                                  shownSubclassFeatures,
                                  subclassFeatures.length === 0 ? "No subclass features listed." : "No unlocked subclass features yet."
                                )}
                              </FeatureGroup>
                            )}
                            {subclassPending && (
                              <p className="text-xs italic">
                                Subclass not yet chosen - available at {entry.class.name} level {entry.class.subclassLevel}.
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Feats</CardTitle>
                      {character.feats.length > 0 && <Badge variant="muted">{character.feats.length}</Badge>}
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2 text-sm text-fontcolor-secondary">
                      {character.feats.length === 0 ? (
                        <p>No feats yet - edit this character to add some.</p>
                      ) : (
                        character.feats.map((feat) => <FeatEntry key={feat.name} feat={feat} />)
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === "background" && (
                <div className="flex flex-col gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Background &amp; proficiencies</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2 text-sm text-fontcolor-secondary">
                      <p>Background: {character.background.name}</p>
                      {character.backgroundAbilityBonuses && (
                        <p>
                          Background bonus:{" "}
                          {Object.entries(character.backgroundAbilityBonuses)
                            .map(([ability, bonus]) => `${ability} +${bonus}`)
                            .join(", ")}
                        </p>
                      )}
                      {character.abilityScoreImprovements && Object.keys(character.abilityScoreImprovements).length > 0 && (
                        <p>
                          Ability Score Improvements:{" "}
                          {Object.values(character.abilityScoreImprovements)
                            .map((allocation) =>
                              Object.entries(allocation)
                                .map(([ability, bonus]) => `${ability} +${bonus}`)
                                .join("/")
                            )
                            .join(", ")}
                        </p>
                      )}
                      {/* Skill proficiencies have their own always-visible sidebar card with
                          modifiers and "Roll" buttons - see SkillsPanel - so they're not
                          duplicated here as a flat name list. */}
                      <p>Saving throws: {character.savingThrowProficiencies.join(", ") || "None"}</p>
                      <p>Languages: {character.languages.join(", ") || "None"}</p>
                    </CardContent>
                  </Card>

                  {hasCharacterDetails(character.details) && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Character details</CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-2 text-sm text-fontcolor-secondary">
                        {character.details?.playerName && <p>Player: {character.details.playerName}</p>}
                        {character.details?.flavor?.personalityTraits && (
                          <p>
                            <span className="font-semibold text-fontcolor">Personality traits:</span>{" "}
                            {character.details.flavor.personalityTraits}
                          </p>
                        )}
                        {character.details?.flavor?.ideals && (
                          <p>
                            <span className="font-semibold text-fontcolor">Ideals:</span> {character.details.flavor.ideals}
                          </p>
                        )}
                        {character.details?.flavor?.bonds && (
                          <p>
                            <span className="font-semibold text-fontcolor">Bonds:</span> {character.details.flavor.bonds}
                          </p>
                        )}
                        {character.details?.flavor?.flaws && (
                          <p>
                            <span className="font-semibold text-fontcolor">Flaws:</span> {character.details.flavor.flaws}
                          </p>
                        )}
                        {character.details?.appearance && Object.values(character.details.appearance).some(Boolean) && (
                          <p>
                            <span className="font-semibold text-fontcolor">Appearance:</span>{" "}
                            {Object.entries(character.details.appearance)
                              .filter(([, value]) => value)
                              .map(([key, value]) => `${key.charAt(0).toUpperCase()}${key.slice(1)} ${value}`)
                              .join(", ")}
                          </p>
                        )}
                        {character.details?.appearanceNotes && (
                          <p className="whitespace-pre-line">
                            <span className="font-semibold text-fontcolor">Physical description:</span>{" "}
                            {character.details.appearanceNotes}
                          </p>
                        )}
                        {character.details?.backstory && (
                          <p className="whitespace-pre-line">
                            <span className="font-semibold text-fontcolor">Backstory:</span> {character.details.backstory}
                          </p>
                        )}
                        {character.details?.alliesAndOrganizations && (
                          <p className="whitespace-pre-line">
                            <span className="font-semibold text-fontcolor">Allies &amp; organizations:</span>{" "}
                            {character.details.alliesAndOrganizations}
                            {character.details.organizationSymbolName
                              ? ` (symbol: ${character.details.organizationSymbolName})`
                              : ""}
                          </p>
                        )}
                        {character.details?.treasure && (
                          <p className="whitespace-pre-line">
                            <span className="font-semibold text-fontcolor">Treasure:</span> {character.details.treasure}
                          </p>
                        )}
                        {character.details?.additionalFeaturesAndTraits && (
                          <p className="whitespace-pre-line">
                            <span className="font-semibold text-fontcolor">Additional features &amp; traits:</span>{" "}
                            {character.details.additionalFeaturesAndTraits}
                          </p>
                        )}
                        {character.details?.featuresAndTraitsNotes && (
                          <p className="whitespace-pre-line">
                            <span className="font-semibold text-fontcolor">Features &amp; traits notes:</span>{" "}
                            {character.details.featuresAndTraitsNotes}
                          </p>
                        )}
                        {character.details?.otherProficienciesNotes && (
                          <p className="whitespace-pre-line">
                            <span className="font-semibold text-fontcolor">Other proficiencies &amp; languages notes:</span>{" "}
                            {character.details.otherProficienciesNotes}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-6">
            <Button href={`/newCharacter/manual?edit=${character.id}`}>Edit character</Button>
            <PdfExportPanel character={character} />
            <Button variant="secondary" onClick={() => downloadCharacterAsJson(character)}>
              Export as JSON
            </Button>
            <Link
              href="/home"
              className="text-sm text-fontcolor-secondary underline-offset-4 hover:text-fontcolor hover:underline"
            >
              Back to characters
            </Link>
            <Button variant="danger" size="md" onClick={() => setShowDeleteConfirm(true)}>
              Delete character
            </Button>
          </div>
        </div>
      </Container>

      <RollHistoryWidget history={rollHistory} onClear={() => setRollHistory([])} />
    </>
  );
}
