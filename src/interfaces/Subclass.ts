import { CasterProgression } from "@/interfaces/CharacterClass";
import { Edition } from "@/interfaces/Edition";

export interface Subclass {
  name: string;
  /** Name of the base CharacterClass this subclass belongs to, e.g. "Fighter". */
  parentClass: string;
  edition: Edition;
  grantedAtLevel: number;
  /**
   * Some subclasses grant spellcasting the base class doesn't have (e.g.
   * Eldritch Knight/Arcane Trickster grant 'third' caster progression on
   * top of a base class whose own `casterProgression` is 'none'). When
   * set, this overrides the parent class's `casterProgression` for
   * multiclass slot calculations - see utils/spellcasting.ts.
   */
  casterProgressionOverride?: CasterProgression;
  /** Flavor-text summary of the subclass, shown at selection time. Individual mechanical benefits live in `features` below, not here. */
  description?: string;
  /**
   * Every named mechanical benefit this subclass grants, in the order a
   * character gains them - e.g. Champion (Fighter) has "Improved Critical"
   * at 3, "Remarkable Athlete" at 7, "Additional Fighting Style" at 10,
   * "Superior Critical" at 15, "Survivor" at 18. `level` is the character's
   * level in `parentClass` at which the feature is gained (not always the
   * same as `grantedAtLevel`, which is only when the subclass itself is
   * chosen).
   */
  features: { name: string; level: number; description: string }[];
}
