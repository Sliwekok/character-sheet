import { Character } from "@/interfaces/Characters";
import { FightingStyleEffect } from "@/interfaces/CharacterClass";
import { decodeFeatureChoiceSelection, featureChoiceKey, GrantEntryInput } from "@/utils/grantedSpells";

/**
 * Every `FightingStyleEffect` the character has actually locked in via a
 * resolved `FeatureChoice`, deduped by the underlying option id - RAW
 * forbids taking the same Fighting Style option twice (even when it's
 * offered again by a different feature, e.g. a Champion's "Additional
 * Fighting Style"), so a repeat pick should never double its bonus. Used by
 * utils/calculateArmorClass.ts and utils/attackCalculations.ts to fold a
 * chosen style's numbers into the character sheet instead of leaving them
 * as descriptive text only - see `FightingStyleEffect`'s header comment
 * (interfaces/CharacterClass.ts) for exactly which styles have a
 * mechanically-tracked effect here.
 */
export function getChosenFightingStyleEffects(character: Character): FightingStyleEffect[] {
  const entries: GrantEntryInput[] = character.classes.map((entry) => ({
    characterClass: entry.class,
    subclass: entry.subclass,
    level: entry.level,
  }));
  const featureChoices = character.featureChoices ?? {};
  const seenOptionIds = new Set<string>();
  const effects: FightingStyleEffect[] = [];

  entries.forEach((entry, classIndex) => {
    const features = [...(entry.characterClass?.features ?? []), ...(entry.subclass?.features ?? [])];
    features.forEach((feature) => {
      if (!feature.choice || feature.level > entry.level) return;
      // Decoded rather than read as one bare id - a multi-select choice
      // (see FeatureChoice.countByLevel) can have several picks resolved
      // at once, though in practice only single-select choices carry a
      // fightingStyleEffect today.
      const chosenIds = decodeFeatureChoiceSelection(featureChoices[featureChoiceKey(classIndex, feature)]);
      chosenIds.forEach((chosenId) => {
        if (seenOptionIds.has(chosenId)) return;
        const option = feature.choice!.options.find((candidate) => candidate.id === chosenId);
        if (!option?.fightingStyleEffect) return;
        seenOptionIds.add(chosenId);
        effects.push(option.fightingStyleEffect);
      });
    });
  });

  return effects;
}
