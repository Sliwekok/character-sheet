"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {Button, Card, CardContent, Combobox, Container, SectionHeading, Select, TextInput} from "@/components/ui";
import { Edition } from "@/interfaces/Edition";
import { StoredCharacter } from "@/interfaces/StoredCharacter";
import { getRulesetAsync, Ruleset } from "@/data";
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
  const [isGenerating, setIsGenerating] = useState(false);

  // Only needed here to populate the guided form's race/class pickers with
  // a specific edition's options - fetched on demand (and cached per
  // edition) rather than loaded eagerly, same as the manual wizard's
  // ruleset. `generate()` below fetches its own copy independently (inside
  // `generateRandomCharacter`), including for "All random", which never
  // sets `overrides.edition` at all and so never populates this one.
  const [ruleset, setRuleset] = useState<Ruleset | null>(null);
  useEffect(() => {
    if (!overrides.edition) {
      setRuleset(null);
      return;
    }
    let cancelled = false;
    setRuleset(null);
    getRulesetAsync(overrides.edition).then((loaded) => {
      if (!cancelled) setRuleset(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, [overrides.edition]);

  async function generate(withOverrides: RandomCharacterOverrides) {
    setIsGenerating(true);
    try {
      const character = await generateRandomCharacter(withOverrides);
      setGenerated(character);
      setMode("result");
    } finally {
      setIsGenerating(false);
    }
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
                  <Button className="mt-2 w-fit" onClick={() => generate({})} disabled={isGenerating}>
                    {isGenerating ? "Generating…" : "Generate character"}
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
                    <Combobox options={ruleset ? ruleset.races.map((race) => ({ label: race.name, value: race.name })) : []}
                              value={overrides.raceName ? { label: overrides.raceName, value: overrides.raceName } : null}
                              placeholder={ruleset ? "Search races..." : "Choose an edition first"}
                              onClear={() => setOverrides((o) => ({ ...o, raceName: undefined }))}
                              getOptionLabel={(option) => option.label}
                              getOptionValue={(option) => option.value}
                              onChange={(option) => setOverrides((o) => ({ ...o, raceName: option?.value || undefined }))}
                    />

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
                  <Button onClick={() => generate(overrides)} disabled={isGenerating}>
                    {isGenerating ? "Generating…" : "Generate character"}
                  </Button>
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
                <Button variant="secondary" onClick={() => generate(overrides)} disabled={isGenerating}>
                  {isGenerating ? "Rerolling…" : "🎲 Reroll"}
                </Button>
              }
            />
          )}
        </div>
      </Container>
    </>
  );
}
