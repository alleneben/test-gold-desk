import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/desk/placeholder";

export const metadata: Metadata = { title: "Settlement Audit" };

export default function AuditPage() {
  return (
    <PlaceholderPage
      kicker="London Clearing"
      title="Settlement Audit Ledger"
      description="Hydrostatic assay slips, SEPA wires, vault cash, and custody cheques under continuous verification for the physical bullion desk."
      metrics={[
        { label: "Today's Tickets", value: "25", hint: "100% assayed" },
        { label: "Net Settlement", value: "-GHC 100,485", hint: "Vault payout on balance" },
        { label: "Clearing ID", value: "AU-9994-LDN", hint: "Session SEC-8492-OK" },
      ]}
    />
  );
}
