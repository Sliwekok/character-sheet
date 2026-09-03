"use client";

import { usePathname } from "next/navigation";
import Nav from "./nav";

/** Routes that intentionally render without the nav bar. */
const HIDDEN_PATHS = new Set(["/", "/newCharacter/manual"]);

/** `/character/<id>/print` - the printable sheet, which goes without chrome. */
function isPrintPage(pathname: string): boolean {
  return /^\/character\/[^/]+\/print\/?$/.test(pathname);
}

/**
 * Renders the shared nav bar for every route except the handful that
 * intentionally go without it (the landing page, the manual character
 * wizard, and the printable character sheet).
 *
 * This lives in the root layout rather than in each page so `Nav` mounts
 * once per session instead of once per navigation - previously every page
 * rendered its own `<Nav />`, so navigating anywhere remounted it and
 * re-ran its search-index effect from scratch. `buildSearchIndexAsync()` is
 * now cached too (see utils/searchIndex.ts), so this is a belt-and-
 * suspenders fix: either change alone fixes the rebuild-per-navigation
 * cost, but keeping `Nav` mounted also preserves its own UI state (the
 * search box, the mobile menu) across navigations instead of resetting it
 * every time.
 */
export default function NavGate() {
  const pathname = usePathname();

  if (HIDDEN_PATHS.has(pathname) || isPrintPage(pathname)) return null;

  return <Nav />;
}
