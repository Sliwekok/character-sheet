import { useMemo, useState } from "react";
import { MagicItem, MagicItemCategory, MagicItemRarity } from "@/interfaces/MagicItem";
import { Weapon } from "@/interfaces/Weapon";
import { Armor } from "@/interfaces/Armor";
import { createCustomMagicItem } from "@/utils/customMagicItems";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Combobox,
  Select,
  TextInput,
  Textarea,
} from "@/components/ui";
import { Ruleset } from "@/data";

type MagicItemsStepProps = {
  ruleset: Ruleset;
  magicItems: MagicItem[];
  onChange: (magicItems: MagicItem[]) => void;
  /**
   * Magic weapons/armor/shields don't live in `magicItems` - like their
   * mundane counterparts they're plain `Weapon`/`Armor` objects (see
   * utils/customMagicItems.ts's header comment) that drop straight into
   * these same three character fields, distinguished from a mundane entry
   * only by having `rarity` set. Passed through from ManualWizard so this
   * step can be the one place that browses AND adds every kind of magic
   * item, weapons/armor included - Skills & Equipment's pickers stay
   * mundane-only (see that step's header comment).
   */
  equippedArmor: Armor | undefined;
  shield: Armor | undefined;
  weapons: Weapon[];
  onArmorChange: (armor: Armor | undefined) => void;
  onShieldChange: (shield: Armor | undefined) => void;
  onWeaponsChange: (weapons: Weapon[]) => void;
};

const CATEGORIES: MagicItemCategory[] = [
  "wondrous item",
  "ring",
  "rod",
  "staff",
  "wand",
  "potion",
  "scroll",
  "ammunition",
  "other",
];

const RARITIES: MagicItemRarity[] = ["common", "uncommon", "rare", "very rare", "legendary", "artifact", "varies"];

/** Every filterable "type" in the combined compendium browser - "weapon"/"armor" (shields included) plus every non-armor/weapon `MagicItemCategory`. */
type CompendiumType = "weapon" | "armor" | MagicItemCategory;
const COMPENDIUM_TYPES: CompendiumType[] = ["weapon", "armor", ...CATEGORIES];

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/**
 * One entry in the combined "add from the compendium" browser -
 * `ruleset.magicItems` (rings/wondrous items/rods/staves/wands/potions/
 * scrolls/ammunition/other) plus `ruleset.magicWeapons`/`magicArmor`, all
 * three normalized to the same {name, type, rarity} shape so they can share
 * one filterable/searchable list. `kind` + `data` is a discriminated union
 * so `addFromCompendium` below can route each pick to the right character
 * field without re-deriving what it is from `type` alone (armor and
 * shields are both `type: "armor"` here, but need different handling).
 */
type CompendiumEntry =
  | { key: string; name: string; type: MagicItemCategory; rarity: MagicItemRarity; kind: "item"; data: MagicItem }
  | { key: string; name: string; type: "weapon"; rarity: MagicItemRarity; kind: "weapon"; data: Weapon }
  | { key: string; name: string; type: "armor"; rarity: MagicItemRarity; kind: "armor"; data: Armor };

/** A magic weapon/armor is distinguished from a mundane one purely by having `rarity` set - see MagicItemsStepProps' doc comment. */
function isMagic<T extends { rarity?: MagicItemRarity }>(entry: T): boolean {
  return entry.rarity !== undefined;
}

/** Shared by MagicItem/Weapon/Armor cards alike - all three type `requiresAttunement` the same way (see MagicItem.ts's `AttunementRequirement`). */
function attunementLabel(requiresAttunement: MagicItem["requiresAttunement"] | undefined): string | undefined {
  if (!requiresAttunement) return undefined;
  return requiresAttunement === true ? "Requires attunement" : `Requires attunement ${requiresAttunement}`;
}

const EMPTY_FORM = {
  name: "",
  category: "wondrous item" as MagicItemCategory,
  rarity: "uncommon" as MagicItemRarity,
  requiresAttunement: false,
  attunementRestriction: "",
  description: "",
  hasCharges: false,
  chargesMax: "",
  rechargeFormula: "",
  armorClassBonus: "",
  attackRollBonus: "",
  damageRollBonus: "",
};

