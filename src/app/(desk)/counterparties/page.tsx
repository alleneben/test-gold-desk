import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/desk/placeholder";

export const metadata: Metadata = { title: "Counterparties" };

export default function CounterpartiesPage() {
  return (
    <PlaceholderPage
      kicker="KYC / AML Register"
      title="Counterparty Intelligence"
      description="Walk-in dossiers, loyal VIP custody accounts, lifetime turnover, and preferential buy subsidies for the physical bullion desk."
      metrics={[
        { label: "Active Files", value: "214", hint: "Verified under London clearing rules" },
        { label: "VIP Sovereign", value: "18", hint: "Allocated vault account holders" },
        { label: "YTD Desk Turnover", value: "GHC 1.42M", hint: "Apex Minting Ltd leading" },
      ]}
    />
  );
}
