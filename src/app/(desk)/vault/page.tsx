import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/desk/placeholder";

export const metadata: Metadata = { title: "Vault Custody" };

export default function VaultPage() {
  return (
    <PlaceholderPage
      kicker="Physical Allocation"
      title="Vault Custody Register"
      description="Segregated bar inventory across the Zurich and Mayfair network, with safe allocation, serial verification, and same-day dispatch buffers."
      metrics={[
        { label: "In Custody", value: "18.4 kg", hint: "Apex Minting Ltd allocated" },
        { label: "Network Vaults", value: "2", hint: "Zurich Freezone • Mayfair" },
        { label: "Safe Reference", value: "#14", hint: "Account #AU-9428-LDN" },
      ]}
    />
  );
}
