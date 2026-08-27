import { AttunementRequirement, MagicItemRarity } from "@/interfaces/MagicItem";

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
    /** PHB equipment table values - undefined for magic variants derived from a mundane base item. */
    weight?: number;
    cost?: string;
    /**
     * Magic-item fields, all optional - a mundane armor (the common case)
     * leaves these unset. Set together when this Armor represents a magic
     * item (e.g. "Studded Leather +1", "Adamantine Splint") rather than
     * plain equipment - `bonus` above already covers the AC bump, these
     * cover the rest of what a magic item needs.
     */
    rarity?: MagicItemRarity;
    requiresAttunement?: AttunementRequirement;
    magicDescription?: string;
    /** Set on armor a player homebrewed via createCustomArmor() rather than official content. */
    isCustom?: boolean;
}
