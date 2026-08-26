import { Weapon } from "@/interfaces/Weapon";

// Base weapon stats are shared between editions - only which classes can
// apply the `mastery` property (2024 only) differs, and that's governed by
// CharacterClass.weaponMasteryProgression, not by the weapon itself.
export const Longsword: Weapon = {
    name: "Longsword",
    category: "martial",
    type: "melee",
    damage: { dice: "1d8", type: "slashing" },
    versatileDamage: "1d10",
    properties: ["versatile"],
    weight: 3,
    cost: "15 gp",
    mastery: "Sap",
};
