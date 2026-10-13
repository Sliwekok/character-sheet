/**
 * Shared layout classes for the New character mode picker. `page.tsx` and
 * `loading.tsx` both use them so the skeleton cards occupy exactly the same
 * boxes as the real Import / Step-by-step / Random cards: one row of three
 * from `md` up, stretched to equal height by the grid + `h-full`.
 */
export const MODE_GRID_CLASSES = "mt-10 grid grid-cols-1 items-stretch gap-6 md:grid-cols-3";
export const MODE_CARD_CLASSES = "relative flex h-full flex-col gap-5 overflow-hidden p-6";
