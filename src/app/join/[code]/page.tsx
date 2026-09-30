import type { Metadata } from "next";
import JoinCampaignView from "./JoinCampaignView";

export const metadata: Metadata = { title: "Join campaign · Character Sheet" };

export default function Page() {
  return <JoinCampaignView />;
}
