import Link from "next/link";
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  StatBlock,
  formatModifier,
} from "@/components/ui";

export type CharacterSummary = {
  id: string;
  name: string;
  level: number;
  alignment: string;
  className: string;
  armorClass: number;
  initiative: number;
  abilityModifiers: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
};

/**
 * Summary card for a single character. Takes a plain `CharacterSummary`
 * rather than the full `Character` interface so it can be reused for
 * mock/placeholder data now and swapped to real data later without the
 * card itself changing. See utils/characterSummary.ts for how a real,
 * stored character is turned into this shape.
 */
export function CharacterCard({ character }: { character: CharacterSummary }) {
  const { name, level, alignment, className, armorClass, initiative, abilityModifiers } =
    character;

  const stats = [
    { label: "STR", value: formatModifier(abilityModifiers.strength) },
    { label: "DEX", value: formatModifier(abilityModifiers.dexterity) },
    { label: "CON", value: formatModifier(abilityModifiers.constitution) },
    { label: "INT", value: formatModifier(abilityModifiers.intelligence) },
    { label: "WIS", value: formatModifier(abilityModifiers.wisdom) },
    { label: "CHA", value: formatModifier(abilityModifiers.charisma) },
  ];

  // Opening a card goes to the character's details page (app/character/[id])
  // now, not straight into editing - that page has its own "Edit character"
  // button (see app/newCharacter/manual - it loads ?edit=<id> back into the
  // wizard) for when the player actually wants to change something. The
  // `mock-` ids are the /home placeholder sample cards (not real stored
  // characters, see that page's MOCK_CHARACTERS) and keep the old harmless
  // in-page anchor instead, since there's no real character to look up.
  const href = character.id.startsWith("mock-") ? `/home#${character.id}` : `/character/${character.id}`;

  return (
    <Link href={href} className="block h-full">
      <Card className="flex h-full flex-col transition-colors hover:border-border-strong">
        <CardHeader>
          <div>
            <CardTitle>{name}</CardTitle>
            <p className="mt-1 text-sm text-fontcolor-secondary">
              Level {level} &middot; {className}
            </p>
          </div>
          <Badge variant="outline">{alignment}</Badge>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-4">
          <div className="flex gap-3">
            <Badge variant="solid">AC {armorClass}</Badge>
            <Badge variant="muted">Initiative {formatModifier(initiative)}</Badge>
          </div>
          <StatBlock stats={stats} />
        </CardContent>
      </Card>
    </Link>
  );
}
