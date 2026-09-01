"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { StoredCharacter } from "@/interfaces/StoredCharacter";
import { AbilityScores } from "@/interfaces/Characters";
import { loadCharacter } from "@/utils/storage";
import { calculateAbilityModifiers } from "@/utils/abilityModifiers";
import { calculateArmorClass } from "@/utils/calculateArmorClass";
import { calculateProficiencyBonus } from "@/utils/calculateProficiencyBonus";
import { getPactMagicSlots, getSpellSlots } from "@/utils/spellcasting";
import {
  ABILITY_ORDER,
  ABILITY_SHORT,
  SKILL_LIST,
  classAndLevelLabel,
  formatMod,
  groupSpellsByLevel,
  hitDiceLabel,
  isProficientInSave,
  isProficientInSkill,
  isSpellcaster,
  primarySpellcastingEntry,
  saveModifier,
  skillModifier,
} from "./printHelpers";
import styles from "./print.module.css";

/** Weapon's attack-roll ability: DEX for ranged weapons, the better of STR/DEX for finesse, STR otherwise. */
function weaponAbilityModifier(
  weapon: StoredCharacter["weapons"][number],
  modifiers: Record<keyof AbilityScores, number>
): number {
  if (weapon.type === "ranged") return modifiers.dexterity;
  if (weapon.properties.includes("finesse")) return Math.max(modifiers.strength, modifiers.dexterity);
  return modifiers.strength;
}

function Pips({ total, filled }: { total: number; filled: number }) {
  return (
    <span className={styles.slotPips}>
      {Array.from({ length: total }).map((_, index) => (
        <span
          key={index}
          className={`${styles.circlePip} ${index < filled ? styles.circlePipFilled : ""}`}
        />
      ))}
    </span>
  );
}

