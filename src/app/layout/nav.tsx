"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {useEffect, useState} from "react";
import {Combobox, Container, Logo, TextInput} from "@/components/ui";
import { cn } from "@/utils/cn";
import {getRuleset, getSpecificItem, Ruleset} from "@/data";

const NAV_LINKS = [
  { href: "/home", label: "Home" },
  { href: "/newCharacter", label: "New Character" },
  { href: "/about", label: "About" },
];

export default function Nav() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchOptions, setSearchOptions] = useState([]);
  const [filteredOptions, setFilteredOptions] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const pathname = usePathname();
  const maxFilters = 5;
  const [allItemsList, setAllItemsList] = useState<any[]>([]);

  useEffect(() => {
    const fetchAllItems = async () => {
      const ruleset2014 = getRuleset("2014");
      const ruleset2024 = getRuleset("2024");

      const rulesets = [ruleset2014, ruleset2024];
      const itemsToInsert = [];

      for (const currentRuleset of rulesets) {
        for (const key of Object.keys(currentRuleset) as Array<keyof Ruleset>) {
          const currentKey = currentRuleset[key];

          if (Array.isArray(currentKey)) {
            for (const item of currentKey) {
              itemsToInsert.push({
                name: item.name,
                ruleset: currentRuleset.edition,
                type: key,
              });
            }
          }
        }
      }
      setAllItemsList(itemsToInsert);
    };

    fetchAllItems();
  }, []);

  useEffect(() => {
  }, [allItemsList]);

  const toggleNav = () => setIsOpen((open) => !open);

  function filterSearch (searchValue: string) {
    if (searchValue?.trim().length <= 3) {
      return [];
    }
    const filtered = allItemsList.filter((item) =>
      item.name.toLowerCase().includes((searchValue || search).toLowerCase())
    ).slice(0, maxFilters) as Array<{ name: string; ruleset: Ruleset; type: keyof Ruleset }>;

    setFilteredOptions(filtered);
  }

  useEffect(() => {
    filterSearch(search);
  }, [search]);



  return (
    <nav className="sticky top-0 z-30 border-b border-border bg-background-darken/95 backdrop-blur-sm">
      <Container size="xl">
        <div className="flex h-20 items-center justify-between">
          <Link href="/home" className="shrink-0">
            <Logo size={40} />
          </Link>

          <div className="hidden max-w-md flex-1 px-8 lg:flex">
            <Combobox
                options={filteredOptions}
                placeholder="Roll for wisdom"
                className="w-full"
                value={search}
                getOptionLabel={(option) => '(' + option.ruleset + ')' + ' ' + option.name}
                getOptionValue={(option) => option.name + ' ' + option.ruleset}
                onInputChange={(value) => {
                  setSearch(value);
                }}
                onChange={(value) => {
                  console.log("Selected:", value);
                  console.log(getSpecificItem(value.ruleset, value.type, value.name));
                }}
            />
          </div>

          {/* desktop links */}
          <div className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "border-b-2 pb-1 text-sm font-medium transition-colors",
                    active
                      ? "border-foreground text-foreground"
                      : "border-transparent text-fontcolor-secondary hover:text-fontcolor"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* mobile toggle */}
          <button
            type="button"
            aria-label={isOpen ? "Close menu" : "Open menu"}
            onClick={toggleNav}
            className="flex h-10 w-10 items-center justify-center rounded-(--radius-sm) text-fontcolor md:hidden"
          >
            {isOpen ? (
              <svg viewBox="0 0 122.879 122.879" className="h-6 w-6">
                <path
                  fill="currentColor"
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M61.44,0c33.933,0,61.439,27.507,61.439,61.439 s-27.506,61.439-61.439,61.439C27.507,122.879,0,95.372,0,61.439S27.507,0,61.44,0L61.44,0z M73.451,39.151 c2.75-2.793,7.221-2.805,9.986-0.027c2.764,2.776,2.775,7.292,0.027,10.083L71.4,61.445l12.076,12.249 c2.729,2.77,2.689,7.257-0.08,10.022c-2.773,2.765-7.23,2.758-9.955-0.013L61.446,71.54L49.428,83.728 c-2.75,2.793-7.22,2.805-9.986,0.027c-2.763-2.776-2.776-7.293-0.027-10.084L51.48,61.434L39.403,49.185 c-2.728-2.769-2.689-7.256,0.082-10.022c2.772-2.765,7.229-2.758,9.953,0.013l11.997,12.165L73.451,39.151L73.451,39.151z"
                />
              </svg>
            ) : (
              <svg viewBox="0 0 122.88 103.17" className="h-6 w-6">
                <path
                  fill="currentColor"
                  d="M26,0h70.87c7.15,0,13.65,2.93,18.36,7.64l0.22,0.24c4.58,4.69,7.42,11.1,7.42,18.13v51.16c0,7.15-2.93,13.65-7.64,18.36 c-4.71,4.71-11.21,7.64-18.36,7.64H26c-7.14,0-13.64-2.93-18.35-7.64H7.64C2.93,90.82,0,84.32,0,77.16V26 c0-7.13,2.92-13.63,7.64-18.35l0.02-0.03C12.38,2.92,18.87,0,26,0L26,0z M41.31,29.74h40.26c2.25,0,4.09,1.84,4.09,4.09l0,0 c0,2.25-1.84,4.09-4.09,4.09H41.31c-2.25,0-4.09-1.84-4.09-4.09l0,0C37.22,31.58,39.06,29.74,41.31,29.74L41.31,29.74L41.31,29.74z M41.31,65.25h40.26c2.25,0,4.09,1.84,4.09,4.09l0,0c0,2.25-1.84,4.09-4.09,4.09l-40.26,0c-2.25,0-4.09-1.84-4.09-4.09l0,0 C37.22,67.09,39.06,65.25,41.31,65.25L41.31,65.25L41.31,65.25z M41.31,47.5h40.26c2.25,0,4.09,1.84,4.09,4.09l0,0 c0,2.25-1.84,4.09-4.09,4.09H41.31c-2.25,0-4.09-1.84-4.09-4.09l0,0C37.22,49.34,39.06,47.5,41.31,47.5L41.31,47.5L41.31,47.5z M96.88,8.2H26c-4.9,0-9.35,2-12.57,5.22l-0.02,0.02C10.2,16.65,8.2,21.1,8.2,26v51.16c0,4.89,2.01,9.34,5.23,12.56l-0.01,0.01 c3.23,3.22,7.68,5.23,12.57,5.23h70.87c4.88,0,9.33-2.01,12.56-5.24c3.23-3.23,5.24-7.68,5.24-12.56V26c0-4.8-1.93-9.17-5.04-12.39 l-0.19-0.18C106.21,10.21,101.77,8.2,96.88,8.2L96.88,8.2z"
                />
              </svg>
            )}
          </button>
        </div>
      </Container>

      {/* mobile menu */}
      {isOpen && (
        <div className="fixed inset-0 top-20 z-20 flex flex-col items-center justify-center gap-8 bg-background-darken md:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={toggleNav}
              className="font-display text-2xl tracking-wide text-fontcolor"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
