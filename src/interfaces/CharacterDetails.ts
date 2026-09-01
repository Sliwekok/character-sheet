export interface CharacterAppearance {
  age?: string;
  height?: string;
  weight?: string;
  eyes?: string;
  skin?: string;
  hair?: string;
}

export interface CharacterFlavor {
  personalityTraits?: string;
  ideals?: string;
  bonds?: string;
  flaws?: string;
}

export interface DeathSaves {
  successes: number;
  failures: number;
}

/**
 * Everything the official character sheet's printable layout wants beyond
 * the core `Character` model - purely descriptive/flavor fields, plus a
 * couple of print-only trackers (inspiration, death saves) that have no
 * mechanical effect anywhere else in the app. Every field is optional: a
 * character created before this existed, or one from the random generator,
 * simply prints with these boxes blank - exactly like a fresh paper sheet -
 * rather than breaking.
 */
export interface CharacterDetails {
  playerName?: string;
  inspiration?: boolean;
  deathSaves?: DeathSaves;
  /** Freeform notes appended below the auto-generated proficiencies/languages list on the core sheet. */
  otherProficienciesNotes?: string;
  /** Freeform notes for the core sheet's "Features & Traits" box, alongside feats. */
  featuresAndTraitsNotes?: string;
  flavor?: CharacterFlavor;
  appearance?: CharacterAppearance;
  /** Physical description paragraph - the "Character Appearance" box on the details sheet. */
  appearanceNotes?: string;
  backstory?: string;
  alliesAndOrganizations?: string;
  organizationSymbolName?: string;
  additionalFeaturesAndTraits?: string;
  treasure?: string;
}
