import { Race } from "@/interfaces/Race";
import { CharacterClass } from "@/interfaces/CharacterClass";
import { Background } from "@/interfaces/Background";
import { Feat } from "@/interfaces/Feat";
import { Subclass } from "@/interfaces/Subclass";
import { Weapon } from "@/interfaces/Weapon";
import { Armor } from "@/interfaces/Armor";
import { Spell } from "@/interfaces/Spell";
import { MagicItem, AttunementRequirement } from "@/interfaces/MagicItem";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { FeatEntry } from "@/components/character/FeatEntry";
import { FeatureEntry } from "@/components/character/FeatureEntry";
import { SpellEntry } from "@/components/character/SpellEntry";
import { SearchableType } from "@/utils/searchIndex";

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function attunementLabel(requirement: AttunementRequirement | undefined): string | undefined {
  if (!requirement) return undefined;
  return requirement === true ? "Requires attunement" : `Requires attunement ${requirement}`;
}

/** A label/value line, only rendered when `value` is present - same convention as ItemDetailPanel's DetailRow. */
function DetailRow({ label, value }: { label: string; value: string | number | undefined }) {
  if (value === undefined || value === "") return null;
  return (
    <p>
      <span className="font-semibold text-fontcolor">{label}:</span> {value}
    </p>
  );
}

const ABILITY_LABELS: Record<string, string> = {
  strength: "STR",
  dexterity: "DEX",
  constitution: "CON",
  intelligence: "INT",
  wisdom: "WIS",
  charisma: "CHA",
};