/** "Bonuses: +1 AC, +1 attack rolls, +1 damage rolls" - only the fields actually set, for MagicItemCard. */
function bonusesLabel(item: MagicItem): string | undefined {
  const bonuses = item.bonuses;
  if (!bonuses) return undefined;
  const parts: string[] = [];
  if (bonuses.armorClass) parts.push(`${bonuses.armorClass > 0 ? "+" : ""}${bonuses.armorClass} AC`);
  if (bonuses.attackRolls) parts.push(`${bonuses.attackRolls > 0 ? "+" : ""}${bonuses.attackRolls} attack rolls`);
  if (bonuses.damageRolls) parts.push(`${bonuses.damageRolls > 0 ? "+" : ""}${bonuses.damageRolls} damage rolls`);
  return parts.length > 0 ? `Bonuses: ${parts.join(", ")}` : undefined;
}

/**
 * One card in the "carried" list, normalized so a `MagicItem`, a magic
 * `Weapon`, and a magic `Armor`/shield can all render the same way -
 * shares layout with ItemDetailPanel's badges/DetailRow style but inline,
 * since (unlike Skills & Equipment) there's no separate inspector panel
 * here: every added item is shown in full immediately, there usually being
 * few enough of them. See the three `*ToDisplay` functions below for how
 * each source type maps onto these props.
 */
function MagicGearCard({
  name,
  typeLabel,
  rarity,
  attunement,
  statLine,
  bonusLine,
  description,
  isCustom,
  onRemove,
}: {
  name: string;
  typeLabel: string;
  rarity: MagicItemRarity;
  attunement?: string;
  statLine?: string;
  bonusLine?: string;
  description?: string;
  isCustom?: boolean;
  onRemove: () => void;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-2 text-sm text-fontcolor-secondary">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-fontcolor">{name}</span>
            <Badge variant="outline">{typeLabel}</Badge>
            <Badge variant="muted">{capitalize(rarity)}</Badge>
            {isCustom && <Badge variant="muted">Homebrew</Badge>}
          </div>
          <Button variant="ghost" size="sm" onClick={onRemove}>
            Remove
          </Button>
        </div>
        {attunement && <p>{attunement}</p>}
        {statLine && <p>{statLine}</p>}
        {bonusLine && <p className="font-medium text-fontcolor">{bonusLine}</p>}
        {description && <p>{description}</p>}
      </CardContent>
    </Card>
  );
}

/** MagicItem -> MagicGearCard props. */
function itemToDisplay(item: MagicItem, onRemove: () => void) {
  return {
    name: item.name,
    typeLabel: capitalize(item.category),
    rarity: item.rarity,
    attunement: attunementLabel(item.requiresAttunement),
    statLine: item.charges
      ? `Charges: ${item.charges.max}${item.charges.rechargeFormula ? ` (${item.charges.rechargeFormula})` : ""}`
      : undefined,
    bonusLine: bonusesLabel(item),
    description: item.description,
    isCustom: item.isCustom,
    onRemove,
  };
}

/** Magic Weapon -> MagicGearCard props - `rarity` is asserted present since this is only ever called on an entry `isMagic()` already confirmed has one. */
function weaponToDisplay(weapon: Weapon, onRemove: () => void) {
  return {
    name: weapon.name,
    typeLabel: "Weapon",
    rarity: weapon.rarity as MagicItemRarity,
    attunement: attunementLabel(weapon.requiresAttunement),
    statLine: `${weapon.damage.dice} ${weapon.damage.type}${weapon.bonus ? ` (+${weapon.bonus})` : ""}`,
    description: weapon.magicDescription,
    isCustom: weapon.isCustom,
    onRemove,
  };
}

