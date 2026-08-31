import { useMemo, useState } from "react";
import { CharacterClass } from "@/interfaces/CharacterClass";
import { Background } from "@/interfaces/Background";
import { Armor } from "@/interfaces/Armor";
import { Weapon } from "@/interfaces/Weapon";
import { SkillName } from "@/interfaces/Skill";
import { Ruleset } from "@/data";
import { Card, CardContent } from "@/components/ui";
import { classCanUseArmor, classCanUseWeapon } from "@/utils/proficiencyMatch";
import { cn } from "@/utils/cn";
import { ItemDetailPanel, SelectedEquipmentItem } from "./ItemDetailPanel";

type SkillsEquipmentStepProps = {
  ruleset: Ruleset;
  characterClass: CharacterClass;
  background: Background;
  skillProficiencies: SkillName[];
  equippedArmor: Armor | undefined;
  shield: Armor | undefined;
  weapons: Weapon[];
  onSkillsChange: (skills: SkillName[]) => void;
  onArmorChange: (armor: Armor | undefined) => void;
  onShieldChange: (shield: Armor | undefined) => void;
  onWeaponsChange: (weapons: Weapon[]) => void;
};

function pillClass(selected: boolean, disabled?: boolean): string {
  return cn(
    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
    selected
      ? "border-foreground bg-foreground text-background-darken"
      : "border-border-strong text-fontcolor-secondary hover:border-foreground",
    disabled && "opacity-40"
  );
}

/**
 * Skills granted automatically by `background` aren't offered again here -
 * RAW you'd pick a different proficiency instead of a true duplicate; this
 * step just excludes the overlap rather than modeling that replacement
 * choice (see the same simplification noted in utils/randomCharacter.ts).
 *
 * Clicking any pill below (skill, weapon, armor, or shield) both toggles it
 * on the draft AND drives the `ItemDetailPanel` on the right, showing that
 * item's full data. `selectedItem` is transient view state, not character
 * data, so - unlike every other piece of state on this step - it lives
 * here rather than being lifted to ManualWizard's draft.
 */
export function SkillsEquipmentStep({
  ruleset,
  characterClass,
  background,
  skillProficiencies,
  equippedArmor,
  shield,
  weapons,
  onSkillsChange,
  onArmorChange,
  onShieldChange,
  onWeaponsChange,
}: SkillsEquipmentStepProps) {
  const [selectedItem, setSelectedItem] = useState<SelectedEquipmentItem | undefined>(undefined);

  const skillPool = characterClass.proficiencies.skills.from.filter(
    (skill) => !background.skillProficiencies.includes(skill)
  );
  const skillLimit = characterClass.proficiencies.skills.choose;

  const armorOptions = useMemo(
    () => ruleset.armor.filter((a) => a.category !== "shield" && classCanUseArmor(characterClass, a)),
    [ruleset.armor, characterClass]
  );
  const shieldOptions = useMemo(
    () => ruleset.armor.filter((a) => a.category === "shield" && classCanUseArmor(characterClass, a)),
    [ruleset.armor, characterClass]
  );
  const weaponOptions = useMemo(
    () => ruleset.weapons.filter((w) => classCanUseWeapon(characterClass, w)),
    [ruleset.weapons, characterClass]
  );

  function selectSkill(skill: SkillName) {
    const selected = skillProficiencies.includes(skill);
    if (selected) {
      onSkillsChange(skillProficiencies.filter((s) => s !== skill));
    } else if (skillProficiencies.length < skillLimit) {
      onSkillsChange([...skillProficiencies, skill]);
    } else {
      return; // at the limit - the button is disabled, but guard just in case
    }
    setSelectedItem({ kind: "skill", skill, selected: !selected });
  }

  function selectWeapon(weapon: Weapon) {
    const selected = weapons.some((w) => w.name === weapon.name);
    onWeaponsChange(selected ? weapons.filter((w) => w.name !== weapon.name) : [...weapons, weapon]);
    setSelectedItem({ kind: "weapon", weapon, selected: !selected });
  }

  function selectArmor(option: Armor) {
    const equipped = equippedArmor?.name === option.name;
    onArmorChange(equipped ? undefined : option);
    setSelectedItem({ kind: "armor", armor: option, equipped: !equipped });
  }

  function clearArmor() {
    onArmorChange(undefined);
    setSelectedItem(undefined);
  }

  function selectShield(option: Armor) {
    const equipped = shield?.name === option.name;
    onShieldChange(equipped ? undefined : option);
    setSelectedItem({ kind: "shield", armor: option, equipped: !equipped });
  }

  function clearShield() {
    onShieldChange(undefined);
    setSelectedItem(undefined);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
      <div className="flex flex-col gap-6">
        <Card>
          <CardContent className="flex flex-col gap-3">
            <p className="text-sm font-medium text-fontcolor-secondary">
              Class skills — choose {skillLimit} ({skillProficiencies.length}/{skillLimit} selected)
            </p>
            <div className="flex flex-wrap gap-2">
              {skillPool.map((skill) => {
                const selected = skillProficiencies.includes(skill);
                const disabled = !selected && skillProficiencies.length >= skillLimit;
                return (
                  <button
                    key={skill}
                    type="button"
                    disabled={disabled}
                    onClick={() => selectSkill(skill)}
                    className={pillClass(selected, disabled)}
                  >
                    {skill}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-fontcolor-secondary">
              Already granted by background: {background.skillProficiencies.join(", ")}
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="flex flex-col gap-3">
              <p className="text-sm font-medium text-fontcolor-secondary">Armor</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={clearArmor} className={pillClass(!equippedArmor)}>
                  Unarmored
                </button>
                {armorOptions.map((option) => {
                  const selected = equippedArmor?.name === option.name;
                  return (
                    <button
                      key={option.name}
                      type="button"
                      onClick={() => selectArmor(option)}
                      className={pillClass(selected)}
                    >
                      {option.name} (AC {option.baseAC})
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-3">
              <p className="text-sm font-medium text-fontcolor-secondary">Shield</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={clearShield}
                  disabled={shieldOptions.length === 0}
                  className={pillClass(!shield, shieldOptions.length === 0)}
                >
                  None
                </button>
                {shieldOptions.map((option) => {
                  const selected = shield?.name === option.name;
                  return (
                    <button
                      key={option.name}
                      type="button"
                      onClick={() => selectShield(option)}
                      className={pillClass(selected)}
                    >
                      {option.name} (+{option.baseAC})
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="flex flex-col gap-3">
            <p className="text-sm font-medium text-fontcolor-secondary">Weapons</p>
            <div className="flex flex-wrap gap-2">
              {weaponOptions.map((weapon) => {
                const selected = weapons.some((w) => w.name === weapon.name);
                return (
                  <button
                    key={weapon.name}
                    type="button"
                    onClick={() => selectWeapon(weapon)}
                    className={pillClass(selected)}
                  >
                    {weapon.name} ({weapon.damage.dice} {weapon.damage.type})
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <ItemDetailPanel item={selectedItem} className="lg:sticky lg:top-6" />
    </div>
  );
}
