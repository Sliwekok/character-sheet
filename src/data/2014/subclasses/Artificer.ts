import { Subclass } from "@/interfaces/Subclass";

export const ArtificerSubclasses: Subclass[] = [
    {
        name: "Alchemist",
        parentClass: "Artificer",
        edition: "2014",
        grantedAtLevel: 3,
        description: "An Alchemist is an expert at combining reagents to produce mystical effects. Alchemists use their creations to give life and to leech it away.",
    },
    {
        name: "Armorer",
        parentClass: "Artificer",
        edition: "2014",
        grantedAtLevel: 3,
        description: "An artificer who specializes as an Armorer modifies armor to function almost like a second skin. The armor is enhanced to hone the artificer's magic, unleash potent attacks, and generate a formidable defense.",
    },
    {
        name: "Artillerist",
        parentClass: "Artificer",
        edition: "2014",
        grantedAtLevel: 3,
        description: "An Artillerist specializes in using magic to hurl energy, projectiles, and explosions on a battlefield. This destructive power was valued by all the armies of the Last War.",
    },
    {
        name: "Battle Smith",
        parentClass: "Artificer",
        edition: "2014",
        grantedAtLevel: 3,
        description: "Armies require protection, and someone has to put things back together if defenses fail. A combination of protector and medic, a Battle Smith is an expert at defending others and repairing both material and personnel.",
    },
    {
        name: "Cartographer",
        parentClass: "Artificer",
        edition: "2014",
        grantedAtLevel: 3,
        description: "Whenever you finish a Long Rest while holding Cartographer's Tools, you can use that tool to create a set of magical maps by touching at least two creatures (one of whom can be yourself), up to a maximum number of creatures equal to 1 plus your Intelligence modifier (minimum of two creatures). Each target receives a...",
    },
    {
        name: "Reanimator",
        parentClass: "Artificer",
        edition: "2014",
        grantedAtLevel: 3,
        description: "Using Tinker's Tools or another type of Artisan's Tools with which you have proficiency, you can take a Magic action to create a Reanimated Companion through the power of necromancy and science. The companion manifests in an unoccupied space within 5 feet of you.",
    },
];
