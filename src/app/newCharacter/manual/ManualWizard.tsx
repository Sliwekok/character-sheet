"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Nav from "../../layout/nav";
import { Button, Card, CardContent, Container, SectionHeading } from "@/components/ui";
import { CharacterDraft } from "@/interfaces/CharacterDraft";
import { getRuleset } from "@/data";
import {
  createEmptyDraft,
  draftFromCharacter,
  finalizeDraft,
  isDraftReadyToFinalize,
} from "@/utils/characterDraft";
import { isValidBackgroundAllocation } from "@/utils/abilityScoreBonuses";
import { loadCharacter, saveCharacter } from "@/utils/storage";
import { StepProgress } from "@/components/character/wizard/StepProgress";
import { EditionStep } from "@/components/character/wizard/EditionStep";
import { RaceStep } from "@/components/character/wizard/RaceStep";
import { ClassStep } from "@/components/character/wizard/ClassStep";
import { AbilityScoresStep } from "@/components/character/wizard/AbilityScoresStep";
import { BackgroundStep } from "@/components/character/wizard/BackgroundStep";
import { SkillsEquipmentStep } from "@/components/character/wizard/SkillsEquipmentStep";
import { DetailsStep } from "@/components/character/wizard/DetailsStep";
import { ReviewStep } from "@/components/character/wizard/ReviewStep";

// Ability Scores sits after Background (not before it) because the 2024
// rules need the chosen background's abilityScoreOptions to know what
// bonus is even available to allocate - see AbilityScoresStep's background
// bonus picker and docs/generator.md.
const STEPS = [
  "Edition",
  "Race",
  "Class",
  "Background",
  "Ability Scores",
  "Skills & Equipment",
  "Details",
  "Review",
];

/** Whether the player can move past `stepIndex` via the Continue button - this is the one place the wizard's linear order is encoded. The step indicator (StepProgress) deliberately does NOT use this - it lets the player jump to any step at any time, see this component's `onSelect`. */
function canProceed(stepIndex: number, draft: CharacterDraft): boolean {
  switch (stepIndex) {
    case 0:
      return Boolean(draft.edition);
    case 1:
      return Boolean(draft.race);
    case 2:
      return Boolean(draft.characterClass);
    case 3:
      return Boolean(draft.background);
    case 4:
      return (
        draft.abilityScores.unassignedPool.length === 0 &&
        isValidBackgroundAllocation(draft.background, draft.backgroundAbilityBonuses)
      );
    case 5:
      return true; // skills/equipment are optional to fill in before moving on
    case 6:
      return draft.name.trim().length > 0 && draft.alignment.length > 0;
    default:
      return isDraftReadyToFinalize(draft);
  }
}

