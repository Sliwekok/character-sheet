// interfaces/SpellSlots.ts
export type SpellSlots = {
    [spellLevel: number]: number; // number of allowed spells at given lvl e.g. {1: 4, 2: 2}
};

export type SpellcastingProgression = {
    [characterLevel: number]: SpellSlots;
};
