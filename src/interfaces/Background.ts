import { AbilityScores } from "@/interfaces/Characters";
import { SkillName } from "@/interfaces/Skill";
import { Edition } from "@/interfaces/Edition";

export interface Background {
  name: string;
  edition: Edition;
  /**
   * 2024 only - backgrounds grant the character's ability score increases
   * (species/race no longer do). Left undefined for 2014 backgrounds,
   * which don't touch ability scores at all.
   */
  abilityScoreOptions?: {
    from: (keyof AbilityScores)[];
    /** '2-1': +2 to one of `from`, +1 to another. '1-1-1': +1 to each of three. Player chooses at creation. */
    allocation: "2-1" | "1-1-1";
  };
  /** 2024 only - name of the Origin feat this background grants. */
  originFeat?: string;
  skillProficiencies: SkillName[];
  toolProficiency?: string;
  equipment: string[];
  /** 2014-style background feature (flavor text plus a minor mechanical hook). 2024 backgrounds fold this into the origin feat instead. */
  feature?: { name: string; description: string };
}
