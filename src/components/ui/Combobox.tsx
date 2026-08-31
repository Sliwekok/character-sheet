"use client";

import ReactSelect, { ClassNamesConfig, GroupBase } from "react-select";
import { cn } from "@/utils/cn";

type ComboboxProps<T> = {
  options: T[];
  value: T | undefined;
  getOptionLabel: (option: T) => string;
  getOptionValue: (option: T) => string;
  onChange: (option: T) => void;
  placeholder?: string;
  isDisabled?: boolean;
  className?: string;
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
  placeholder,
  isDisabled,
  className,
}: ComboboxProps<T>) {
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
    dropdownIndicator: () => "text-fontcolor-secondary hover:text-fontcolor",
    clearIndicator: () => "text-fontcolor-secondary hover:text-fontcolor",
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
      isDisabled={isDisabled}
      classNames={classNames}
      options={options}
      value={value}
      getOptionLabel={getOptionLabel}
      getOptionValue={getOptionValue}
      onChange={(next) => {
        if (next) onChange(next);
      }}
      placeholder={placeholder ?? "Search..."}
      className={className}
    />
  );
}
