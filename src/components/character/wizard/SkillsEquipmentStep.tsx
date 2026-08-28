import { useMemo } from "react";
import { CharacterClass } from "@/interfaces/CharacterClass";
import { Background } from "@/interfaces/Background";
import { Armor } from "@/interfaces/Armor";
import { Weapon } from "@/interfaces/Weapon";
import { SkillName } from "@/interfaces/Skill";
import { Ruleset } from "@/data";
import { Card, CardContent, Select } from "@/components/ui";
import { classCanUseArmor, classCanUseWeapon } from "@/utils/proficiencyMatch";
import { cn } from "@/utils/cn";

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

/**
 * Skills granted automatically by `background` aren't offered again here -
 * RAW you'd pick a different proficiency instead of a true duplicate; this
 * step just excludes the overlap rather than modeling that replacement
 * choice (see the same simplification noted in utils/randomCharacter.ts).
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

  function toggleSkill(skill: SkillName) {
    if (skillProficiencies.includes(skill)) {
      onSkillsChange(skillProficiencies.filter((s) => s !== skill));
    } else if (skillProficiencies.length < skillLimit) {
      onSkillsChange([...skillProficiencies, skill]);
    }
  }

  function toggleWeapon(weapon: Weapon) {
    const selected = weapons.some((w) => w.name === weapon.name);
    onWeaponsChange(
      selected ? weapons.filter((w) => w.name !== weapon.name) : [...weapons, weapon]
    );
  }

  return (
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
                  onClick={() => toggleSkill(skill)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    selected
                      ? "border-foreground bg-foreground text-background-darken"
                      : "border-border-strong text-fontcolor-secondary hover:border-foreground",
                    disabled && "opacity-40"
                  )}
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
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-fontcolor-secondary">Armor</span>
          <Select
            value={equippedArmor?.name ?? ""}
            onChange={(event) => onArmorChange(armorOptions.find((a) => a.name === event.target.value))}
          >
            <option value="">Unarmored</option>
            {armorOptions.map((option) => (
              <option key={option.name} value={option.name}>
                {option.name} (AC {option.baseAC})
              </option>
            ))}
          </Select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-fontcolor-secondary">Shield</span>
          <Select
            value={shield?.name ?? ""}
            disabled={shieldOptions.length === 0}
            onChange={(event) => onShieldChange(shieldOptions.find((s) => s.name === event.target.value))}
          >
            <option value="">None</option>
            {shieldOptions.map((option) => (
              <option key={option.name} value={option.name}>
                {option.name} (+{option.baseAC})
              </option>
            ))}
          </Select>
        </label>
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
                  onClick={() => toggleWeapon(weapon)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    selected
                      ? "border-foreground bg-foreground text-background-darken"
                      : "border-border-strong text-fontcolor-secondary hover:border-foreground"
                  )}
                >
                  {weapon.name} ({weapon.damage.dice} {weapon.damage.type})
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
