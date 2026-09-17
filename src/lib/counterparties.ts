export type VipAccount = {
  name: string;
  account: string;
  phone: string;
  safe: string;
  initials: string;
  tier: string;
};

export const VIP_ACCOUNTS: VipAccount[] = [
  {
    name: "Apex Minting Ltd (David O'Connor)",
    account: "#AU-9428-LDN",
    phone: "+233 24 555 0142",
    safe: "SAFE #14",
    initials: "AM",
    tier: "VIP Sovereign",
  },
  {
    name: "Geneva Vaulting Ltd",
    account: "#AU-1049-LDN",
    phone: "+233 20 811 1049",
    safe: "SAFE #08",
    initials: "GV",
    tier: "Platinum VIP",
  },
  {
    name: "Aurum Fine Jewelers",
    account: "#AU-7712-LDN",
    phone: "+233 30 266 1180",
    safe: "SAFE #21",
    initials: "AF",
    tier: "Commercial VIP",
  },
  {
    name: "Sovereign Bullion Partners",
    account: "#AU-3301-LDN",
    phone: "+233 24 430 3301",
    safe: "SAFE #03",
    initials: "SB",
    tier: "VIP Sovereign",
  },
  {
    name: "Mayfair Reserve Trust",
    account: "#AU-5518-LDN",
    phone: "+233 50 218 5518",
    safe: "SAFE #11",
    initials: "MR",
    tier: "Platinum VIP",
  },
  {
    name: "Kumasi Assay House",
    account: "#AU-8820-ACC",
    phone: "+233 32 202 4488",
    safe: "SAFE #17",
    initials: "KA",
    tier: "VIP Gold",
  },
];

export function findVipAccount(name: string): VipAccount | undefined {
  const query = name.trim().toLowerCase();
  return VIP_ACCOUNTS.find((account) => account.name.toLowerCase() === query);
}

export function filterVipAccounts(query: string): VipAccount[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return VIP_ACCOUNTS;
  return VIP_ACCOUNTS.filter((account) =>
    [account.name, account.account, account.phone, account.tier, account.initials].some((value) =>
      value.toLowerCase().includes(needle),
    ),
  );
}
