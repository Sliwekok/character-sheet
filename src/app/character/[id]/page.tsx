"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Nav from "../../layout/nav";
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
  StatBlock,
  formatModifier,
} from "@/components/ui";
import { StoredCharacter } from "@/interfaces/StoredCharacter";
import { Spell } from "@/interfaces/Spell";
import { getCharacterLevel } from "@/interfaces/Characters";
import { deleteCharacter, loadCharacter } from "@/utils/storage";
import { downloadCharacterAsJson } from "@/utils/characterImportExport";
import { calculateAbilityModifiers } from "@/utils/abilityModifiers";
import { calculateArmorClass } from "@/utils/calculateArmorClass";
import { getPactMagicSlots, getSpellSlots } from "@/utils/spellcasting";
import { levelLabel } from "@/components/character/wizard/SpellsStep";

const ABILITY_LABELS: { key: keyof StoredCharacter["abilityScores"]; label: string }[] = [
  { key: "strength", label: "STR" },
  { key: "dexterity", label: "DEX" },
  { key: "constitution", label: "CON" },
  { key: "intelligence", label: "INT" },
  { key: "wisdom", label: "WIS" },
  { key: "charisma", label: "CHA" },
];

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

function formatSlots(slots: Record<number, number> | null, label: string) {
  if (!slots) return null;
  const entries = Object.entries(slots).filter(([, count]) => (count ?? 0) > 0);
  if (entries.length === 0) return null;
  return (
    <p>
      <span className="font-semibold text-fontcolor">{label}:</span>{" "}
      {entries
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([level, count]) => `${count}× ${levelLabel(Number(level))}`)
        .join(", ")}
    </p>
  );
}

/**
 * Read-only "character sheet" view - everything about a saved character in
 * one place, including spells known, which previously had nowhere to be
 * shown at all (the wizard collected `spellsKnown` but no page ever
 * rendered it - see SpellsStep). Clicking a character on /home lands here
 * now instead of jumping straight into editing (see CharacterCard); this
 * page's "Edit character" button is the new way in.
 */
export default function CharacterDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  // Drives the "Delete character" confirmation alert below - kept separate
  // from `character` so closing it doesn't touch the loaded data.
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // `null` once loaded means "no such character" - kept distinct from the
  // initial `undefined` "still loading" state so the not-found message
  // doesn't flash before storage has even been read (storage is
  // browser-only, see utils/storage.ts, hence the effect instead of reading
  // during render - same reasoning as /home).
  const [character, setCharacter] = useState<StoredCharacter | null | undefined>(undefined);

  useEffect(() => {
    setCharacter(loadCharacter(id) ?? null);
  }, [id]);

  const derived = useMemo(() => {
    if (!character) return null;
    return {
      modifiers: calculateAbilityModifiers(character.abilityScores),
      ac: calculateArmorClass(character),
      spellSlots: getSpellSlots(character),
      pactMagicSlots: getPactMagicSlots(character),
    };
  }, [character]);

  if (character === undefined) {
    return (
      <>
        <Nav />
        <Container children="lg" size="lg" className="pb-24" />
      </>
    );
  }

  if (character === null) {
    return (
      <>
        <Nav />
        <Container size="md" className="pb-24">
          <Card>
            <CardContent className="flex flex-col items-start gap-3 text-sm text-fontcolor-secondary">
              <p>No character found with that id - it may have been deleted.</p>
              <Button href="/home">Back to characters</Button>
            </CardContent>
          </Card>
        </Container>
      </>
    );
  }

  const { modifiers, ac, spellSlots, pactMagicSlots } = derived!;
  const classSummary = character.classes
    .map((entry) => `${entry.class.name}${entry.subclass ? ` (${entry.subclass.name})` : ""} ${entry.level}`)
    .join(", ");
  const stats = ABILITY_LABELS.map(({ key, label }) => ({ label, value: formatModifier(modifiers[key]) }));
  const spellGroups = groupSpellsByLevel(character.spellsKnown);

  function handleDeleteCharacter() {
    if (!character?.id) return false;
    deleteCharacter(character.id);
    router.push("/home");
  }

  return (
    <>
      <Nav />

      {showDeleteConfirm && (
        <Alert
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

      <Container size="lg" className="pb-24">
        <SectionHeading
          eyebrow="Character sheet"
          title={character.name}
          subtitle={`${character.race.name} ${classSummary} · ${character.edition} rules · Level ${getCharacterLevel(
            character
          )}`}
        />

        <div className="mt-8 flex flex-col gap-6">
          <Card>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-3">
                  <Badge variant="solid">AC {ac}</Badge>
                  <Badge variant="muted">
                    HP {character.currentHP}/{character.maxHP}
                  </Badge>
                  <Badge variant="muted">Initiative {formatModifier(character.initiative)}</Badge>
                </div>
                <Badge variant="outline">{character.alignment}</Badge>
              </div>

              <StatBlock stats={stats} />
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
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
                <p>Skills: {character.skillProficiencies.join(", ") || "None"}</p>
                <p>Saving throws: {character.savingThrowProficiencies.join(", ") || "None"}</p>
                <p>Languages: {character.languages.join(", ") || "None"}</p>
                {character.feats.length > 0 && <p>Feats: {character.feats.map((feat) => feat.name).join(", ")}</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Equipment</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 text-sm text-fontcolor-secondary">
                <p>
                  Armor: {character.equippedArmor?.name ?? "Unarmored"}
                  {character.shield ? ` + ${character.shield.name}` : ""}
                </p>
                <p>Weapons: {character.weapons.map((weapon) => weapon.name).join(", ") || "None"}</p>
                {character.magicItems && character.magicItems.length > 0 && (
                  <p>Magic items: {character.magicItems.map((item) => item.name).join(", ")}</p>
                )}
                <p>
                  Currency: {character.currency.gold}gp, {character.currency.silver}sp, {character.currency.copper}cp
                  {character.currency.electrum ? `, ${character.currency.electrum}ep` : ""}
                  {character.currency.platinum ? `, ${character.currency.platinum}pp` : ""}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Spells</CardTitle>
              {character.spellsKnown.length > 0 && (
                <Badge variant="muted">
                  {character.spellsKnown.length} known
                </Badge>
              )}
            </CardHeader>
            <CardContent className="flex flex-col gap-4 text-sm text-fontcolor-secondary">
              {(spellSlots || pactMagicSlots) && (
                <div className="flex flex-col gap-1 border-b border-border pb-3">
                  {formatSlots(spellSlots, "Spell slots")}
                  {formatSlots(pactMagicSlots, "Pact Magic slots")}
                </div>
              )}

              {spellGroups.length === 0 ? (
                <p>
                  {character.classes.some((entry) => entry.class.casterProgression !== "none" || entry.subclass?.casterProgressionOverride)
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
                        <div key={spell.name} className="rounded-(--radius-sm) bg-background-darken/60 px-3 py-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-fontcolor">{spell.name}</span>
                            <Badge variant="outline">{spell.school}</Badge>
                            {spell.ritual && <Badge variant="muted">Ritual</Badge>}
                            {spell.concentration && <Badge variant="muted">Concentration</Badge>}
                          </div>
                          <p className="mt-1 text-xs">
                            {spell.castingTime} · {spell.range} · {spell.components.join(", ")} · {spell.duration}
                          </p>
                          <p className="mt-2 whitespace-pre-line">{spell.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-6">
            <Button href={`/newCharacter/manual?edit=${character.id}`}>Edit character</Button>
            <Button variant="secondary" href={`/character/${character.id}/print`}>
              Print / Save as PDF
            </Button>
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
    </>
  );
}