/** Magic Armor/shield -> MagicGearCard props - same `rarity` caveat as `weaponToDisplay`. */
function armorToDisplay(armor: Armor, onRemove: () => void) {
  const isShield = armor.category === "shield";
  return {
    name: armor.name,
    typeLabel: isShield ? "Shield" : "Armor",
    rarity: armor.rarity as MagicItemRarity,
    attunement: attunementLabel(armor.requiresAttunement),
    statLine: `${isShield ? "+" : "AC "}${armor.baseAC}${armor.bonus ? ` (+${armor.bonus} magic)` : ""}`,
    description: armor.magicDescription,
    isCustom: armor.isCustom,
    onRemove,
  };
}

/**
 * Every magic item a character carries, ALL in one place - wondrous items,
 * rings, rods, staves, wands, potions, scrolls, ammunition (`MagicItem`,
 * stored in `Character.magicItems`) and magic weapons/armor/shields (plain
 * `Weapon`/`Armor` objects with `rarity` set - see
 * utils/customMagicItems.ts's header comment - stored in `Character.
 * weapons`/`equippedArmor`/`shield`, the same fields Skills & Equipment
 * writes to). Skills & Equipment's own pickers are mundane-starting-
 * equipment only (see that step's header comment) specifically so this is
 * the one place to browse, filter, and add anything magical, official
 * compendium content or homebrew alike.
 *
 * "Add from the compendium" below searches/filters (by type and rarity)
 * across `ruleset.magicItems` + `ruleset.magicWeapons` + `ruleset.
 * magicArmor` together - see `CompendiumEntry`. The "carried" list below
 * that mirrors this: `magicItems` plus whichever of `weapons`/
 * `equippedArmor`/`shield` are magic (`isMagic`), each removable from
 * here regardless of which list it actually lives in.
 *
 * Always optional, same as Skills & Equipment/Spells - a player who doesn't
 * want to bother with magic items yet can skip straight past.
 */
