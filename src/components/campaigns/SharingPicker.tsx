"use client";

import Link from "next/link";
import { useId } from "react";
import type { CharacterVisibility } from "@/interfaces/Campaign";
import { CHARACTER_VISIBILITIES } from "@/interfaces/Campaign";
import { Select } from "@/components/ui";
import { useAuth } from "@/components/auth/AuthProvider";
import { cn } from "@/utils/cn";
import { CharacterSharing, VISIBILITY_DESCRIPTIONS, VISIBILITY_LABELS } from "@/utils/campaigns";
import { useCampaigns } from "./useCampaigns";

/**
 * "Who can see this character?" - Private / Shared with campaign / Public
 * link, plus the campaign to show it in. Used by the creation flows
 * (manual wizard review, random, import) and the sheet's Sharing dialog.
 *
 * Sharing only works for characters synced to an account, so signed-out
 * players get the choice disabled with a sign-in hint instead.
 */
export function SharingPicker({
    value,
    onChange,
    className,
    stacked = false,
}: {
    value: CharacterSharing;
    onChange: (next: CharacterSharing) => void;
    className?: string;
    /** One option per row - for narrow containers like dialogs. */
    stacked?: boolean;
}) {
    const { status } = useAuth();
    const { campaigns, loading, error } = useCampaigns();
    const groupName = useId();
    const signedOut = status === "anonymous";

    function pickVisibility(visibility: CharacterVisibility) {
        let campaignId = visibility === "private" ? null : value.campaignId;
        // Shared needs a campaign - preselect when there's only one to pick.
        if (visibility === "shared" && !campaignId && campaigns.length === 1) campaignId = campaigns[0].id;
        onChange({ visibility, campaignId });
    }

    const selectedCampaignMissing =
        !loading && value.campaignId !== null && !campaigns.some((campaign) => campaign.id === value.campaignId);

    return (
        <div className={cn("flex flex-col gap-3 text-sm", className)}>
            <div role="radiogroup" aria-label="Character visibility" className={cn("grid gap-2", !stacked && "sm:grid-cols-3")}>
                {CHARACTER_VISIBILITIES.map((visibility) => {
                    const checked = value.visibility === visibility;
                    const disabled = signedOut && visibility !== "private";
                    return (
                        <label
                            key={visibility}
                            className={cn(
                                "flex cursor-pointer flex-col gap-1 rounded-(--radius) border px-3 py-2 transition-colors",
                                checked ? "border-foreground bg-foreground/10" : "border-border-strong hover:border-foreground/60",
                                disabled && "cursor-not-allowed opacity-50 hover:border-border-strong"
                            )}
                        >
                            <span className="flex items-center gap-2 font-semibold text-fontcolor">
                                <input
                                    type="radio"
                                    name={groupName}
                                    value={visibility}
                                    checked={checked}
                                    disabled={disabled}
                                    onChange={() => pickVisibility(visibility)}
                                    className="accent-foreground"
                                />
                                {VISIBILITY_LABELS[visibility]}
                            </span>
                            <span className="text-xs text-fontcolor-secondary">{VISIBILITY_DESCRIPTIONS[visibility]}</span>
                        </label>
                    );
                })}
            </div>

            {signedOut && (
                <p className="text-xs text-fontcolor-secondary">
                    <Link href="/login" className="text-foreground underline-offset-4 hover:underline">
                        Sign in
                    </Link>{" "}
                    to share characters - without an account they only live in this browser.
                </p>
            )}

            {value.visibility !== "private" && !signedOut && (
                <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-foreground">
                        Campaign{value.visibility === "public" ? " (optional)" : ""}
                    </span>
                    {loading ? (
                        <span className="text-xs text-fontcolor-secondary">Loading your campaigns…</span>
                    ) : campaigns.length === 0 ? (
                        <span className="text-xs text-fontcolor-secondary">
                            You&apos;re not in any campaign yet.{" "}
                            <Link href="/campaigns" className="text-foreground underline-offset-4 hover:underline">
                                Create one
                            </Link>{" "}
                            or ask your GM for an invite link.
                        </span>
                    ) : (
                        <Select
                            value={value.campaignId ?? ""}
                            onChange={(event) => onChange({ ...value, campaignId: event.target.value || null })}
                        >
                            <option value="">
                                {value.visibility === "public" ? "— Not listed in a campaign —" : "— Pick a campaign —"}
                            </option>
                            {campaigns.map((campaign) => (
                                <option key={campaign.id} value={campaign.id}>
                                    {campaign.name}
                                </option>
                            ))}
                        </Select>
                    )}
                    {error && <span className="text-xs text-foreground-danger">Couldn&apos;t load campaigns: {error}</span>}
                    {selectedCampaignMissing && (
                        <span className="text-xs text-foreground-danger">
                            The campaign this character was in no longer exists or you left it - pick another one.
                        </span>
                    )}
                    {value.visibility === "shared" && !value.campaignId && campaigns.length > 0 && (
                        <span className="text-xs text-fontcolor-secondary">Pick the campaign whose players should see it.</span>
                    )}
                </label>
            )}
        </div>
    );
}
