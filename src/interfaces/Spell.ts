export interface Spell {
    name: string;
    level: number; // 0 = Cantrip, 1-9 = spell levels
    school: string;
    description: string;
    castingTime: string;
    range: string;
    components: string[]; // e.g., ['V', 'S', 'M']
    duration: string;
}
