import type { Metadata } from "next";
import CampaignsView from "./CampaignsView";

export const metadata: Metadata = { title: "Campaigns · Character Sheet" };

export default function Page() {
  return <CampaignsView />;
}