/** The name ribbon + bordered field-grid pair every sheet's header uses - two visually separate elements sitting side by side, matching the source sheet's banner + info-box layout (minus its dragon illustration, which is copyrighted artwork this project can't embed). */
function SheetBanner({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div className={styles.banner}>
      <div className={styles.bannerName}>{name}</div>
      <div className={styles.bannerFieldsBox}>{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div className={styles.bannerField}>
      <span className={styles.fieldLabel}>{label}</span>
      <span className={styles.fieldValue}>{value || ""}</span>
    </div>
  );
}

export default function PrintCharacterSheet() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [character, setCharacter] = useState<StoredCharacter | null | undefined>(undefined);

  useEffect(() => {
    setCharacter(loadCharacter(id) ?? null);
  }, [id]);

  const derived = useMemo(() => {
    if (!character) return null;

    const modifiers = calculateAbilityModifiers(character.abilityScores);
    const proficiencyBonus = calculateProficiencyBonus(character);
    const ac = calculateArmorClass(character);
    const passivePerception = 10 + skillModifier(character, "Perception", modifiers, proficiencyBonus);
    const details = character.details ?? {};

    const armorProficiencies = new Set<string>();
    const weaponProficiencies = new Set<string>();
    const toolProficiencies = new Set<string>();
    character.classes.forEach((entry, index) => {
      const profs = index === 0 ? entry.class.proficiencies : entry.class.multiclassProficiencies ?? {};
      profs.armor?.forEach((a) => armorProficiencies.add(a));
      profs.weapons?.forEach((w) => weaponProficiencies.add(w));
      profs.tools?.forEach((t) => toolProficiencies.add(t));
    });
    if (character.background.toolProficiency) toolProficiencies.add(character.background.toolProficiency);

    // Spell save DC / attack bonus use the universal RAW formula (8/0 + prof
    // bonus + spellcasting ability modifier) rather than each class's own
    // `spellcasting.spellSaveDC`/`spellAttackBonus` functions - none of the
    // class data in this app actually implements those optional fields, so
    // relying on them would leave this always blank.
    const spellEntry = primarySpellcastingEntry(character);
    const spellAbility = spellEntry?.class.spellcasting?.ability;
    const spellSaveDC = spellAbility !== undefined ? 8 + proficiencyBonus + modifiers[spellAbility] : undefined;
    const spellAttackBonus = spellAbility !== undefined ? proficiencyBonus + modifiers[spellAbility] : undefined;

    const sharedSlots = getSpellSlots(character) ?? {};
    const pactSlots = getPactMagicSlots(character) ?? {};
    const slotsByLevel: Record<number, number> = {};
    for (let level = 1; level <= 9; level++) {
      const total = (sharedSlots[level] ?? 0) + (pactSlots[level] ?? 0);
      if (total > 0) slotsByLevel[level] = total;
    }

    const spellGroups = groupSpellsByLevel(character.spellsKnown);

    const featureLines = [
      ...character.classes.flatMap((entry) =>
        (entry.subclass?.features ?? [])
          .filter((feature) => feature.level <= entry.level)
          .map((feature) => feature.name)
      ),
      ...character.feats.map((feat) => feat.name),
    ];

    return {
      modifiers,
      proficiencyBonus,
      ac,
      passivePerception,
      details,
      armorProficiencies: [...armorProficiencies],
      weaponProficiencies: [...weaponProficiencies],
      toolProficiencies: [...toolProficiencies],
      spellAbility,
      spellSaveDC,
      spellAttackBonus,
      spellClassName: spellEntry?.class.name,
      slotsByLevel,
      spellGroups,
      featureLines,
      showSpellSheet: isSpellcaster(character),
    };
  }, [character]);

  if (character === undefined) return null;

  if (character === null) {
    return (
      <div className={styles.toolbar}>
        <p>No character found with that id - it may have been deleted.</p>
        <Link href="/home" className={styles.backLink}>
          Back to characters
        </Link>
      </div>
    );
  }

  const {
    modifiers,
    proficiencyBonus,
    ac,
    passivePerception,
    details,
    armorProficiencies,
    weaponProficiencies,
    toolProficiencies,
    spellAbility,
    spellSaveDC,
    spellAttackBonus,
    spellClassName,
    slotsByLevel,
    spellGroups,
    featureLines,
    showSpellSheet,
  } = derived!;

  const equipmentLines = [
    character.equippedArmor ? character.equippedArmor.name : null,
    character.shield ? character.shield.name : null,
    ...(character.magicItems ?? []).map((item) => item.name),
  ].filter(Boolean) as string[];

  const otherProficienciesText = [
    armorProficiencies.length > 0 ? `Armor: ${armorProficiencies.join(", ")}` : null,
    weaponProficiencies.length > 0 ? `Weapons: ${weaponProficiencies.join(", ")}` : null,
    toolProficiencies.length > 0 ? `Tools: ${toolProficiencies.join(", ")}` : null,
    character.languages.length > 0 ? `Languages: ${character.languages.join(", ")}` : null,
    details.otherProficienciesNotes || null,
  ]
    .filter(Boolean)
    .join("\n");

  const featuresText = [featureLines.join(", "), details.featuresAndTraitsNotes].filter(Boolean).join("\n\n");

  return (
    <>
      <div className={`${styles.toolbar} ${styles.noPrint}`}>
        <div className={styles.toolbarLinks}>
          <Link href={`/character/${character.id}`} className={styles.backLink}>
            ← Back to {character.name}
          </Link>
        </div>
        <button className={styles.printButton} onClick={() => window.print()}>
          Print / Save as PDF
        </button>
      </div>

      <div className={styles.sheetWrapper}>
        {/* ---------------- PAGE 1: core sheet ---------------- */}
        <section className={styles.page}>
          <SheetBanner name={character.name || "Unnamed character"}>
            <div className={`${styles.bannerFields} ${styles.bannerRow1}`}>
              <Field label="Class & Level" value={classAndLevelLabel(character)} />
              <Field label="Background" value={character.background.name} />
              <Field label="Player Name" value={details.playerName} />
            </div>
            <div className={styles.bannerFields}>
              <Field label="Race" value={character.race.name} />
              <Field label="Alignment" value={character.alignment} />
              <Field label="Experience Points" />
            </div>
          </SheetBanner>

          <div className={styles.body1}>
            {/* Column 1: ability scores */}
            <div className={`${styles.col} ${styles.abilityCol}`}>
              {ABILITY_ORDER.map((ability) => (
                <div key={ability} className={styles.abilityBox}>
                  <span className={styles.abilityLabel}>{ABILITY_SHORT[ability]}</span>
                  <span className={styles.abilityCircle}>{formatMod(modifiers[ability])}</span>
                  <span className={styles.abilityScoreTab}>{character.abilityScores[ability]}</span>
                </div>
              ))}
            </div>

            {/* Column 2: inspiration, prof bonus, saves, skills, passive perception, other proficiencies */}
            <div className={styles.col}>
              <div className={`${styles.inspirationRow} ${styles.tagShape}`}>
                <span className={`${styles.circlePip} ${details.inspiration ? styles.circlePipFilled : ""}`} />
                <span className={styles.boxTitleLeft}>Inspiration</span>
              </div>

              <div className={styles.profBonusRow}>
                <span className={styles.bigCircle} style={{ width: 20, height: 20, fontSize: 10 }}>
                  {formatMod(proficiencyBonus)}
                </span>
                <span className={styles.boxTitleLeft}>Proficiency Bonus</span>
              </div>

              <div className={styles.box}>
                <div className={styles.checklist}>
                  {ABILITY_ORDER.map((ability) => (
                    <div key={ability} className={styles.checkRow}>
                      <span
                        className={`${styles.circlePip} ${
                          isProficientInSave(character, ability) ? styles.circlePipFilled : ""
                        }`}
                      />
                      <span className={styles.checkRowMod}>
                        {formatMod(saveModifier(character, ability, modifiers, proficiencyBonus))}
                      </span>
                      <span className={styles.checkRowLabel}>{ABILITY_SHORT[ability]}</span>
                    </div>
                  ))}
                </div>
                <span className={styles.boxTitle}>Saving Throws</span>
              </div>

              <div className={`${styles.box} ${styles.skillsBox}`}>
                <div className={styles.checklist}>
                  {SKILL_LIST.map((skill) => (
                    <div key={skill} className={styles.checkRow}>
                      <span
                        className={`${styles.circlePip} ${
                          isProficientInSkill(character, skill) ? styles.circlePipFilled : ""
                        }`}
                      />
                      <span className={styles.checkRowMod}>
                        {formatMod(skillModifier(character, skill, modifiers, proficiencyBonus))}
                      </span>
                      <span className={styles.checkRowLabel}>{skill}</span>
                    </div>
                  ))}
                </div>
                <span className={styles.boxTitle}>Skills</span>
              </div>

              <div className={styles.passiveBox}>
                <span className={styles.bigCircle} style={{ width: 22, height: 22 }}>
                  {passivePerception}
                </span>
                <span className={styles.boxTitleLeft}>Passive Wisdom (Perception)</span>
              </div>

              <div className={`${styles.box} ${styles.filler}`}>
                <div className={`${styles.freeText} ${styles.ruled}`}>
                  {otherProficienciesText || <span className={styles.placeholder}>—</span>}
                </div>
                <span className={styles.boxTitle}>Other Proficiencies &amp; Languages</span>
              </div>
            </div>

            {/* Column 3: AC/Initiative/Speed, HP, hit dice/death saves, attacks, equipment */}
            <div className={styles.col}>
              <div className={styles.topStatsRow}>
                <div className={`${styles.statBox} ${styles.shieldBox}`}>
                  <span className={styles.statBoxValue}>{ac}</span>
                  <span className={styles.boxTitle}>Armor Class</span>
                </div>
                <div className={styles.statBox}>
                  <span className={styles.statBoxValue}>{formatMod(character.initiative)}</span>
                  <span className={styles.boxTitle}>Initiative</span>
                </div>
                <div className={styles.statBox}>
                  <span className={styles.statBoxValue}>{character.race.speed}</span>
                  <span className={styles.boxTitle}>Speed</span>
                </div>
              </div>

              <div className={styles.hpGroup}>
                <div className={styles.hpMaxRow}>
                  <span>Hit Point Maximum</span>
                  <span>{character.maxHP}</span>
                </div>
                <div className={styles.hpCurrentRow}>{character.currentHP}</div>
                <div className={styles.hpCurrentLabel}>Current Hit Points</div>
                <div className={styles.hpTempRow}>&nbsp;</div>
                <div className={styles.hpTempLabel}>Temporary Hit Points</div>
              </div>

              <div className={styles.hitDiceDeathRow}>
                <div className={styles.box}>
                  <span style={{ textAlign: "center", fontWeight: 700 }}>Total {hitDiceLabel(character)}</span>
                  <span className={styles.boxTitle}>Hit Dice</span>
                </div>
                <div className={styles.box}>
                  <div className={styles.deathSavesRow}>
                    <span>
                      Successes
                      <div className={styles.deathSavesPips}>
                        <Pips total={3} filled={details.deathSaves?.successes ?? 0} />
                      </div>
                    </span>
                    <span>
                      Failures
                      <div className={styles.deathSavesPips}>
                        <Pips total={3} filled={details.deathSaves?.failures ?? 0} />
                      </div>
                    </span>
                  </div>
                  <span className={styles.boxTitle}>Death Saves</span>
                </div>
              </div>

              <div className={`${styles.box} ${styles.attacksBox}`}>
                <table className={styles.attacksTable}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Atk Bonus</th>
                      <th>Damage / Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {character.weapons.length === 0 && (
                      <tr>
                        <td colSpan={3} className={styles.placeholder}>
                          —
                        </td>
                      </tr>
                    )}
                    {character.weapons.map((weapon) => {
                      const abilityMod = weaponAbilityModifier(weapon, modifiers);
                      const atkBonus = abilityMod + proficiencyBonus + (weapon.bonus ?? 0);
                      const damageMod = abilityMod + (weapon.bonus ?? 0);
                      return (
                        <tr key={weapon.name}>
                          <td>{weapon.name}</td>
                          <td>{formatMod(atkBonus)}</td>
                          <td>
                            {weapon.damage.dice}
                            {damageMod !== 0 ? formatMod(damageMod) : ""} {weapon.damage.type}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <span className={styles.boxTitle}>Attacks &amp; Spellcasting</span>
              </div>

              <div className={`${styles.box} ${styles.equipmentBox}`}>
                <div className={styles.currencyColumn}>
                  {(
                    [
                      ["CP", character.currency.copper],
                      ["SP", character.currency.silver],
                      ["EP", character.currency.electrum],
                      ["GP", character.currency.gold],
                      ["PP", character.currency.platinum],
                    ] as const
                  ).map(([label, value]) => (
                    <div key={label} className={styles.currencyPip}>
                      <span>{label}</span>
                      <span>{value}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.filler}>
                  <div className={`${styles.freeText} ${styles.ruled}`}>
                    {equipmentLines.length > 0 ? (
                      equipmentLines.join(", ")
                    ) : (
                      <span className={styles.placeholder}>—</span>
                    )}
                  </div>
                  <span className={styles.boxTitle}>Equipment</span>
                </div>
              </div>
            </div>

            {/* Column 4: personality / ideals / bonds / flaws / features */}
            <div className={styles.col}>
              <div className={`${styles.box} ${styles.flavorBox}`}>
                <div className={`${styles.freeText} ${styles.ruled}`}>
                  {details.flavor?.personalityTraits || <span className={styles.placeholder}>—</span>}
                </div>
                <span className={styles.boxTitle}>Personality Traits</span>
              </div>
              <div className={`${styles.box} ${styles.flavorBox}`}>
                <div className={`${styles.freeText} ${styles.ruled}`}>
                  {details.flavor?.ideals || <span className={styles.placeholder}>—</span>}
                </div>
                <span className={styles.boxTitle}>Ideals</span>
              </div>
              <div className={`${styles.box} ${styles.flavorBox}`}>
                <div className={`${styles.freeText} ${styles.ruled}`}>
                  {details.flavor?.bonds || <span className={styles.placeholder}>—</span>}
                </div>
                <span className={styles.boxTitle}>Bonds</span>
              </div>
              <div className={`${styles.box} ${styles.flavorBox}`}>
                <div className={`${styles.freeText} ${styles.ruled}`}>
                  {details.flavor?.flaws || <span className={styles.placeholder}>—</span>}
                </div>
                <span className={styles.boxTitle}>Flaws</span>
              </div>
              <div className={`${styles.box} ${styles.featuresBox}`}>
                <div className={`${styles.freeText} ${styles.ruled}`}>
                  {featuresText || <span className={styles.placeholder}>—</span>}
                </div>
                <span className={styles.boxTitle}>Features &amp; Traits</span>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- PAGE 2: details sheet ---------------- */}
        <section className={styles.page}>
          <SheetBanner name={character.name || "Unnamed character"}>
            <div className={`${styles.bannerFields} ${styles.bannerRow1}`}>
              <Field label="Age" value={details.appearance?.age} />
              <Field label="Height" value={details.appearance?.height} />
              <Field label="Weight" value={details.appearance?.weight} />
            </div>
            <div className={styles.bannerFields}>
              <Field label="Eyes" value={details.appearance?.eyes} />
              <Field label="Skin" value={details.appearance?.skin} />
              <Field label="Hair" value={details.appearance?.hair} />
            </div>
          </SheetBanner>

          <div className={styles.body2}>
            <div className={styles.col}>
              <div className={styles.portraitBox}>
                <span className={styles.portraitPlaceholder}>Character Portrait</span>
              </div>
              <div className={`${styles.box} ${styles.appearanceBox}`}>
                <div className={`${styles.freeText} ${styles.ruled}`}>
                  {details.appearanceNotes || <span className={styles.placeholder}>—</span>}
                </div>
                <span className={styles.boxTitle}>Character Appearance</span>
              </div>
              <div className={`${styles.box} ${styles.backstoryBox}`}>
                <div className={`${styles.freeText} ${styles.ruled}`}>
                  {details.backstory || <span className={styles.placeholder}>—</span>}
                </div>
                <span className={styles.boxTitle}>Character Backstory</span>
              </div>
            </div>

            <div className={styles.col}>
              <div className={`${styles.box} ${styles.alliesRow}`} style={{ flex: 1 }}>
                <div className={styles.alliesText}>
                  <div className={`${styles.freeText} ${styles.ruled}`}>
                    {details.alliesAndOrganizations || <span className={styles.placeholder}>—</span>}
                  </div>
                  <span className={styles.boxTitle}>Allies &amp; Organizations</span>
                </div>
                <div className={styles.symbolBox}>
                  <span className={styles.fieldLabel}>Name</span>
                  <span className={styles.fieldValue}>{details.organizationSymbolName || ""}</span>
                  <div className={styles.filler} />
                  <span className={styles.boxTitle}>Symbol</span>
                </div>
              </div>
              <div className={styles.box} style={{ flex: 1 }}>
                <div className={`${styles.freeText} ${styles.twoColBox} ${styles.ruled}`}>
                  {details.additionalFeaturesAndTraits || <span className={styles.placeholder}>—</span>}
                </div>
                <span className={styles.boxTitle}>Additional Features &amp; Traits</span>
              </div>
              <div className={styles.box} style={{ flex: 1 }}>
                <div className={`${styles.freeText} ${styles.twoColBox} ${styles.ruled}`}>
                  {details.treasure || <span className={styles.placeholder}>—</span>}
                </div>
                <span className={styles.boxTitle}>Treasure</span>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- PAGE 3: spellcasting sheet ---------------- */}
        {showSpellSheet && (
          <section className={styles.page}>
            <SheetBanner name={spellClassName ?? "Spellcasting"}>
              <div className={styles.bannerFields} style={{ flex: 1 }}>
                <Field label="Spellcasting Ability" value={spellAbility ? ABILITY_SHORT[spellAbility] : undefined} />
                <Field label="Spell Save DC" value={spellSaveDC !== undefined ? String(spellSaveDC) : undefined} />
                <Field
                  label="Spell Attack Bonus"
                  value={spellAttackBonus !== undefined ? formatMod(spellAttackBonus) : undefined}
                />
              </div>
            </SheetBanner>

            <div className={styles.body3}>
              {[
                [0, 1, 2],
                [3, 4, 5],
                [6, 7, 8, 9],
              ].map((column, columnIndex) => (
                <div key={columnIndex} className={styles.spellColumn}>
                  {column.map((level) => {
                    const spells = spellGroups.get(level) ?? [];
                    const totalSlots = level === 0 ? undefined : slotsByLevel[level] ?? 0;
                    const rowCount = Math.max(spells.length, level === 0 ? 6 : 4);
                    return (
                      <div key={level} className={styles.levelBox}>
                        <div className={`${styles.levelHeader} ${styles.tagShape}`}>
                          <span className={styles.levelNumber}>
                            {level === 0 ? "Cantrips" : `${level}${level === 1 ? "st" : level === 2 ? "nd" : level === 3 ? "rd" : "th"} Level`}
                          </span>
                          {level > 0 && (
                            <span className={styles.slotsInfo}>
                              Slots: {totalSlots}
                              <br />
                              <Pips total={totalSlots ?? 0} filled={0} />
                            </span>
                          )}
                        </div>
                        {Array.from({ length: rowCount }).map((_, rowIndex) => {
                          const spell = spells[rowIndex];
                          return (
                            <div key={rowIndex} className={styles.spellRow}>
                              {level > 0 && <span className={styles.circlePip} />}
                              <span>{spell?.name ?? ""}</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
