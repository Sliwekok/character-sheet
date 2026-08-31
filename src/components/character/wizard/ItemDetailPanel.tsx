import { SkillName, SKILL_ABILITIES } from "@/interfaces/Skill";
import { Weapon } from "@/interfaces/Weapon";
import { Armor } from "@/interfaces/Armor";
import { AttunementRequirement } from "@/interfaces/MagicItem";
import { Card, CardHeader, CardTitle, CardContent, Badge } from "@/components/ui";
import { cn } from "@/utils/cn";

export type SelectedEquipmentItem =
  | { kind: "skill"; skill: SkillName; selected: boolean }
  | { kind: "weapon"; weapon: Weapon; selected: boolean }
  | { kind: "armor"; armor: Armor; equipped: boolean }
  | { kind: "shield"; armor: Armor; equipped: boolean };

type ItemDetailPanelProps = {
  item: SelectedEquipmentItem | undefined;
  className?: string;
};

function attunementLabel(requirement: AttunementRequirement | undefined): string | undefined {
  if (!requirement) return undefined;
  return requirement === true ? "Requires attunement" : `Requires attunement ${requirement}`;
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function itemName(item: SelectedEquipmentItem): string {
  return item.kind === "skill" ? item.skill : item.kind === "weapon" ? item.weapon.name : item.armor.name;
}

function isActive(item: SelectedEquipmentItem): boolean {
  return item.kind === "armor" || item.kind === "shield" ? item.equipped : item.selected;
}

function statusLabel(item: SelectedEquipmentItem): string {
  switch (item.kind) {
    case "skill":
      return item.selected ? "Selected" : "Not selected";
    case "weapon":
      return item.selected ? "Carried" : "Not carried";
    case "armor":
    case "shield":
      return item.equipped ? "Equipped" : "Not equipped";
  }
}

/** A label/value line, only rendered when `value` is present - keeps the panel free of empty "Weight: " rows for fields a given item doesn't set. */
function DetailRow({ label, value }: { label: string; value: string | number | undefined }) {
  if (value === undefined || value === "") return null;
  return (
    <p>
      <span className="font-semibold text-fontcolor">{label}:</span> {value}
    </p>
  );
}

function SkillDetails({ skill }: { skill: SkillName }) {
  return (
    <>
      <Badge variant="outline" className="w-fit">
        Skill
      </Badge>
      <DetailRow label="Governing ability" value={capitalize(SKILL_ABILITIES[skill])} />
    </>
  );
}

function WeaponDetails({ weapon }: { weapon: Weapon }) {
  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">Weapon</Badge>
        <Badge variant="muted">{capitalize(weapon.category)}</Badge>
        <Badge variant="muted">{capitalize(weapon.type)}</Badge>
        {weapon.isCustom && <Badge variant="muted">Homebrew</Badge>}
      </div>
      <DetailRow
        label="Damage"
        value={`${weapon.damage.dice} ${weapon.damage.type}${weapon.bonus ? ` (+${weapon.bonus})` : ""}`}
      />
      <DetailRow label="Versatile damage" value={weapon.versatileDamage} />
      <DetailRow
        label="Properties"
        value={weapon.properties.length > 0 ? weapon.properties.join(", ") : undefined}
      />
      <DetailRow label="Mastery" value={weapon.mastery} />
      <DetailRow label="Weight" value={weapon.weight ? `${weapon.weight} lb.` : undefined} />
      <DetailRow label="Cost" value={weapon.cost} />
      {weapon.rarity && <DetailRow label="Rarity" value={capitalize(weapon.rarity)} />}
      <DetailRow label="Attunement" value={attunementLabel(weapon.requiresAttunement)} />
      <DetailRow label="Magic effect" value={weapon.magicDescription} />
    </>
  );
}

function ArmorDetails({ armor, isShield }: { armor: Armor; isShield: boolean }) {
  const dex = armor.dexterityModifier;
  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">{isShield ? "Shield" : "Armor"}</Badge>
        <Badge variant="muted">{capitalize(armor.category)}</Badge>
        {armor.isCustom && <Badge variant="muted">Homebrew</Badge>}
      </div>
      <DetailRow
        label={isShield ? "AC bonus" : "Base AC"}
        value={`${isShield ? "+" : ""}${armor.baseAC}${armor.bonus ? ` (+${armor.bonus} magic)` : ""}`}
      />
      {!isShield && (
        <DetailRow
          label="Dexterity modifier"
          value={
            dex === undefined
              ? undefined
              : dex.enabled
              ? `Applies${dex.max !== undefined ? ` (max +${dex.max})` : ""}`
              : "Does not apply"
          }
        />
      )}
      {armor.stealthDisadvantage && <DetailRow label="Stealth" value="Disadvantage" />}
      <DetailRow
        label="Strength requirement"
        value={armor.strengthRequirement ? `${armor.strengthRequirement}` : undefined}
      />
      <DetailRow label="Material" value={armor.material} />
      <DetailRow label="Weight" value={armor.weight ? `${armor.weight} lb.` : undefined} />
      <DetailRow label="Cost" value={armor.cost} />
      {armor.rarity && <DetailRow label="Rarity" value={capitalize(armor.rarity)} />}
      <DetailRow label="Attunement" value={attunementLabel(armor.requiresAttunement)} />
      <DetailRow label="Magic effect" value={armor.magicDescription} />
    </>
  );
}

/**
 * Right-hand "inspector" for Skills & Equipment - shows the full data behind
 * whatever skill, weapon, armor, or shield the player last clicked in
 * `SkillsEquipmentStep`. Pure display, no callbacks of its own - `item` is
 * transient view state owned by the step, not part of the character draft.
 */
export function ItemDetailPanel({ item, className }: ItemDetailPanelProps) {
  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader>
        <CardTitle>{item ? itemName(item) : "Item details"}</CardTitle>
        {item && <Badge variant={isActive(item) ? "solid" : "muted"}>{statusLabel(item)}</Badge>}
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm text-fontcolor-secondary">
        {!item && <p>Click a skill, weapon, piece of armor, or shield to see its full details here.</p>}
        {item && item.kind === "skill" && <SkillDetails skill={item.skill} />}
        {item && item.kind === "weapon" && <WeaponDetails weapon={item.weapon} />}
        {item && (item.kind === "armor" || item.kind === "shield") && (
          <ArmorDetails armor={item.armor} isShield={item.kind === "shield"} />
        )}
      </CardContent>
    </Card>
  );
}
