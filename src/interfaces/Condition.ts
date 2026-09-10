/**
 * The 14 SRD conditions - unchanged between the 2014 and 2024 rules, same as
 * `SkillName` (see Skill.ts). Tracked per-character purely as a status list
 * (see `CharacterDetails.conditions`); nothing here is enforced
 * mechanically - toggling "Prone" doesn't touch AC/attack calculations
 * anywhere else in the app, the same "purely tracked" caveat that already
 * applies to `CharacterDetails.inspiration`/`deathSaves`. See
 * utils/conditions.ts for the effect-summary text shown next to each toggle.
 */
export const CONDITIONS = [
  "Blinded",
  "Charmed",
  "Deafened",
  "Frightened",
  "Grappled",
  "Incapacitated",
  "Invisible",
  "Paralyzed",
  "Petrified",
  "Poisoned",
  "Prone",
  "Restrained",
  "Stunned",
  "Unconscious",
] as const;

export type ConditionName = (typeof CONDITIONS)[number];
