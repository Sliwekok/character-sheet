import { describe, it, expect } from "vitest";
import type { DdbActions, DdbClassEntry, DdbClassSpellsEntry, DdbGrantedSpellEntry, DdbSpells } from "@/utils/dndbeyond/types";
import {
  readActionSpellNames,
  readClassEmbeddedSpellNames,
  readGrantedSpellNames,
  readKnownSpellNames,
} from "@/utils/dndbeyond/readSpells";

/** The usual `{ definition: { name } }` shape. */
const spell = (name: string): DdbGrantedSpellEntry => ({ definition: { name } });

/** Lets a test feed deliberately malformed data through the typed API. */
const malformed = <T>(value: unknown) => value as T;

const classEntry = (extra: Partial<DdbClassEntry> = {}): DdbClassEntry => ({
  id: 1,
  level: 3,
  definition: { id: 10, name: "Cleric" },
  ...extra,
});

describe("readKnownSpellNames", () => {
  it("pools every class's known/prepared spells", () => {
    const classSpells: DdbClassSpellsEntry[] = [
      { characterClassId: 1, spells: [spell("Fire Bolt"), spell("Shield")] },
      { characterClassId: 2, spells: [spell("Cure Wounds")] },
    ];
    expect(readKnownSpellNames(classSpells)).toEqual(["Fire Bolt", "Shield", "Cure Wounds"]);
  });

  it("lists a spell known by two classes only once", () => {
    expect(readKnownSpellNames([{ spells: [spell("Guidance")] }, { spells: [spell("Guidance")] }])).toEqual(["Guidance"]);
  });

  it("accepts a top-level name, trims names, and prefers definition.name", () => {
    const classSpells: DdbClassSpellsEntry[] = [
      { spells: [{ name: "  Light  " }, { name: "Ignored", definition: { name: "Mage Hand" } }] },
    ];
    expect(readKnownSpellNames(classSpells)).toEqual(["Light", "Mage Hand"]);
  });

  it("skips entries without a usable name", () => {
    const classSpells = malformed<DdbClassSpellsEntry[]>([
      { spells: [{}, { name: "   " }, { definition: { name: null } }, null, { definition: { name: 42 } }, spell("Bless")] },
      {},
      null,
      { spells: "not a list" },
    ]);
    expect(readKnownSpellNames(classSpells)).toEqual(["Bless"]);
  });

  it("returns nothing for missing or malformed data", () => {
    expect(readKnownSpellNames(undefined)).toEqual([]);
    expect(readKnownSpellNames(malformed<DdbClassSpellsEntry[]>({ spells: [spell("Bless")] }))).toEqual([]);
  });
});

describe("readGrantedSpellNames", () => {
  it("collects race, class, feat and item spells", () => {
    const spells: DdbSpells = {
      race: [spell("Thaumaturgy")],
      class: [spell("Bless")],
      feat: [spell("Misty Step")],
      item: [spell("Fireball")],
    };
    expect(readGrantedSpellNames(spells)).toEqual(["Thaumaturgy", "Bless", "Misty Step", "Fireball"]);
  });

  it("dedupes across groups and tolerates missing groups", () => {
    expect(readGrantedSpellNames({ race: [spell("Light")], item: [spell("Light")] })).toEqual(["Light"]);
    expect(readGrantedSpellNames({})).toEqual([]);
  });

  it("ignores unknown groups", () => {
    expect(readGrantedSpellNames(malformed<DdbSpells>({ background: [spell("Guidance")] }))).toEqual([]);
  });

  it("returns nothing for missing or malformed data", () => {
    expect(readGrantedSpellNames(undefined)).toEqual([]);
    expect(readGrantedSpellNames(malformed<DdbSpells>("spells"))).toEqual([]);
    expect(readGrantedSpellNames(malformed<DdbSpells>({ race: { name: "Light" } }))).toEqual([]);
  });
});

describe("readActionSpellNames", () => {
  it("collects names from every action group, including top-level names", () => {
    const actions: DdbActions = {
      race: [{ name: "Thaumaturgy" }],
      class: [spell("Channel Divinity")],
      feat: [],
      item: [spell("Thaumaturgy")],
    };
    expect(readActionSpellNames(actions)).toEqual(["Channel Divinity", "Thaumaturgy"]);
  });

  it("returns nothing for missing or malformed data", () => {
    expect(readActionSpellNames(undefined)).toEqual([]);
    expect(readActionSpellNames(malformed<DdbActions>(7))).toEqual([]);
  });
});

describe("readClassEmbeddedSpellNames", () => {
  it("collects spells embedded on class entries and their subclasses", () => {
    const classes: DdbClassEntry[] = [
      classEntry({
        spells: [spell("Guidance")],
        subclassDefinition: { id: 99, name: "Life Domain", spells: [spell("Bless"), spell("Cure Wounds")] },
      }),
      classEntry({ id: 2, definition: { id: 11, name: "Warlock" }, subclassDefinition: { id: 100, name: "Fiend", spells: [spell("Burning Hands")] } }),
    ];
    expect(readClassEmbeddedSpellNames(classes)).toEqual(["Guidance", "Bless", "Cure Wounds", "Burning Hands"]);
  });

  it("dedupes and tolerates a null subclass or missing spell lists", () => {
    const classes: DdbClassEntry[] = [
      classEntry({ spells: [spell("Bless")], subclassDefinition: null }),
      classEntry({ subclassDefinition: { id: 1, name: "X", spells: [spell("Bless")] } }),
      classEntry(),
    ];
    expect(readClassEmbeddedSpellNames(classes)).toEqual(["Bless"]);
  });

  it("returns nothing for missing or malformed data", () => {
    expect(readClassEmbeddedSpellNames(undefined)).toEqual([]);
    expect(readClassEmbeddedSpellNames(malformed<DdbClassEntry[]>([null, { spells: 3 }]))).toEqual([]);
  });
});
