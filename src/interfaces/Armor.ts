export type ArmorCategory = 'light' | 'medium' | 'heavy' | 'shield';

export interface Armor {
    name: string;
    category: ArmorCategory;
    baseAC: number;
    dexterityModifier?: {
        enabled: boolean; // some armors do not benefit from dexterity modifier
        max?: number;
    };
    stealthDisadvantage?: boolean;
    strengthRequirement?: number;
    material?: string;
    bonus?: number; // additional AC gained from magic or other sources
}
