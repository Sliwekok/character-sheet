import { Subclass } from "@/interfaces/Subclass";

export const EldritchKnight: Subclass = {
    name: "Eldritch Knight",
    parentClass: "Fighter",
    edition: "2014",
    grantedAtLevel: 3,
    // Grants 'third' caster progression on top of a base Fighter, whose
    // own casterProgression is 'none' - see utils/spellcasting.ts for how
    // this override is applied.
    casterProgressionOverride: "third",
    description:
        "A Fighter who augments martial prowess with a limited repertoire of arcane spells, drawn primarily from the abjuration and evocation schools.",
};
