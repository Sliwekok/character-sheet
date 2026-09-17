"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Character } from "@/interfaces/Characters";
import { MagicItem, MagicItemCategory, MagicItemRarity } from "@/interfaces/MagicItem";
import { GearItem, GearCategory } from "@/interfaces/GearItem";
import { GEAR_ITEMS } from "@/data/gear/GearItems";
import { Badge, Button, Select, Tabs, TextInput, type TabItem } from "@/components/ui";

type ShopProps = {
  character: Character;
  onClose: () => void;
  /** Appends one non-armor/weapon magic item to `Character.magicItems` (see MagicItem.ts). */
  onAddMagicItem: (item: MagicItem) => void;
  /** Adds `quantity` of a mundane gear item to `Character.inventory`, stacking onto an existing entry of the same item rather than duplicating it. */
  onAddGearItem: (item: GearItem, quantity: number) => void;
};

const MAGIC_CATEGORIES: MagicItemCategory[] = [
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

const GEAR_CATEGORIES: GearCategory[] = ["adventuring gear", "tool", "consumable", "container", "ammunition", "trade good"];

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/** Buckets `items` by `getCategory`, in `order`'s fixed order, dropping any category with no matches - what makes the browsers below read as a shop's shelves rather than one long flat list. */
function groupByCategory<T, C extends string>(items: T[], getCategory: (item: T) => C, order: C[]): [C, T[]][] {
  const groups = new Map<C, T[]>();
  for (const item of items) {
    const category = getCategory(item);
    const group = groups.get(category) ?? [];
    group.push(item);
    groups.set(category, group);
  }
  return order.map((category): [C, T[]] => [category, groups.get(category) ?? []]).filter(([, group]) => group.length > 0);
}

/**
 * One collapsible shelf of results, shared by the magic item and gear
 * browsers below - a category heading (with a count badge) that toggles
 * its own row list open/closed, so a player scanning "Potion" doesn't have
 * to scroll past every ring and wand first.
 */
function CategoryGroup({
  label,
  count,
  isCollapsed,
  onToggle,
  children,
}: {
  label: string;
  count: number;
  isCollapsed: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-(--radius) border border-border">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={!isCollapsed}
        className="flex w-full items-center justify-between gap-2 bg-background-darken/40 px-3 py-2 text-left text-sm font-semibold text-fontcolor"
      >
        <span>{label}</span>
        <span className="flex items-center gap-2">
          <Badge variant="muted">{count}</Badge>
          <span className="text-fontcolor-secondary">{isCollapsed ? "▸" : "▾"}</span>
        </span>
      </button>
      {!isCollapsed && <div className="flex flex-col divide-y divide-border border-t border-border">{children}</div>}
    </div>
  );
}

/**
 * "Magic Items" tab - searches, filters (by type and rarity), and groups
 * `ruleset.magicItems`-equivalent compendium data (wondrous items, rings,
 * rods, staves, wands, potions, scrolls, ammunition, other - see
 * MagicItem.ts) for one-click adding to `Character.magicItems`. Loads the
 * compendium via a dynamic `import("@/data/magicItems")` rather than the
 * full `getRulesetAsync` ruleset (see data/magicItems/index.ts's header
 * comment) - the magic item list doesn't vary by edition, so there's no
 * need to also fetch races/classes/spells just to browse it here.
 */
function MagicItemsBrowser({ onAdd }: { onAdd: (item: MagicItem) => void }) {
  const [items, setItems] = useState<MagicItem[] | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<MagicItemCategory | "all">("all");
  const [rarityFilter, setRarityFilter] = useState<MagicItemRarity | "all">("all");
  const [collapsed, setCollapsed] = useState<Set<MagicItemCategory>>(new Set());

  useEffect(() => {
    let cancelled = false;
    import("@/data/magicItems").then((mod) => {
      if (!cancelled) setItems(mod.MAGIC_ITEMS);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!items) return [];
    const query = search.trim().toLowerCase();
    return items.filter(
      (item) =>
        (categoryFilter === "all" || item.category === categoryFilter) &&
        (rarityFilter === "all" || item.rarity === rarityFilter) &&
        (query === "" || item.name.toLowerCase().includes(query))
    );
  }, [items, search, categoryFilter, rarityFilter]);

  const grouped = useMemo(
    () => groupByCategory(filtered, (item) => item.category, MAGIC_CATEGORIES),
    [filtered]
  );

  function toggleGroup(category: MagicItemCategory) {
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <TextInput
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search magic items..."
      />

      <div className="grid grid-cols-2 gap-2">
        <Select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value as MagicItemCategory | "all")}
        >
          <option value="all">All types</option>
          {MAGIC_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {capitalize(category)}
            </option>
          ))}
        </Select>
        <Select value={rarityFilter} onChange={(event) => setRarityFilter(event.target.value as MagicItemRarity | "all")}>
          <option value="all">All rarities</option>
          {RARITIES.map((rarity) => (
            <option key={rarity} value={rarity}>
              {capitalize(rarity)}
            </option>
          ))}
        </Select>
      </div>

      {items === null ? (
        <p className="text-xs text-fontcolor-secondary">Loading magic item compendium...</p>
      ) : (
        <>
          <p className="text-xs text-fontcolor-secondary">
            {filtered.length} of {items.length} match{categoryFilter !== "all" || rarityFilter !== "all" || search ? " these filters" : ""}.
          </p>
          <div className="flex flex-col gap-2">
            {grouped.length === 0 && (
              <p className="text-sm text-fontcolor-secondary">No matches - try a different search or filter.</p>
            )}
            {grouped.map(([category, groupItems]) => (
              <CategoryGroup
                key={category}
                label={capitalize(category)}
                count={groupItems.length}
                isCollapsed={collapsed.has(category)}
                onToggle={() => toggleGroup(category)}
              >
                {groupItems.map((item, index) => (
                  <div key={`${item.name}-${index}`} className="flex items-start justify-between gap-2 px-3 py-2">
                    <div className="flex min-w-0 flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-sm font-medium text-fontcolor">{item.name}</span>
                        <Badge variant="muted">{capitalize(item.rarity)}</Badge>
                        {item.requiresAttunement && <Badge variant="outline">Attunement</Badge>}
                      </div>
                      {item.description && (
                        <p className="line-clamp-2 text-xs text-fontcolor-secondary">{item.description}</p>
                      )}
                    </div>
                    <Button size="sm" variant="secondary" onClick={() => onAdd(item)} className="shrink-0">
                      Add
                    </Button>
                  </div>
                ))}
              </CategoryGroup>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * "General Gear" tab - the mundane counterpart to the magic item browser
 * above: rope, torches, tools, rations, an over-the-counter potion of
 * healing, and the rest of `data/gear/GearItems.ts`, none of which need a
 * ruleset or async load since the list is tiny and edition-agnostic (same
 * reasoning as data/weapons/Weapons.ts). Unlike magic items, gear commonly
 * stacks - the quantity field next to each row lets a player add "5
 * rations" or "50 ft. of rope" in one click instead of five.
 */
function GearBrowser({ onAdd }: { onAdd: (item: GearItem, quantity: number) => void }) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<GearCategory | "all">("all");
  const [collapsed, setCollapsed] = useState<Set<GearCategory>>(new Set());
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return GEAR_ITEMS.filter(
      (item) =>
        (categoryFilter === "all" || item.category === categoryFilter) &&
        (query === "" || item.name.toLowerCase().includes(query))
    );
  }, [search, categoryFilter]);

  const grouped = useMemo(() => groupByCategory(filtered, (item) => item.category, GEAR_CATEGORIES), [filtered]);

  function toggleGroup(category: GearCategory) {
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }

  function quantityFor(name: string): number {
    return quantities[name] ?? 1;
  }

  function setQuantityFor(name: string, value: number) {
    setQuantities((current) => ({ ...current, [name]: Math.max(1, Math.floor(value) || 1) }));
  }

  function handleAdd(item: GearItem) {
    onAdd(item, quantityFor(item.name));
    setQuantities((current) => ({ ...current, [item.name]: 1 }));
  }

  return (
    <div className="flex flex-col gap-3">
      <TextInput
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search general gear..."
      />

      <Select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as GearCategory | "all")}>
        <option value="all">All categories</option>
        {GEAR_CATEGORIES.map((category) => (
          <option key={category} value={category}>
            {capitalize(category)}
          </option>
        ))}
      </Select>

      <p className="text-xs text-fontcolor-secondary">
        {filtered.length} of {GEAR_ITEMS.length} match{categoryFilter !== "all" || search ? " these filters" : ""}.
      </p>

      <div className="flex flex-col gap-2">
        {grouped.length === 0 && (
          <p className="text-sm text-fontcolor-secondary">No matches - try a different search or filter.</p>
        )}
        {grouped.map(([category, groupItems]) => (
          <CategoryGroup
            key={category}
            label={capitalize(category)}
            count={groupItems.length}
            isCollapsed={collapsed.has(category)}
            onToggle={() => toggleGroup(category)}
          >
            {groupItems.map((item, index) => (
              <div key={`${item.name}-${index}`} className="flex items-start justify-between gap-2 px-3 py-2">
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="text-sm font-medium text-fontcolor">{item.name}</span>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-fontcolor-secondary">
                    {item.cost && <span>{item.cost}</span>}
                    {item.weight !== undefined && <span>{item.weight} lb.</span>}
                  </div>
                  {item.description && (
                    <p className="line-clamp-2 text-xs text-fontcolor-secondary">{item.description}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <TextInput
                    type="number"
                    min={1}
                    value={quantityFor(item.name)}
                    onChange={(event) => setQuantityFor(item.name, Number(event.target.value))}
                    className="w-14 px-2 text-center"
                  />
                  <Button size="sm" variant="secondary" onClick={() => handleAdd(item)}>
                    Add
                  </Button>
                </div>
              </div>
            ))}
          </CategoryGroup>
        ))}
      </div>
    </div>
  );
}

type ShopTab = "magic" | "gear";

/**
 * Slide-in shop panel opened from the Inventory tab's "+" control (see
 * app/character/[id]/page.tsx) - two searchable, filterable, grouped
 * browsers (magic items; general/mundane gear) for quickly stocking up
 * mid-session without leaving the character sheet. Every "Add" click
 * writes straight through the callbacks below, which the page persists via
 * `saveCharacter` exactly like every other in-place edit on that page
 * (see e.g. `handleToggleWeaponMastery`) - there's no separate "confirm
 * purchase" step, matching the "fast adding" this was built for. Currency
 * isn't deducted automatically (prices are shown for reference only) -
 * the player still tracks gold spent themselves, the same as every other
 * manually-edited field on the Inventory tab.
 */
export function Shop({ character, onClose, onAddMagicItem, onAddGearItem }: ShopProps) {
  const [tab, setTab] = useState<ShopTab>("magic");

  const magicItemCount = character.magicItems?.length ?? 0;
  const gearItemCount = character.inventory?.reduce((total, entry) => total + entry.quantity, 0) ?? 0;

  const tabs: TabItem<ShopTab>[] = [
    { key: "magic", label: "Magic Items", count: magicItemCount },
    { key: "gear", label: "General Gear", count: gearItemCount },
  ];

  return (
    <div className="fixed inset-0 z-1000 flex justify-end bg-black/50" onClick={onClose}>
      <div
        onClick={(event) => event.stopPropagation()}
        className="flex h-dvh w-full max-w-md flex-col overflow-hidden border-l border-border bg-background-elevated shadow-[0_12px_30px_-16px_rgba(0,0,0,0.85)]"
      >
        <div className="flex items-center justify-between gap-2 border-b border-border px-5 py-4">
          <h2 className="font-display text-lg tracking-wide text-fontcolor">Shop</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close shop"
            className="flex h-8 w-8 items-center justify-center rounded-full text-fontcolor-secondary hover:bg-background-darken hover:text-fontcolor"
          >
            ✕
          </button>
        </div>

        <div className="px-5 pt-3">
          <Tabs tabs={tabs} active={tab} onChange={setTab} />
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {tab === "magic" && <MagicItemsBrowser onAdd={onAddMagicItem} />}
          {tab === "gear" && <GearBrowser onAdd={onAddGearItem} />}
        </div>
      </div>
    </div>
  );
}
