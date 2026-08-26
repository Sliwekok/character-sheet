import { AbilityScores } from "@/interfaces/Characters";
import { FeatCategory } from "@/interfaces/Feat";
import { Edition } from "@/interfaces/Edition";

export interface Race {
  name: string;
  edition: Edition;
  traits: string[];
  /**
   * 2014 races grant flat ability score bonuses here. 2024 species don't -
   * all ability score increases come from Background instead, so 2024 Race
   * entries should leave this as `{}`.
   */
  abilityModifiers: Partial<AbilityScores>;
  speed: number;
  languages: string[];
  /** 2024-style trait (e.g. Human's "Versatile"): grants a feat of the player's choice from the given category. */
  grantedFeatChoice?: { category: FeatCategory };
  /** 2024-style trait (e.g. Human's "Skillful"): grants proficiency in a number of skills of the player's choice. */
  grantedSkillChoice?: { choose: number };
}