function RaceDetails({ race }: { race: Race }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{race.name}</CardTitle>
        <Badge variant="outline">{race.edition === "2024" ? "Species" : "Race"}</Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 text-sm text-fontcolor-secondary">
        <div className="flex flex-wrap gap-4">
          <span>Speed {race.speed} ft.</span>
          {race.languages.length > 0 && <span>Languages: {race.languages.join(", ")}</span>}
        </div>

        {Object.keys(race.abilityModifiers).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(race.abilityModifiers).map(([ability, bonus]) => (
              <Badge key={ability} variant="solid">
                {ABILITY_LABELS[ability] ?? ability} {bonus! >= 0 ? `+${bonus}` : bonus}
              </Badge>
            ))}
          </div>
        )}

        {race.grantedFeatChoice && <p>Grants a player-chosen {race.grantedFeatChoice.category} feat.</p>}
        {race.grantedSkillChoice && (
          <p>Grants proficiency in {race.grantedSkillChoice.choose} skill(s) of your choice.</p>
        )}

        {race.traits.length > 0 && (
          <ul className="flex flex-col gap-1">
            {race.traits.map((trait) => (
              <li key={trait}>• {trait}</li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function ClassDetails({ characterClass }: { characterClass: CharacterClass }) {
  const sortedFeatures = characterClass.features.slice().sort((a, b) => a.level - b.level);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{characterClass.name}</CardTitle>
        <Badge variant="outline">Class</Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 text-sm text-fontcolor-secondary">
        <div className="flex flex-wrap gap-4">
          <span>Hit die: d{characterClass.hitDie}</span>
          <span>Primary ability: {ABILITY_LABELS[characterClass.primaryAbility] ?? characterClass.primaryAbility}</span>
          <span>Subclass at level {characterClass.subclassLevel}</span>
          {characterClass.casterProgression !== "none" && (
            <span>Caster progression: {capitalize(characterClass.casterProgression)}</span>
          )}
        </div>

        <div>
          <p className="mb-1 font-semibold text-fontcolor">Proficiencies</p>
          <DetailRow label="Armor" value={characterClass.proficiencies.armor.join(", ") || undefined} />
          <DetailRow label="Weapons" value={characterClass.proficiencies.weapons.join(", ") || undefined} />
          <DetailRow label="Tools" value={characterClass.proficiencies.tools?.join(", ")} />
          <DetailRow
            label="Saving throws"
            value={characterClass.proficiencies.savingThrows.map((a) => ABILITY_LABELS[a] ?? a).join(", ")}
          />
          <DetailRow
            label="Skills"
            value={`Choose ${characterClass.proficiencies.skills.choose} from ${characterClass.proficiencies.skills.from.join(", ")}`}
          />
        </div>

        {sortedFeatures.length > 0 && (
          <div>
            <p className="mb-2 font-semibold text-fontcolor">Features</p>
            <div className="flex flex-col gap-2">
              {sortedFeatures.map((feature) => (
                <FeatureEntry key={`${feature.level}-${feature.name}`} feature={feature} reached />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BackgroundDetails({ background }: { background: Background }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{background.name}</CardTitle>
        <Badge variant="outline">Background</Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm text-fontcolor-secondary">
        <DetailRow label="Skill proficiencies" value={background.skillProficiencies.join(", ")} />
        <DetailRow label="Tool proficiency" value={background.toolProficiency} />
        <DetailRow label="Equipment" value={background.equipment.join(", ")} />
        {background.abilityScoreOptions && (
          <DetailRow
            label="Ability score increase"
            value={`${background.abilityScoreOptions.allocation} among ${background.abilityScoreOptions.from
              .map((a) => ABILITY_LABELS[a] ?? a)
              .join(", ")}`}
          />
        )}
        <DetailRow label="Origin feat" value={background.originFeat} />
        {background.feature && (
          <div>
            <p className="font-semibold text-fontcolor">{background.feature.name}</p>
            <p className="mt-1 whitespace-pre-line">{background.feature.description}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SubclassDetails({ subclass }: { subclass: Subclass }) {
  const sortedFeatures = subclass.features.slice().sort((a, b) => a.level - b.level);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{subclass.name}</CardTitle>
        <Badge variant="outline">Subclass</Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 text-sm text-fontcolor-secondary">
        <p>
          {subclass.parentClass} · granted at level {subclass.grantedAtLevel}
          {subclass.casterProgressionOverride &&
            ` · caster progression: ${capitalize(subclass.casterProgressionOverride)}`}
        </p>
        {subclass.description && <p className="whitespace-pre-line">{subclass.description}</p>}
        {sortedFeatures.length > 0 && (
          <div className="flex flex-col gap-2">
            {sortedFeatures.map((feature) => (
              <FeatureEntry key={`${feature.level}-${feature.name}`} feature={feature} reached />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** Shared by `weapons` and `magicWeapons` results - the only difference is the badge, since a magic weapon is still a plain `Weapon` with its magic-item fields filled in (see interfaces/Weapon.ts). */
function WeaponDetails({ weapon, isMagic }: { weapon: Weapon; isMagic: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{weapon.name}</CardTitle>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{isMagic ? "Magic Weapon" : "Weapon"}</Badge>
          {weapon.isCustom && <Badge variant="muted">Homebrew</Badge>}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-1 text-sm text-fontcolor-secondary">
        <div className="mb-2 flex flex-wrap gap-2">
          <Badge variant="muted">{capitalize(weapon.category)}</Badge>
          <Badge variant="muted">{capitalize(weapon.type)}</Badge>
          {weapon.mastery && <Badge variant="muted">{weapon.mastery}</Badge>}
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
        <DetailRow label="Weight" value={weapon.weight ? `${weapon.weight} lb.` : undefined} />
        <DetailRow label="Cost" value={weapon.cost} />
        {weapon.rarity && <DetailRow label="Rarity" value={capitalize(weapon.rarity)} />}
        <DetailRow label="Attunement" value={attunementLabel(weapon.requiresAttunement)} />
        <DetailRow label="Magic effect" value={weapon.magicDescription} />
      </CardContent>
    </Card>
  );
}

/** Shared by `armor` and `magicArmor` results, same reasoning as WeaponDetails above. A shield (Armor.category === "shield") gets slightly different labels (AC bonus instead of base AC, no dex-modifier row). */
function ArmorDetails({ armor, isMagic }: { armor: Armor; isMagic: boolean }) {
  const isShield = armor.category === "shield";
  const dex = armor.dexterityModifier;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{armor.name}</CardTitle>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{isShield ? "Shield" : isMagic ? "Magic Armor" : "Armor"}</Badge>
          {armor.isCustom && <Badge variant="muted">Homebrew</Badge>}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-1 text-sm text-fontcolor-secondary">
        <Badge variant="muted" className="mb-2 w-fit">
          {capitalize(armor.category)}
        </Badge>
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
      </CardContent>
    </Card>
  );
}

function MagicItemDetails({ item }: { item: MagicItem }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{item.name}</CardTitle>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{capitalize(item.category)}</Badge>
          <Badge variant="muted">{capitalize(item.rarity)}</Badge>
          {item.isCustom && <Badge variant="muted">Homebrew</Badge>}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm text-fontcolor-secondary">
        <DetailRow label="Attunement" value={attunementLabel(item.requiresAttunement)} />
        {item.charges && (
          <DetailRow
            label="Charges"
            value={`${item.charges.max}${item.charges.rechargeFormula ? ` (${item.charges.rechargeFormula})` : ""}`}
          />
        )}
        <p className="whitespace-pre-line">{item.description}</p>
      </CardContent>
    </Card>
  );
}

/** Feats and spells already have full, self-contained list entries elsewhere on the sheet (FeatEntry, SpellEntry) - reused here as-is inside a Card so a compendium search result looks like every other detail view on this page, rather than re-implementing the same fields a second time. SpellEntry gets `spellcasting={null}` since there's no character context on this page, which just hides its "roll attack"/"roll damage" buttons. */
function FeatDetails({ feat }: { feat: Feat }) {
  return (
    <Card>
      <CardContent>
        <FeatEntry feat={feat} />
      </CardContent>
    </Card>
  );
}

function SpellDetails({ spell }: { spell: Spell }) {
  return (
    <Card>
      <CardContent>
        <SpellEntry spell={spell} spellcasting={null} />
      </CardContent>
    </Card>
  );
}

type SearchResultDetailProps = {
  type: SearchableType;
  /**
   * Loosely typed on purpose - it's whatever `getSpecificItem` found for
   * `type` (that helper's own return type is likewise untyped, see
   * data/index.ts), narrowed per-branch below by the `type` switch instead
   * of a runtime shape check.
   */
  item: any;
};

/**
 * Renders the right detail view for one compendium search result, keyed by
 * which `Ruleset` list it came from - a race/species, class, background,
 * feat, subclass, weapon (mundane or magic), armor/shield (mundane or
 * magic), spell, or other magic item all show meaningfully different
 * fields, so unlike a single generic "name + description" card, each type
 * gets its own layout built from that type's actual interface.
 */
export function SearchResultDetail({ type, item }: SearchResultDetailProps) {
  switch (type) {
    case "races":
      return <RaceDetails race={item as Race} />;
    case "classes":
      return <ClassDetails characterClass={item as CharacterClass} />;
    case "backgrounds":
      return <BackgroundDetails background={item as Background} />;
    case "feats":
      return <FeatDetails feat={item as Feat} />;
    case "subclasses":
      return <SubclassDetails subclass={item as Subclass} />;
    case "weapons":
      return <WeaponDetails weapon={item as Weapon} isMagic={false} />;
    case "magicWeapons":
      return <WeaponDetails weapon={item as Weapon} isMagic />;
    case "armor":
      return <ArmorDetails armor={item as Armor} isMagic={false} />;
    case "magicArmor":
      return <ArmorDetails armor={item as Armor} isMagic />;
    case "spells":
      return <SpellDetails spell={item as Spell} />;
    case "magicItems":
      return <MagicItemDetails item={item as MagicItem} />;
    default:
      return null;
  }
}
