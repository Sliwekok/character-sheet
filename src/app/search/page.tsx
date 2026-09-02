"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Nav from "../layout/nav";
import { Button, Container, SectionHeading } from "@/components/ui";
import { getSpecificItem } from "@/data";
import { SearchableType } from "@/utils/searchIndex";
import { SearchResultDetail } from "@/components/search/SearchResultDetail";
import { Edition } from "@/interfaces/Edition";

const TYPE_LABELS: Record<SearchableType, string> = {
  races: "Race / Species",
  classes: "Class",
  backgrounds: "Background",
  feats: "Feat",
  subclasses: "Subclass",
  weapons: "Weapon",
  armor: "Armor",
  spells: "Spell",
  magicItems: "Magic Item",
  magicWeapons: "Magic Weapon",
  magicArmor: "Magic Armor",
};

function isSearchableType(value: string | null): value is SearchableType {
  return !!value && value in TYPE_LABELS;
}

function otherEditionOf(edition: Edition): Edition {
  return edition === "2014" ? "2024" : "2014";
}

function SearchPageContent() {
  const searchParams = useSearchParams();

  const edition = searchParams.get("edition");
  const type = searchParams.get("type");
  const name = searchParams.get("name");

  const item = useMemo(() => {
    if (!edition || !type || !name) return undefined;
    return getSpecificItem(edition, type, name);
  }, [edition, type, name]);

  const resultType = isSearchableType(type) ? type : undefined;
  const hasSearchParams = Boolean(edition && type && name);

  // Same name/type under the *other* ruleset, if one exists - e.g. viewing
  // Fireball (edition-agnostic, so this always matches) or the 2014
  // Human race pulls up whatever the 2024 compendium has under that exact
  // name, or nothing if that edition never printed an equivalent.
  const otherEdition: Edition | undefined =
    edition === "2014" || edition === "2024" ? otherEditionOf(edition) : undefined;

  const otherEditionItem = useMemo(() => {
    if (!otherEdition || !type || !name) return undefined;
    return getSpecificItem(otherEdition, type, name);
  }, [otherEdition, type, name]);

  const otherEditionHref =
    otherEdition && type && name
      ? `/search?${new URLSearchParams({ edition: otherEdition, type, name }).toString()}`
      : undefined;

  return (
    <>
      <Nav />
      <Container size="lg" className="pb-24">
        <SectionHeading
          eyebrow="Compendium"
          title={item ? item.name : "Search"}
          subtitle={
            item && resultType ? (
              <span className="flex flex-wrap items-center gap-3">
                <span>
                  {TYPE_LABELS[resultType]} · {edition} ruleset
                </span>
                {otherEditionHref &&
                  (otherEditionItem ? (
                    <Button href={otherEditionHref} size="sm" variant="secondary">
                      View {otherEdition} version
                    </Button>
                  ) : (
                    <span className="text-sm text-fontcolor-secondary">
                      No {otherEdition} equivalent
                    </span>
                  ))}
              </span>
            ) : (
              "Look up any race, class, background, feat, subclass, weapon, piece of armor, spell, or magic item from either ruleset."
            )
          }
        />

        <div className="mt-8 flex flex-col gap-6">
          {hasSearchParams && !item && (
            <p className="text-fontcolor-secondary">
              Couldn&apos;t find &quot;{name}&quot; under {type} in the {edition} ruleset.
            </p>
          )}
          {item && resultType && <SearchResultDetail type={resultType} item={item} />}
          {!hasSearchParams && (
            <p className="text-fontcolor-secondary">
              Use the search bar in the nav to pull up a full stat block - the exact fields shown depend on
              what kind of thing you searched for.
            </p>
          )}
        </div>
      </Container>
    </>
  );
}

/**
 * `useSearchParams` needs a Suspense boundary around it in the app router
 * (otherwise the whole route opts out of static rendering with a build-time
 * warning) - the actual page content lives in `SearchPageContent` so this
 * wrapper can stay trivial.
 */
export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchPageContent />
    </Suspense>
  );
}
