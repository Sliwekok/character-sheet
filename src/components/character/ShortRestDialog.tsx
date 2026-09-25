"use client";

import { useState } from "react";
import { Alert, Button, formatModifier } from "@/components/ui";
import { HitDicePool } from "@/utils/hitDice";
import { cn } from "@/utils/cn";

/**
 * Asks how many Hit Dice to spend before finishing a Short Rest - one
 * stepper per die size (a multiclass Fighter/Wizard picks d10s and d6s
 * separately). "Finish short rest" hands the chosen counts to the page,
 * which rolls them, heals, and restores Pact Magic slots. Spending 0 is
 * fine - the rest still happens.
 */
export function ShortRestDialog({
    pools,
    conModifier,
    currentHp,
    maxHp,
    hasPactSlots,
    onConfirm,
    onCancel,
}: {
    pools: HitDicePool[];
    conModifier: number;
    currentHp: number;
    maxHp: number;
    hasPactSlots: boolean;
    onConfirm: (spend: Record<number, number>) => void;
    onCancel: () => void;
}) {
    const [spend, setSpend] = useState<Record<number, number>>({});
    const totalChosen = Object.values(spend).reduce((sum, count) => sum + count, 0);
    const anyRemaining = pools.some((pool) => pool.remaining > 0);

    function adjust(pool: HitDicePool, delta: number) {
        setSpend((current) => {
            const next = Math.max(0, Math.min(pool.remaining, (current[pool.hitDie] ?? 0) + delta));
            return { ...current, [pool.hitDie]: next };
        });
    }

    return (
        <Alert
            modal
            variant="confirm"
            title="Short rest"
            onDismiss={onCancel}
            actions={
                <>
                    <Button size="sm" onClick={() => onConfirm(spend)}>
                        {totalChosen > 0 ? `Roll ${totalChosen} Hit ${totalChosen === 1 ? "Die" : "Dice"} & rest` : "Rest without spending"}
                    </Button>
                    <Button size="sm" variant="secondary" onClick={onCancel}>
                        Cancel
                    </Button>
                </>
            }
        >
            <div className="flex flex-col gap-3">
                <p>
                    HP {currentHp}/{maxHp}. Each Hit Die spent heals its roll {formatModifier(conModifier)} (Constitution).
                    {hasPactSlots && " Pact Magic slots are restored."}
                </p>
                {!anyRemaining && <p>No Hit Dice left - they come back on a Long rest.</p>}
                <div className="flex flex-col gap-2">
                    {pools.map((pool) => {
                        const chosen = spend[pool.hitDie] ?? 0;
                        return (
                            <div key={pool.hitDie} className="flex flex-wrap items-center gap-3">
                                <span className="w-10 font-semibold text-fontcolor">d{pool.hitDie}</span>
                                <div className="flex items-center gap-1">
                                    <StepButton label={`Spend one fewer d${pool.hitDie}`} disabled={chosen <= 0} onClick={() => adjust(pool, -1)}>
                                        −
                                    </StepButton>
                                    <span className="w-8 text-center text-base font-semibold text-fontcolor" aria-live="polite">
                                        {chosen}
                                    </span>
                                    <StepButton label={`Spend one more d${pool.hitDie}`} disabled={chosen >= pool.remaining} onClick={() => adjust(pool, 1)}>
                                        +
                                    </StepButton>
                                </div>
                                <span className="text-xs">
                                    {pool.remaining}/{pool.total} left
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </Alert>
    );
}

function StepButton({
    label,
    disabled,
    onClick,
    children,
}: {
    label: string;
    disabled: boolean;
    onClick: () => void;
    children: string;
}) {
    return (
        <button
            type="button"
            aria-label={label}
            disabled={disabled}
            onClick={onClick}
            className={cn(
                "h-8 w-8 cursor-pointer rounded-full border border-border-strong text-fontcolor transition-colors",
                "hover:border-foreground hover:text-foreground disabled:cursor-default disabled:opacity-40 disabled:hover:border-border-strong disabled:hover:text-fontcolor"
            )}
        >
            {children}
        </button>
    );
}
