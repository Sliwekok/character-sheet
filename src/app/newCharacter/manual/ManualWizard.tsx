"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Nav from "../../layout/nav";
import { Button, Card, CardContent, Container, SectionHeading } from "@/components/ui";
import { CharacterDraft, DraftClassEntry } from "@/interfaces/CharacterDraft";
import { getRuleset } from "@/data";
import {
  createEmptyDraft,
  draftFromCharacter,
  finalizeDraft,
  isDraftReadyToFinalize,
  revalidateDraftForClasses,
} from "@/utils/characterDraft";
import { isValidBackgroundAllocation, sumAbilityScores } from "@/utils/abilityScoreBonuses";
import { getEffectiveCasterProgression } from "@/utils/spellcasting";
import { loadCharacter, saveCharacter } from "@/utils/storage";
import { StepProgress } from "@/components/character/wizard/StepProgress";
import { EditionStep } from "@/components/character/wizard/EditionStep";
import { RaceStep } from "@/components/character/wizard/RaceStep";
import { ClassStep } from "@/components/character/wizard/ClassStep";
import { AbilityScoresStep } from "@/components/character/wizard/AbilityScoresStep";
import { BackgroundStep } from "@/components/character/wizard/BackgroundStep";
import { SkillsEquipmentStep } from "@/components/character/wizard/SkillsEquipmentStep";
import { SpellsStep } from "@/components/character/wizard/SpellsStep";
import { DetailsStep } from "@/components/character/wizard/DetailsStep";
import { ReviewStep } from "@/components/character/wizard/ReviewStep";

// Ability Scores sits after Background (not before it) because the 2024
// rules need the chosen background's abilityScoreOptions to know what
// bonus is even available to allocate - see AbilityScoresStep's background
// bonus picker and docs/generator.md.
//
// The step LIST is no longer a static constant - "Spells" is spliced in
// after "Skills & Equipment" only for a spellcasting class (see
// `isSpellcaster` below), so every step is looked up by NAME rather than a
// fixed numeric index (see `canProceed` and the render switch below) -
// that's what lets the list grow/shrink as the player changes their class
// without the rest of the wizard's indices going stale.
const BASE_STEPS = ["Edition", "Race", "Class", "Background", "Ability Scores", "Skills & Equipment"];

