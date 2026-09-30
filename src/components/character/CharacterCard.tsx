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
export function CharacterCard({
  character,
  href: hrefOverride,
  ownerName,
  tag,
}: {
  character: CharacterSummary;
  /** Where the card links to - defaults to the character's own sheet. Shared cards pass the read-only `?owner=` link. */
  href?: string;
  /** Set for another player's character (shown under the class line). */
  ownerName?: string;
  /** Small extra badge next to AC/Initiative, e.g. the character's sharing setting. */
  tag?: string;
}) {
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
  const href = hrefOverride ?? (character.id.startsWith("mock-") ? `/home#${character.id}` : `/character/${character.id}`);

  return (
    <Link href={href} className="block h-full">
      <Card className="flex h-full flex-col transition-colors hover:border-border-strong">
        <CardHeader>
          <div>
            <CardTitle>{name}</CardTitle>
            <p className="mt-1 text-sm text-fontcolor-secondary">
              Level {level} &middot; {className}
            </p>
            {ownerName && <p className="mt-1 text-xs text-fontcolor-secondary">Played by {ownerName}</p>}
          </div>
          <Badge variant="outline" className="text-center">{alignment}</Badge>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-4">
          <div className="flex gap-3">
            <Badge variant="solid">AC {armorClass}</Badge>
            <Badge variant="muted">Initiative {formatModifier(initiative)}</Badge>
            {tag && <Badge variant="outline">{tag}</Badge>}
          </div>
          <StatBlock stats={stats} />
        </CardContent>
      </Card>
    </Link>
  );
}
