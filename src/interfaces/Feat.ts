import { AbilityScores } from "@/interfaces/Characters";
import { Edition } from "@/interfaces/Edition";

export type FeatCategory =
  | "origin"
  | "general"
  | "fighting-style"
  | "epic-boon"
  /** Eberron (ERLW/EGW) dragonmark feats - "no other dragonmark" is a common prerequisite among them. */
  | "dragonmark"
  /** Ravenloft (VRGR) Dark Gift feats, granted by the setting's Dark Gift mechanic rather than normal feat progression. */
  | "dark-gift";

export interface Feat {
  name: string;
  edition: Edition;
  category: FeatCategory;
  prerequisite?: string;
  description: string;
  abilityScoreIncrease?: { choose: number; from: (keyof AbilityScores)[] };
}
