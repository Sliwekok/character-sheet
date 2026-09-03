import { RACES_2014 } from "./races/Races";
import { BACKGROUNDS_2014 } from "./backgrounds/Backgrounds";
import { FEATS_2014 } from "./feats/Feats";

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
 * Single barrel for every 2014 (PHB) content file - races, classes,
 * subclasses, backgrounds, feats. This whole subtree (well over 1MB of
 * source) is imported ONLY via a dynamic `import("./2014")` in
 * data/index.ts, so webpack puts it in its own chunk that's fetched only
 * once the player actually picks the 2014 edition, instead of shipping it
 * in every page's initial bundle. Keep every 2014 content import going
 * through this file (not data/index.ts directly) so that split stays
 * intact - see data/index.ts's `buildRuleset` for the loader.
 */
export const RACES = RACES_2014;
export const BACKGROUNDS = BACKGROUNDS_2014;
export const FEATS = FEATS_2014;

export const CLASSES = [
  Artificer, Barbarian, Bard, Cleric, Druid, Fighter,
  Monk, Paladin, Ranger, Rogue, Sorcerer, Warlock, Wizard,
];

export const SUBCLASSES = [
  ...ArtificerSubclasses, ...BarbarianSubclasses, ...BardSubclasses,
  ...ClericSubclasses, ...DruidSubclasses, ...FighterSubclasses,
  ...MonkSubclasses, ...PaladinSubclasses, ...RangerSubclasses,
  ...RogueSubclasses, ...SorcererSubclasses, ...WarlockSubclasses,
  ...WizardSubclasses,
];
