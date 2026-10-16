"use client";

import { useEffect, useId, useState } from "react";
import ReactSelect, { ClassNamesConfig, GroupBase, StylesConfig } from "react-select";
import { cn } from "@/utils/cn";

/**
 * z-index of the portalled dropdown menu. Above page content (cards, the
 * wizard's Continue/Back bar, sticky side panels) but BELOW the sticky nav
 * bar (`z-300` in app/layout/nav.tsx), so a menu that's open while the page
 * scrolls slides under the nav like the rest of the content instead of
 * painting over it.
 */
export const COMBOBOX_MENU_Z_INDEX = 250;

type ComboboxProps<T> = {
  options: T[];
  value: T | null | undefined;
  getOptionLabel: (option: T) => string;
  getOptionValue: (option: T) => string;
  onChange: (option: T) => void;
  onInputChange?: (value: string) => void;
  /** When set, shows react-select's clear ("x") control and is called instead of `onChange` when the player clears the field - opt-in so fields that must always hold a value (Race, Background) keep their current no-clear behavior by just omitting this prop. */
  onClear?: () => void;
  placeholder?: string;
  isDisabled?: boolean;
  className?: string;
  /**
   * Render the dropdown menu into `document.body` (default `true`).
   *
   * Without the portal the menu is an absolutely-positioned child of the
   * control, so it gets trapped in whatever stacking context its nearest
   * ancestor creates - and `Card` creates one (`backdrop-blur`), as does
   * any element with `opacity < 1` (e.g. a disabled Continue button).
   * Content painted later in the page then covers the open menu, which
   * reads as a "see-through" list with the Continue button floating on
   * top of it. Portalling lifts the menu out of every card. Only the nav
   * bar's own search box opts out (`portalMenu={false}`): it already
   * lives in the topmost stacking context (the nav), and a portalled menu
   * would sit under the nav (see COMBOBOX_MENU_Z_INDEX).
   */
  portalMenu?: boolean;
};

/**
 * Searchable, type-to-filter dropdown ("Select2"-style combobox), built on
 * `react-select` and restyled with the `unstyled` prop + a `classNames`
 * map (rather than react-select's `styles` object, which fights Tailwind)
 * so it reuses the exact same utility classes as `Select`/`TextInput`
 * instead of introducing a visually different control. Not creatable -
 * the player can only pick from `options` by typing to filter, not add a
 * new one - see RaceStep, the first place this replaces a plain `Select`.
 */
export function Combobox<T>({
  options,
  value,
  getOptionLabel,
  getOptionValue,
  onChange,
  onClear,
  placeholder,
  isDisabled,
  className,
  onInputChange,
  portalMenu = true,
}: ComboboxProps<T>) {
  // Stable ids for react-select's generated element ids (`react-select-N-input`
  // etc.) - without this the server and client counters disagree and React
  // reports a hydration mismatch on every page that renders a Combobox.
  const instanceId = useId();
  // `document.body` only exists on the client; resolving it in an effect
  // keeps the server render and the first client render identical.
  const [menuPortalTarget, setMenuPortalTarget] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setMenuPortalTarget(portalMenu ? document.body : null);
  }, [portalMenu]);

  const styles: StylesConfig<T, false, GroupBase<T>> = {
    // react-select sets the portal's z-index inline (1), which a Tailwind
    // class can't override - hence `styles` here rather than `classNames`.
    menuPortal: (base) => ({ ...base, zIndex: COMBOBOX_MENU_Z_INDEX }),
  };

  const classNames: ClassNamesConfig<T, false, GroupBase<T>> = {
    control: (state) =>
      cn(
        "w-full rounded-(--radius) border bg-background-darken px-2 py-1 text-fontcolor transition-colors",
        state.isFocused ? "border-foreground ring-2 ring-foreground" : "border-border-strong",
        state.isDisabled && "opacity-50"
      ),
    valueContainer: () => "gap-1",
    placeholder: () => "text-fontcolor-secondary",
    input: () => "text-fontcolor",
    singleValue: () => "text-fontcolor",
    indicatorsContainer: () => "text-fontcolor-secondary",
    indicatorSeparator: () => "bg-border-strong",
    dropdownIndicator: () => "cursor-pointer text-fontcolor-secondary hover:text-fontcolor",
    clearIndicator: () => "cursor-pointer text-fontcolor-secondary hover:text-fontcolor",
    menu: () =>
      "mt-1 overflow-hidden rounded-(--radius) border border-border-strong bg-background-darken shadow-lg",
    menuList: () => "py-1",
    option: (state) =>
      cn(
        "cursor-pointer px-3 py-2 text-sm",
        state.isSelected
          ? "bg-foreground text-background-darken"
          : state.isFocused
            ? "bg-background-elevated text-fontcolor"
            : "text-fontcolor"
      ),
    noOptionsMessage: () => "px-3 py-4 text-center text-sm text-fontcolor-secondary",
  };

  return (
    <ReactSelect<T, false>
      unstyled
      instanceId={instanceId}
      menuPortalTarget={menuPortalTarget}
      menuPosition="absolute"
      // Flip above the control when there isn't room below - with the menu
      // portalled, react-select can no longer scroll the page to reveal a
      // menu that would otherwise open off the bottom of the viewport.
      menuPlacement="auto"
      styles={styles}
      isDisabled={isDisabled}
      isClearable={Boolean(onClear)}
      classNames={classNames}
      options={options}
      value={value}
      getOptionLabel={getOptionLabel}
      getOptionValue={getOptionValue}
      onInputChange={(inputValue) => {
        onInputChange?.(inputValue);
      }}
      onChange={(next) => {
        if (next) onChange(next);
        else onClear?.();
      }}
      placeholder={placeholder ?? "Search..."}
      className={className}
    />
  );
}
