import { Weapon } from "@/interfaces/Weapon";

export const Shortbow: Weapon = {
    name: "Shortbow",
    category: "simple",
    type: "ranged",
    damage: { dice: "1d6", type: "piercing" },
    properties: ["ammunition", "range", "two-handed"],
    weight: 2,
    cost: "25 gp",
    mastery: "Vex",
};
