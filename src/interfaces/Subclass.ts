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
  description?: string;
}
