import { RACES_2024 } from "./races/Races";
import { BACKGROUNDS_2024 } from "./backgrounds/Backgrounds";
import { FEATS_2024 } from "./feats/Feats";

import { Artificer } from "./classes/Artificer";
import { Barbarian } from "./classes/Barbarian";
import { Bard } from "./classes/Bard";
import { Cleric } from "./classes/Cleric";
import { Druid } from "./classes/Druid";
import { Fighter } from "./classes/Fighter";
import { Monk } from "./classes/Monk";
import { Paladin } from "./classes/Paladin";
import { Ranger } from "./classes/Ranger";
import { Rogue } from "./classes/Rogue";
import { Sorcerer } from "./classes/Sorcerer";
import { Warlock } from "./classes/Warlock";
import { Wizard } from "./classes/Wizard";

import { ArtificerSubclasses } from "./subclasses/Artificer";
import { BarbarianSubclasses } from "./subclasses/Barbarian";
import { BardSubclasses } from "./subclasses/Bard";
import { ClericSubclasses } from "./subclasses/Cleric";
import { DruidSubclasses } from "./subclasses/Druid";
import { FighterSubclasses } from "./subclasses/Fighter";
import { MonkSubclasses } from "./subclasses/Monk";
import { PaladinSubclasses } from "./subclasses/Paladin";
import { RangerSubclasses } from "./subclasses/Ranger";
import { RogueSubclasses } from "./subclasses/Rogue";
import { SorcererSubclasses } from "./subclasses/Sorcerer";
import { WarlockSubclasses } from "./subclasses/Warlock";
import { WizardSubclasses } from "./subclasses/Wizard";

/**
 * Single barrel for every 2024 (PHB'24) content file - same purpose as
 * data/2014/index.ts (see its header comment for why this exists as one
 * file): loaded ONLY via a dynamic `import("./2024")` in data/index.ts, so
 * it's fetched once, the first time the player picks the 2024 edition,
 * instead of bundled eagerly into every page.
 */
export const RACES = RACES_2024;
export const BACKGROUNDS = BACKGROUNDS_2024;
export const FEATS = FEATS_2024;

export const CLASSES = [
  Artificer, Barbarian, Bard, Cleric, Druid, Fighter, Monk,
  Paladin, Ranger, Rogue, Sorcerer, Warlock, Wizard,
];

export const SUBCLASSES = [
  ...ArtificerSubclasses, ...BarbarianSubclasses, ...BardSubclasses, ...ClericSubclasses,
  ...DruidSubclasses, ...FighterSubclasses, ...MonkSubclasses,
  ...PaladinSubclasses, ...RangerSubclasses, ...RogueSubclasses,
  ...SorcererSubclasses, ...WarlockSubclasses, ...WizardSubclasses,
];
