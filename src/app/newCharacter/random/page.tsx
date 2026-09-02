"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardContent, Container, SectionHeading, Select, TextInput } from "@/components/ui";
import { Edition } from "@/interfaces/Edition";
import { StoredCharacter } from "@/interfaces/StoredCharacter";
import { getRuleset } from "@/data";
import { generateRandomCharacter, RandomCharacterOverrides } from "@/utils/randomCharacter";
import { draftFromCharacter, finalizeDraft } from "@/utils/characterDraft";
import { saveCharacter } from "@/utils/storage";
import { ReviewStep } from "@/components/character/wizard/ReviewStep";
import { ALIGNMENTS } from "@/utils/randomNames";

type Mode = "choose" | "guided-form" | "result";

export default function RandomCharacterPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("choose");
  const [overrides, setOverrides] = useState<RandomCharacterOverrides>({});
  const [generated, setGenerated] = useState<StoredCharacter | null>(null);

  const ruleset = useMemo(() => (overrides.edition ? getRuleset(overrides.edition) : null), [overrides.edition]);

  function generate(withOverrides: RandomCharacterOverrides) {
    setGenerated(generateRandomCharacter(withOverrides));
    setMode("result");
  }

  function handleSave() {
    if (!generated) return;
    const finalized = finalizeDraft(draftFromCharacter(generated));
    if (!finalized) return;
    saveCharacter(finalized);
    router.push("/home");
  }

  return (
    <>
      <Container size="lg" className="pb-24">
        <SectionHeading
          eyebrow="New character"
          title="Random"
          subtitle="Generate a character in one click, or lock in a few basics first."
        />

        <div className="mt-8 flex flex-col gap-8">
          {mode === "choose" && (
            <div className="grid gap-6 sm:grid-cols-2">
              <Card>
                <CardContent className="flex flex-col gap-3">
                  <span className="text-3xl">🎲</span>
                  <h3 className="font-display text-xl tracking-wide text-fontcolor">All random</h3>
                  <p className="text-sm text-fontcolor-secondary">
                    Randomizes everything, including which edition to use - race, class, level, ability
                    scores, background, skills, equipment, name, and alignment.
                  </p>
                  <Button className="mt-2 w-fit" onClick={() => generate({})}>
                    Generate character
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex flex-col gap-3">
                  <span className="text-3xl">🧭</span>
                  <h3 className="font-display text-xl tracking-wide text-fontcolor">Guided random</h3>
                  <p className="text-sm text-fontcolor-secondary">
                    Pin down the basics - name, level, race, class - and everything else (ability
                    scores, background, skills, equipment) is randomized around them.
                  </p>
                  <Button
                    className="mt-2 w-fit"
                    variant="secondary"
                    onClick={() => setMode("guided-form")}
                  >
                    Choose basics
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {mode === "guided-form" && (
            <Card>
              <CardContent className="flex flex-col gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-fontcolor-secondary">Edition</span>
                    <Select
                      value={overrides.edition ?? ""}
                      onChange={(event) =>
                        setOverrides((o) => ({
                          ...o,
                          edition: (event.target.value || undefined) as Edition | undefined,
                          raceName: undefined,
                          className: undefined,
                        }))
                      }
                    >
                      <option value="">Random</option>
                      <option value="2014">2014</option>
                      <option value="2024">2024</option>
                    </Select>
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-fontcolor-secondary">Name</span>
                    <TextInput
                      value={overrides.name ?? ""}
                      placeholder="Random"
                      onChange={(event) => setOverrides((o) => ({ ...o, name: event.target.value }))}
                    />
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-fontcolor-secondary">Level</span>
                    <TextInput
                      type="number"
                      min={1}
                      max={20}
                      placeholder="Random (1-10)"
                      value={overrides.level ?? ""}
                      onChange={(event) =>
                        setOverrides((o) => ({
                          ...o,
                          level: event.target.value ? Number(event.target.value) : undefined,
                        }))
                      }
                    />
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-fontcolor-secondary">Alignment</span>
                    <Select
                      value={overrides.alignment ?? ""}
                      onChange={(event) => setOverrides((o) => ({ ...o, alignment: event.target.value || undefined }))}
                    >
                      <option value="">Random</option>
                      {ALIGNMENTS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </Select>
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-fontcolor-secondary">Race</span>
                    <Select
                      value={overrides.raceName ?? ""}
                      disabled={!ruleset}
                      onChange={(event) => setOverrides((o) => ({ ...o, raceName: event.target.value || undefined }))}
                    >
                      <option value="">{ruleset ? "Random" : "Choose an edition first"}</option>
                      {ruleset?.races.map((race) => (
                        <option key={race.name} value={race.name}>
                          {race.name}
                        </option>
                      ))}
                    </Select>
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-fontcolor-secondary">Class</span>
                    <Select
                      value={overrides.className ?? ""}
                      disabled={!ruleset}
                      onChange={(event) => setOverrides((o) => ({ ...o, className: event.target.value || undefined }))}
                    >
                      <option value="">{ruleset ? "Random" : "Choose an edition first"}</option>
                      {ruleset?.classes.map((characterClass) => (
                        <option key={characterClass.name} value={characterClass.name}>
                          {characterClass.name}
                        </option>
                      ))}
                    </Select>
                  </label>
                </div>

                <div className="flex items-center gap-3 border-t border-border pt-4">
                  <Button variant="secondary" onClick={() => setMode("choose")}>
                    Back
                  </Button>
                  <Button onClick={() => generate(overrides)}>Generate character</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {mode === "result" && generated && (
            <ReviewStep
              draft={draftFromCharacter(generated)}
              isEditing={false}
              onSave={handleSave}
              extraActions={
                <Button variant="secondary" onClick={() => generate(overrides)}>
                  🎲 Reroll
                </Button>
              }
            />
          )}
        </div>
      </Container>
    </>
  );
}