/** Whether the player can move past `stepName` via the Continue button - this is the one place the wizard's linear order is encoded. The step indicator (StepProgress) deliberately does NOT use this - it lets the player jump to any step at any time, see this component's `onSelect`. */
function canProceed(stepName: string, draft: CharacterDraft): boolean {
  switch (stepName) {
    case "Edition":
      return Boolean(draft.edition);
    case "Race":
      return Boolean(draft.race);
    case "Class":
      return draft.classes.length > 0 && draft.classes.every((entry) => entry.characterClass);
    case "Background":
      return Boolean(draft.background);
    case "Ability Scores":
      return (
        draft.abilityScores.unassignedPool.length === 0 &&
        isValidBackgroundAllocation(draft.background, draft.backgroundAbilityBonuses)
      );
    case "Skills & Equipment":
    case "Spells":
      return true; // both optional to fill in before moving on
    case "Details":
      return draft.name.trim().length > 0 && draft.alignment.length > 0;
    default: // "Review"
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

/** Stable string key for `draft.classes`, so the revalidation effect below can tell "the class selection actually changed" apart from "the draft object was recreated with the same classes" (e.g. every keystroke on the Details step) without re-running on every render. */
function classesSignature(classes: DraftClassEntry[]): string {
  return classes.map((entry) => `${entry.characterClass?.name ?? ""}/${entry.subclass?.name ?? ""}/${entry.level}`).join("|");
}

export default function ManualWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const [draft, setDraft] = useState<CharacterDraft>(() => createEmptyDraft());
  const [stepIndex, setStepIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);

  // Load the character being edited, if any, once on mount.
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

  const primaryClass = draft.classes[0]?.characterClass;

  // Whether ANY class in the build casts spells at all (honoring a
  // subclass override like Eldritch Knight/Arcane Trickster, same as
  // utils/spellcasting.ts's multiclass calculations) - decides whether the
  // Spells step shows up in STEPS below. A multiclassed character with,
  // say, a non-caster main class and a Wizard dip still needs the step.
  const isSpellcaster = draft.classes.some(
    (entry) => getEffectiveCasterProgression(entry.characterClass, entry.subclass) !== "none"
  );

  const STEPS = useMemo(() => {
    const steps = [...BASE_STEPS];
    if (isSpellcaster) steps.push("Spells");
    steps.push("Details", "Review");
    return steps;
  }, [isSpellcaster]);

  // Keep stepIndex in bounds if the step list shrinks (e.g. the player
  // switches away from a spellcasting class while sitting on the Spells
  // step). This just clamps rather than tracking the step by name across
  // the resize - a minor rough edge (landing on a differently-named step)
  // in an already-uncommon path, same tradeoff the edition-reset effect
  // below makes for race/class/background.
  useEffect(() => {
    setStepIndex((i) => Math.min(i, STEPS.length - 1));
  }, [STEPS.length]);

  // If the edition changes after later selections were made, drop anything
  // that no longer belongs to the new ruleset rather than leaving a 2014
  // race paired with a 2024 class, etc. A background reset also clears its
  // ability-score bonus allocation, since that allocation belonged to the
  // old background's options.
  useEffect(() => {
    if (!ruleset) return;
    setDraft((current) => {
      const raceValid = current.race && ruleset.races.some((r) => r.name === current.race!.name);
      const classesValid = current.classes.every(
        (entry) => !entry.characterClass || ruleset.classes.some((c) => c.name === entry.characterClass!.name)
      );
      const backgroundValid =
        current.background && ruleset.backgrounds.some((b) => b.name === current.background!.name);

      if (raceValid && classesValid && backgroundValid) return current;

      // Drop just the invalid class off each entry (keeping its level, and
      // keeping the entry itself) rather than collapsing the whole
      // multiclass list back down to one row - a player who loses their
      // main class to an edition switch shouldn't also lose the extra
      // class rows they'd already added.
      const classes: DraftClassEntry[] = classesValid
        ? current.classes
        : current.classes.map((entry) =>
            !entry.characterClass || ruleset.classes.some((c) => c.name === entry.characterClass!.name)
              ? entry
              : { level: entry.level }
          );

      return {
        ...current,
        race: raceValid ? current.race : undefined,
        classes,
        background: backgroundValid ? current.background : undefined,
        backgroundAbilityBonuses: backgroundValid ? current.backgroundAbilityBonuses : {},
      };
    });
    // Only re-run when the ruleset (i.e. the edition) itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ruleset]);

  // Requirement: changing the class selection (adding/removing/swapping a
  // class or subclass, or changing a level) re-validates everything that
  // depends on it, pruning any skill/armor/shield/weapon/spell the player
  // is no longer eligible for - see utils/characterDraft.ts's
  // `revalidateDraftForClasses`. Keyed off a stable signature rather than
  // `draft.classes` itself so this only fires when the selection actually
  // changes, not on every draft update (typing a name, picking a spell,
  // etc. would otherwise re-run this every keystroke).
  const lastClassesSignature = useRef<string>(classesSignature(draft.classes));
  useEffect(() => {
    const signature = classesSignature(draft.classes);
    if (signature === lastClassesSignature.current) return;
    lastClassesSignature.current = signature;
    setDraft((current) => revalidateDraftForClasses(current));
    // Only re-run when the classes selection itself changes - revalidation
    // reads other draft fields (skills, equipment, spells, ability scores)
    // but shouldn't re-trigger because of ITS OWN prune, hence the
    // signature guard above rather than depending on those fields here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.classes]);

  function handleSave() {
    const finalized = finalizeDraft(draft);
    if (!finalized) return;
    const savedCharacter = saveCharacter(finalized);
    router.push("/character/" + savedCharacter.id);
  }

  const currentStep = STEPS[stepIndex];
  const canGoNext = canProceed(currentStep, draft);
  const isLastStep = stepIndex === STEPS.length - 1;

  const finalAbilityScores = sumAbilityScores(
    draft.abilityScores.scores,
    draft.race?.abilityModifiers ?? {},
    draft.backgroundAbilityBonuses
  );

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
            {currentStep === "Edition" && (
              <EditionStep edition={draft.edition} onSelect={(edition) => updateDraft({ edition })} />
            )}

            {currentStep === "Race" &&
              (ruleset ? (
                <RaceStep races={ruleset.races} race={draft.race} onSelect={(race) => updateDraft({ race })} />
              ) : (
                <PrerequisiteNotice
                  message="Choose an edition first - it decides which races are available."
                  jumpLabel="Go to Edition"
                  onJump={() => setStepIndex(STEPS.indexOf("Edition"))}
                />
              ))}

            {currentStep === "Class" &&
              (ruleset ? (
                <ClassStep
                  classes={ruleset.classes}
                  subclasses={ruleset.subclasses}
                  entries={draft.classes}
                  onChange={(classes) => updateDraft({ classes })}
                />
              ) : (
                <PrerequisiteNotice
                  message="Choose an edition first - it decides which classes are available."
                  jumpLabel="Go to Edition"
                  onJump={() => setStepIndex(STEPS.indexOf("Edition"))}
                />
              ))}

            {currentStep === "Background" &&
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
                  onJump={() => setStepIndex(STEPS.indexOf("Edition"))}
                />
              ))}

            {currentStep === "Ability Scores" &&
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
                  onJump={() => setStepIndex(STEPS.indexOf(!draft.race ? "Race" : "Background"))}
                />
              ))}

            {currentStep === "Skills & Equipment" &&
              (ruleset && primaryClass && draft.background ? (
                <SkillsEquipmentStep
                  ruleset={ruleset}
                  characterClass={primaryClass}
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
                    !primaryClass
                      ? "Choose a class first - it decides which skills and gear are available."
                      : "Choose a background first - its skills are shown alongside your class choices here."
                  }
                  jumpLabel={!primaryClass ? "Go to Class" : "Go to Background"}
                  onJump={() => setStepIndex(STEPS.indexOf(!primaryClass ? "Class" : "Background"))}
                />
              ))}

            {currentStep === "Spells" &&
              (ruleset && primaryClass ? (
                <SpellsStep
                  spells={ruleset.spells}
                  classes={draft.classes}
                  abilityScores={finalAbilityScores}
                  spellsKnown={draft.spellsKnown}
                  onChange={(spellsKnown) => updateDraft({ spellsKnown })}
                />
              ) : (
                <PrerequisiteNotice
                  message="Choose a class first - it decides which spells are available."
                  jumpLabel="Go to Class"
                  onJump={() => setStepIndex(STEPS.indexOf("Class"))}
                />
              ))}

            {currentStep === "Details" && (
              <DetailsStep
                name={draft.name}
                alignment={draft.alignment}
                details={draft.details}
                onNameChange={(name) => updateDraft({ name })}
                onAlignmentChange={(alignment) => updateDraft({ alignment })}
                onDetailsChange={(details) => updateDraft({ details })}
              />
            )}

            {currentStep === "Review" && (
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
