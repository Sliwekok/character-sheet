/** viewBox 0 0 24 28 - a heater shield. */
const SHIELD_PATH = "M12 1.2 L22.4 4.6 V12.8 C22.4 19.2 17.9 24.1 12 26.8 C6.1 24.1 1.6 19.2 1.6 12.8 V4.6 Z";

/** The header's AC value written on a shield, the way paper sheets show it. */
export function ArmorClassShield({ value }: { value: number }) {
    return (
        <span
            role="img"
            aria-label={`Armor Class ${value}`}
            className="relative flex h-[62px] w-[54px] shrink-0 items-center justify-center"
        >
            <svg viewBox="0 0 24 28" aria-hidden="true" className="absolute inset-0 h-full w-full overflow-visible">
                <path
                    d={SHIELD_PATH}
                    className="fill-background-darken stroke-border-strong"
                    strokeWidth={1.1}
                    strokeLinejoin="round"
                />
                <path
                    d="M12 3.6 L20 6.2 V12.8 C20 17.9 16.6 21.9 12 24.2 C7.4 21.9 4 17.9 4 12.8 V6.2 Z"
                    className="fill-none stroke-border"
                    strokeWidth={0.6}
                    strokeLinejoin="round"
                />
            </svg>
            <span className="relative -translate-y-0.5 text-2xl font-bold leading-none text-fontcolor">{value}</span>
        </span>
    );
}