export function MagicItemsStep({
  ruleset,
  magicItems,
  onChange,
  equippedArmor,
  shield,
  weapons,
  onArmorChange,
  onShieldChange,
  onWeaponsChange,
}: MagicItemsStepProps) {
  const [picked, setPicked] = useState<CompendiumEntry | undefined>(undefined);
  const [typeFilter, setTypeFilter] = useState<CompendiumType | "all">("all");
  const [rarityFilter, setRarityFilter] = useState<MagicItemRarity | "all">("all");
  const [form, setForm] = useState(EMPTY_FORM);

  const compendiumEntries: CompendiumEntry[] = useMemo(() => {
    const items: CompendiumEntry[] = ruleset.magicItems.map((item) => ({
      key: `item:${item.name}`,
      name: item.name,
      type: item.category,
      rarity: item.rarity,
      kind: "item",
      data: item,
    }));
    const weaponEntries: CompendiumEntry[] = ruleset.magicWeapons.map((weapon) => ({
      key: `weapon:${weapon.name}`,
      name: weapon.name,
      type: "weapon",
      rarity: weapon.rarity ?? "varies",
      kind: "weapon",
      data: weapon,
    }));
    const armorEntries: CompendiumEntry[] = ruleset.magicArmor.map((armor) => ({
      key: `armor:${armor.name}`,
      name: armor.name,
      type: "armor",
      rarity: armor.rarity ?? "varies",
      kind: "armor",
      data: armor,
    }));
    return [...items, ...weaponEntries, ...armorEntries];
  }, [ruleset.magicItems, ruleset.magicWeapons, ruleset.magicArmor]);

  const filteredEntries = useMemo(
    () =>
      compendiumEntries.filter(
        (entry) =>
          (typeFilter === "all" || entry.type === typeFilter) &&
          (rarityFilter === "all" || entry.rarity === rarityFilter)
      ),
    [compendiumEntries, typeFilter, rarityFilter]
  );

  // What's currently carried, across all three character fields this step
  // touches - see this component's doc comment.
  const magicWeaponsCarried = useMemo(() => weapons.filter(isMagic), [weapons]);
  const magicArmorEquipped = equippedArmor && isMagic(equippedArmor) ? equippedArmor : undefined;
  const magicShieldEquipped = shield && isMagic(shield) ? shield : undefined;
  const carriedCount =
    magicItems.length + magicWeaponsCarried.length + (magicArmorEquipped ? 1 : 0) + (magicShieldEquipped ? 1 : 0);

  function addItem(item: MagicItem) {
    onChange([...magicItems, item]);
  }

  function removeItem(index: number) {
    onChange(magicItems.filter((_, i) => i !== index));
  }

  /** Removes one magic weapon by reference - safe since `magicWeaponsCarried` is filtered (not copied) from `weapons`, so the same object identity survives. */
  function removeMagicWeapon(target: Weapon) {
    onWeaponsChange(weapons.filter((w) => w !== target));
  }

  function addFromCompendium(entry: CompendiumEntry) {
    if (entry.kind === "item") {
      addItem(entry.data);
    } else if (entry.kind === "weapon") {
      onWeaponsChange([...weapons, entry.data]);
    } else if (entry.data.category === "shield") {
      onShieldChange(entry.data);
    } else {
      onArmorChange(entry.data);
    }
    setPicked(undefined);
  }

  const canCreate = form.name.trim().length > 0 && form.description.trim().length > 0;

  function handleCreate() {
    if (!canCreate) return;
    const chargesMax = form.hasCharges ? Number(form.chargesMax) : undefined;
    const armorClass = form.armorClassBonus.trim() ? Number(form.armorClassBonus) : undefined;
    const attackRolls = form.attackRollBonus.trim() ? Number(form.attackRollBonus) : undefined;
    const damageRolls = form.damageRollBonus.trim() ? Number(form.damageRollBonus) : undefined;
    const hasBonus = Boolean(armorClass || attackRolls || damageRolls);
    addItem(
      createCustomMagicItem({
        name: form.name.trim(),
        category: form.category,
        rarity: form.rarity,
        requiresAttunement: form.requiresAttunement
          ? form.attunementRestriction.trim() || true
          : false,
        description: form.description.trim(),
        charges:
          form.hasCharges && chargesMax
            ? { max: chargesMax, rechargeFormula: form.rechargeFormula.trim() || undefined }
            : undefined,
        bonuses: hasBonus ? { armorClass, attackRolls, damageRolls } : undefined,
      })
    );
    setForm(EMPTY_FORM);
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="z-1000">
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm font-medium text-fontcolor-secondary">Add from the compendium</p>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-fontcolor-secondary">Type</span>
              <Select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value as CompendiumType | "all")}
              >
                <option value="all">All types</option>
                {COMPENDIUM_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {capitalize(type)}
                  </option>
                ))}
              </Select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-fontcolor-secondary">Rarity</span>
              <Select
                value={rarityFilter}
                onChange={(event) => setRarityFilter(event.target.value as MagicItemRarity | "all")}
              >
                <option value="all">All rarities</option>
                {RARITIES.map((rarity) => (
                  <option key={rarity} value={rarity}>
                    {capitalize(rarity)}
                  </option>
                ))}
              </Select>
            </label>
          </div>

          <Combobox
            options={filteredEntries}
            value={picked}
            getOptionLabel={(entry) => `${entry.name} (${capitalize(entry.rarity)})`}
            getOptionValue={(entry) => entry.key}
            onChange={addFromCompendium}
            placeholder="Search magic items, weapons & armor..."
          />
          <p className="text-xs text-fontcolor-secondary">
            {filteredEntries.length} of {compendiumEntries.length} match{typeFilter !== "all" || rarityFilter !== "all" ? " these filters" : ""}.
          </p>
        </CardContent>
      </Card>

      {carriedCount > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-fontcolor-secondary">Carried magic gear ({carriedCount})</p>
          <div className="flex flex-col gap-3">
            {magicItems.map((item, index) => (
              <MagicGearCard key={`item-${item.name}-${index}`} {...itemToDisplay(item, () => removeItem(index))} />
            ))}
            {magicWeaponsCarried.map((weapon, index) => (
              <MagicGearCard
                key={`weapon-${weapon.name}-${index}`}
                {...weaponToDisplay(weapon, () => removeMagicWeapon(weapon))}
              />
            ))}
            {magicArmorEquipped && (
              <MagicGearCard {...armorToDisplay(magicArmorEquipped, () => onArmorChange(undefined))} />
            )}
            {magicShieldEquipped && (
              <MagicGearCard {...armorToDisplay(magicShieldEquipped, () => onShieldChange(undefined))} />
            )}
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Create a custom magic item</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-xs text-fontcolor-secondary">
            For a homebrew wondrous item, ring, rod, staff, wand, potion, or scroll with no compendium
            equivalent. Homebrewing a magic weapon or suit of armor isn&apos;t supported here yet - only
            compendium ones (via the browser above) can be added.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-fontcolor-secondary">Name*</span>
              <TextInput
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="e.g. Orb of Whispering Shadows"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-fontcolor-secondary">Category</span>
              <Select
                value={form.category}
                onChange={(event) => setForm({ ...form, category: event.target.value as MagicItemCategory })}
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {capitalize(category)}
                  </option>
                ))}
              </Select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-fontcolor-secondary">Rarity</span>
              <Select
                value={form.rarity}
                onChange={(event) => setForm({ ...form, rarity: event.target.value as MagicItemRarity })}
              >
                {RARITIES.map((rarity) => (
                  <option key={rarity} value={rarity}>
                    {capitalize(rarity)}
                  </option>
                ))}
              </Select>
            </label>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-fontcolor-secondary">Attunement</span>
              <label className="flex items-center gap-2 text-sm text-fontcolor-secondary">
                <input
                  type="checkbox"
                  checked={form.requiresAttunement}
                  onChange={(event) => setForm({ ...form, requiresAttunement: event.target.checked })}
                  className="h-4 w-4 rounded border-border-strong"
                />
                Requires attunement
              </label>
              {form.requiresAttunement && (
                <TextInput
                  value={form.attunementRestriction}
                  onChange={(event) => setForm({ ...form, attunementRestriction: event.target.value })}
                  placeholder="Optional restriction, e.g. by a Spellcaster"
                />
              )}
            </div>
          </div>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-fontcolor-secondary">Description*</span>
            <Textarea
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              placeholder="What does it do?"
              rows={4}
            />
          </label>

          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm text-fontcolor-secondary">
              <input
                type="checkbox"
                checked={form.hasCharges}
                onChange={(event) => setForm({ ...form, hasCharges: event.target.checked })}
                className="h-4 w-4 rounded border-border-strong"
              />
              Has limited charges
            </label>
            {form.hasCharges && (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-fontcolor-secondary">Max charges</span>
                  <TextInput
                    type="number"
                    min={1}
                    value={form.chargesMax}
                    onChange={(event) => setForm({ ...form, chargesMax: event.target.value })}
                    placeholder="e.g. 7"
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-fontcolor-secondary">Recharge</span>
                  <TextInput
                    value={form.rechargeFormula}
                    onChange={(event) => setForm({ ...form, rechargeFormula: event.target.value })}
                    placeholder="e.g. 1d6 + 1 charges regained daily at dawn"
                  />
                </label>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-fontcolor-secondary">Mechanical bonuses (optional)</span>
            <p className="text-xs text-fontcolor-secondary">
              Only if this item grants a flat bonus - e.g. a Ring of Protection is +1 AC, a piece of magic
              ammunition is +1 attack &amp; damage rolls. Leave blank for an item that&apos;s pure flavor/utility.
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-fontcolor-secondary">AC bonus</span>
                <TextInput
                  type="number"
                  value={form.armorClassBonus}
                  onChange={(event) => setForm({ ...form, armorClassBonus: event.target.value })}
                  placeholder="e.g. 1"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-fontcolor-secondary">Attack roll bonus</span>
                <TextInput
                  type="number"
                  value={form.attackRollBonus}
                  onChange={(event) => setForm({ ...form, attackRollBonus: event.target.value })}
                  placeholder="e.g. 1"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-fontcolor-secondary">Damage roll bonus</span>
                <TextInput
                  type="number"
                  value={form.damageRollBonus}
                  onChange={(event) => setForm({ ...form, damageRollBonus: event.target.value })}
                  placeholder="e.g. 1"
                />
              </label>
            </div>
          </div>

          <Button onClick={handleCreate} disabled={!canCreate} className="w-fit">
            Add custom item
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
