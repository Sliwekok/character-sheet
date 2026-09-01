import { useState } from "react";
import { MagicItem, MagicItemCategory, MagicItemRarity } from "@/interfaces/MagicItem";
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

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function attunementLabel(item: MagicItem): string | undefined {
  if (!item.requiresAttunement) return undefined;
  return item.requiresAttunement === true ? "Requires attunement" : `Requires attunement ${item.requiresAttunement}`;
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
};

/**
 * One card in the "already added" list, and the one row of the "add from
 * the compendium" combobox result - shares layout with ItemDetailPanel's
 * badges/DetailRow style but inline, since (unlike Skills & Equipment)
 * there's no separate inspector panel here: every added item is shown in
 * full immediately, there usually being few enough of them.
 */
function MagicItemCard({ item, onRemove }: { item: MagicItem; onRemove: () => void }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-2 text-sm text-fontcolor-secondary">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-fontcolor">{item.name}</span>
            <Badge variant="outline">{capitalize(item.category)}</Badge>
            <Badge variant="muted">{capitalize(item.rarity)}</Badge>
            {item.isCustom && <Badge variant="muted">Homebrew</Badge>}
          </div>
          <Button variant="ghost" size="sm" onClick={onRemove}>
            Remove
          </Button>
        </div>
        {attunementLabel(item) && <p>{attunementLabel(item)}</p>}
        {item.charges && (
          <p>
            Charges: {item.charges.max}
            {item.charges.rechargeFormula ? ` (${item.charges.rechargeFormula})` : ""}
          </p>
        )}
        <p>{item.description}</p>
      </CardContent>
    </Card>
  );
}

/**
 * Magic items carried/owned beyond the equipped armor/shield/weapons
 * handled by Skills & Equipment (those can be magic in their own right via
 * the bonus/rarity fields on Armor/Weapon - see that step and
 * ItemDetailPanel). This step covers everything else a `MagicItem` can be:
 * wondrous items, rings, rods, staves, wands, potions, and scrolls - either
 * picked from the compendium (`ruleset.magicItems`) or homebrewed from
 * scratch via `createCustomMagicItem` (utils/customMagicItems.ts), which
 * previously had no UI calling it at all - see that file's header comment.
 *
 * Always optional, same as Skills & Equipment/Spells - a player who doesn't
 * want to bother with magic items yet can skip straight past.
 */
export function MagicItemsStep({ ruleset, magicItems, onChange }: MagicItemsStepProps) {
  const [picked, setPicked] = useState<MagicItem | undefined>(undefined);
  const [form, setForm] = useState(EMPTY_FORM);

  function addItem(item: MagicItem) {
    onChange([...magicItems, item]);
  }

  function removeItem(index: number) {
    onChange(magicItems.filter((_, i) => i !== index));
  }

  function addFromCompendium(item: MagicItem) {
    addItem(item);
    setPicked(undefined);
  }

  const canCreate = form.name.trim().length > 0 && form.description.trim().length > 0;

  function handleCreate() {
    if (!canCreate) return;
    const chargesMax = form.hasCharges ? Number(form.chargesMax) : undefined;
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
      })
    );
    setForm(EMPTY_FORM);
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="z-1000">
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm font-medium text-fontcolor-secondary">Add from the compendium</p>
          <Combobox
            options={ruleset.magicItems}
            value={picked}
            getOptionLabel={(item) => `${item.name} (${capitalize(item.rarity)})`}
            getOptionValue={(item) => item.name}
            onChange={addFromCompendium}
            placeholder="Search magic items..."
          />
        </CardContent>
      </Card>

      {magicItems.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-fontcolor-secondary">
            Carried magic items ({magicItems.length})
          </p>
          <div className="flex flex-col gap-3">
            {magicItems.map((item, index) => (
              <MagicItemCard key={`${item.name}-${index}`} item={item} onRemove={() => removeItem(index)} />
            ))}
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
            equivalent. Building a magic weapon or suit of armor instead? Enchant or homebrew it on the
            Skills &amp; Equipment step.
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

          <Button onClick={handleCreate} disabled={!canCreate} className="w-fit">
            Add custom item
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