/** Shown in place of a step whose prerequisites (an earlier, still-unfinished step) aren't met yet - reachable since StepProgress lets the player jump straight to any step regardless of what's filled in. */
function PrerequisiteNotice({
  message,
  jumpLabel,
  onJump,
}: {
  message: string;
  jumpLabel: string;
  onJump: () => void;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-start gap-3 text-sm text-fontcolor-secondary">
        <p>{message}</p>
        <Button variant="secondary" onClick={onJump}>
          {jumpLabel}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function ManualWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const [draft, setDraft] = useState<CharacterDraft>(() => createEmptyDraft());
  const [stepIndex, setStepIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);

  // Load the character being edited, if any, once on mount - see
  // draftFromCharacter()'s header comment for the single-class-only caveat.
  useEffect(() => {
    if (!editId) return;
    const existing = loadCharacter(editId);
    if (existing) {
      setDraft(draftFromCharacter(existing));
      setIsEditing(true);
    }
  }, [editId]);

  function updateDraft(patch: Partial<CharacterDraft>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  const ruleset = useMemo(() => (draft.edition ? getRuleset(draft.edition) : null), [draft.edition]);

  // If the edition changes after later selections were made, drop anything
  // that no longer belongs to the new ruleset rather than leaving a 2014
  // race paired with a 2024 class, etc. A background reset also clears its
  // ability-score bonus allocation, since that allocation belonged to the
  // old background's options.
  useEffect(() => {
    if (!ruleset) return;
    setDraft((current) => {
      const raceValid = current.race && ruleset.races.some((r) => r.name === current.race!.name);
      const classValid =
        current.characterClass && ruleset.classes.some((c) => c.name === current.characterClass!.name);
      const backgroundValid =
        current.background && ruleset.backgrounds.some((b) => b.name === current.background!.name);

      if (raceValid && classValid && backgroundValid) return current;

      return {
        ...current,
        race: raceValid ? current.race : undefined,
        characterClass: classValid ? current.characterClass : undefined,
        subclass: classValid ? current.subclass : undefined,
        background: backgroundValid ? current.background : undefined,
        backgroundAbilityBonuses: backgroundValid ? current.backgroundAbilityBonuses : {},
      };
    });
    // Only re-run when the ruleset (i.e. the edition) itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ruleset]);

  function handleSave() {
    const finalized = finalizeDraft(draft);
    if (!finalized) return;
    saveCharacter(finalized);
    router.push("/home");
  }

  const canGoNext = canProceed(stepIndex, draft);
  const isLastStep = stepIndex === STEPS.length - 1;

  return (
    <>
      <Nav />
      <Container size="lg" className="pb-24">
        <SectionHeading
          eyebrow={isEditing ? "Editing character" : "New character"}
          title="Step by step"
          subtitle="Follow the recommended build order, or click any step below to jump straight to it."
        />

        <div className="mt-8 flex flex-col gap-8">
          <StepProgress steps={STEPS} currentIndex={stepIndex} onSelect={setStepIndex} />

          <div>
            {stepIndex === 0 && (
              <EditionStep edition={draft.edition} onSelect={(edition) => updateDraft({ edition })} />
            )}

            {stepIndex === 1 &&
              (ruleset ? (
                <RaceStep races={ruleset.races} race={draft.race} onSelect={(race) => updateDraft({ race })} />
              ) : (
                <PrerequisiteNotice
                  message="Choose an edition first - it decides which races are available."
                  jumpLabel="Go to Edition"
                  onJump={() => setStepIndex(0)}
                />
              ))}

            {stepIndex === 2 &&
              (ruleset ? (
                <ClassStep
                  classes={ruleset.classes}
                  subclasses={ruleset.subclasses}
                  characterClass={draft.characterClass}
                  subclass={draft.subclass}
                  level={draft.classLevel}
                  onSelectClass={(characterClass) => updateDraft({ characterClass })}
                  onSelectSubclass={(subclass) => updateDraft({ subclass })}
                  onLevelChange={(classLevel) => updateDraft({ classLevel })}
                />
              ) : (
                <PrerequisiteNotice
                  message="Choose an edition first - it decides which classes are available."
                  jumpLabel="Go to Edition"
                  onJump={() => setStepIndex(0)}
                />
              ))}

            {stepIndex === 3 &&
              (ruleset ? (
                <BackgroundStep
                  backgrounds={ruleset.backgrounds}
                  background={draft.background}
                  onSelect={(background) => updateDraft({ background, backgroundAbilityBonuses: {} })}
                />
              ) : (
                <PrerequisiteNotice
                  message="Choose an edition first - it decides which backgrounds are available."
                  jumpLabel="Go to Edition"
                  onJump={() => setStepIndex(0)}
                />
              ))}

            {stepIndex === 4 &&
              (draft.race && draft.background ? (
                <AbilityScoresStep
                  state={draft.abilityScores}
                  race={draft.race}
                  background={draft.background}
                  backgroundAbilityBonuses={draft.backgroundAbilityBonuses}
                  onChange={(abilityScores) => updateDraft({ abilityScores })}
                  onBackgroundBonusesChange={(backgroundAbilityBonuses) =>
                    updateDraft({ backgroundAbilityBonuses })
                  }
                />
              ) : (
                <PrerequisiteNotice
                  message={
                    !draft.race
                      ? "Choose a race first - racial modifiers factor into your final ability scores."
                      : "Choose a background first - its ability score bonus is assigned on this step."
                  }
                  jumpLabel={!draft.race ? "Go to Race" : "Go to Background"}
                  onJump={() => setStepIndex(!draft.race ? 1 : 3)}
                />
              ))}

            {stepIndex === 5 &&
              (ruleset && draft.characterClass && draft.background ? (
                <SkillsEquipmentStep
                  ruleset={ruleset}
                  characterClass={draft.characterClass}
                  background={draft.background}
                  skillProficiencies={draft.skillProficiencies}
                  equippedArmor={draft.equippedArmor}
                  shield={draft.shield}
                  weapons={draft.weapons}
                  onSkillsChange={(skillProficiencies) => updateDraft({ skillProficiencies })}
                  onArmorChange={(equippedArmor) => updateDraft({ equippedArmor })}
                  onShieldChange={(shield) => updateDraft({ shield })}
                  onWeaponsChange={(weapons) => updateDraft({ weapons })}
                />
              ) : (
                <PrerequisiteNotice
                  message={
                    !draft.characterClass
                      ? "Choose a class first - it decides which skills and gear are available."
                      : "Choose a background first - its skills are shown alongside your class choices here."
                  }
                  jumpLabel={!draft.characterClass ? "Go to Class" : "Go to Background"}
                  onJump={() => setStepIndex(!draft.characterClass ? 2 : 3)}
                />
              ))}

            {stepIndex === 6 && (
              <DetailsStep
                name={draft.name}
                alignment={draft.alignment}
                onNameChange={(name) => updateDraft({ name })}
                onAlignmentChange={(alignment) => updateDraft({ alignment })}
              />
            )}

            {stepIndex === 7 && (
              <ReviewStep draft={draft} isEditing={isEditing} onSave={handleSave} />
            )}
          </div>

          {!isLastStep && (
            <div className="flex items-center justify-between border-t border-border pt-6">
              <Button
                variant="secondary"
                onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
                disabled={stepIndex === 0}
              >
                Back
              </Button>
              <Button
                onClick={() => setStepIndex((i) => Math.min(STEPS.length - 1, i + 1))}
                disabled={!canGoNext}
              >
                Continue
              </Button>
            </div>
          )}

          {isLastStep && (
            <div className="border-t border-border pt-6">
              <Button variant="secondary" onClick={() => setStepIndex((i) => Math.max(0, i - 1))}>
                Back
              </Button>
            </div>
          )}
        </div>
      </Container>
    </>
  );
}
