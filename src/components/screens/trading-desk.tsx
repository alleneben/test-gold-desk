"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/desk/icon";
import { VipNameField } from "@/components/desk/vip-name-field";
import { usePriceSchedule } from "@/components/desk/price-schedule-provider";
import {
  GRAMS_PER_TROY_OZ,
  formatGhc,
  formatNum,
  hydrostaticValuation,
  type TradeDirection,
} from "@/lib/assay";
import { formatDensityRange } from "@/lib/price-schedule";
import { VIP_ACCOUNTS, findVipAccount, type VipAccount } from "@/lib/counterparties";

type ClientType = "walkin" | "loyal";
type Disbursement = "sepa" | "cash" | "cheque";
type LedgerFilter = "all" | "BUY" | "SELL";

const LEDGER = [
  {
    ticket: "#TK-8941",
    time: "11:42 AM",
    name: "Marcus Albright",
    tier: "Walk-in Direct",
    vip: false,
    type: "BUY" as const,
    air: "125.40 g",
    water: "118.80 g",
    density: "18.99 g/cm³",
    karat: "22K Crown",
    rate: "GHC 67.50/g",
    settlement: "GHC 8,464.50",
    status: "Settled",
  },
  {
    ticket: "#TK-8940",
    time: "11:15 AM",
    name: "Geneva Vaulting Ltd",
    tier: "Loyal VIP #AU-1049",
    vip: true,
    type: "SELL" as const,
    air: "500.00 g",
    water: "474.10 g",
    density: "19.31 g/cm³",
    karat: "24K Bullion 999.9",
    rate: "GHC 76.80/g",
    settlement: "GHC 38,400.00",
    status: "Completed",
  },
  {
    ticket: "#TK-8939",
    time: "10:48 AM",
    name: "Elena Rostova",
    tier: "Walk-in Direct",
    vip: false,
    type: "BUY" as const,
    air: "42.10 g",
    water: "39.42 g",
    density: "15.70 g/cm³",
    karat: "18K Alloy",
    rate: "GHC 55.10/g",
    settlement: "GHC 2,319.71",
    status: "Settled",
  },
  {
    ticket: "#TK-8938",
    time: "10:12 AM",
    name: "Aurum Fine Jewelers",
    tier: "Loyal VIP #AU-7712",
    vip: true,
    type: "BUY" as const,
    air: "310.80 g",
    water: "294.60 g",
    density: "19.18 g/cm³",
    karat: "22K Casting",
    rate: "GHC 68.10/g",
    settlement: "GHC 21,165.48",
    status: "Settled",
  },
];

export function TradingDesk() {
  const { schedule } = usePriceSchedule();
  const [direction, setDirection] = useState<TradeDirection>("BUY");
  const [clientType, setClientType] = useState<ClientType>("loyal");
  const [clientName, setClientName] = useState(VIP_ACCOUNTS[0].name);
  const [custodyRef, setCustodyRef] = useState(VIP_ACCOUNTS[0].account);
  const [phone, setPhone] = useState(VIP_ACCOUNTS[0].phone);
  const [selectedVip, setSelectedVip] = useState<VipAccount | null>(VIP_ACCOUNTS[0]);
  const [wAir, setWAir] = useState("254.80");
  const [wWater, setWWater] = useState("241.60");
  const [disbursement, setDisbursement] = useState<Disbursement>("sepa");
  const [authorized, setAuthorized] = useState(false);
  const [ledgerFilter, setLedgerFilter] = useState<LedgerFilter>("all");

  const air = Number(wAir) || 0;
  const water = Number(wWater) || 0;
  const assay = useMemo(
    () => hydrostaticValuation(air, water, direction, { rows: schedule.rows, clientType }),
    [air, water, direction, schedule.rows, clientType],
  );
  const densityMatch = assay.valid && assay.specificGravity >= 19.2 && assay.specificGravity <= 19.38;
  const payout = assay.valid ? air * assay.ratePerGram : 0;
  const troyOz = air / GRAMS_PER_TROY_OZ;
  const rows = LEDGER.filter((row) => ledgerFilter === "all" || row.type === ledgerFilter);
  const activeBoard = assay.matchedGrade;
  const payoutReady = assay.valid && payout > 0;

  const actionLabel =
    direction === "BUY" ? "Authorize & Print Assay Settlement" : "Authorize & Execute Bullion Sale";

  useEffect(() => {
    setAuthorized(false);
  }, [direction, clientType, clientName, custodyRef, phone, wAir, wWater, disbursement, schedule.updatedAt]);

  function applyVip(account: VipAccount) {
    setSelectedVip(account);
    setClientName(account.name);
    setCustodyRef(account.account);
    setPhone(account.phone);
  }

  function chooseWalkIn() {
    setClientType("walkin");
    setSelectedVip(null);
    setCustodyRef("");
    setPhone("");
    if (findVipAccount(clientName)) setClientName("");
  }

  function chooseLoyal() {
    setClientType("loyal");
    applyVip(findVipAccount(clientName) ?? VIP_ACCOUNTS[0]);
  }

  function loadSlip(row: (typeof LEDGER)[number]) {
    const vip = findVipAccount(row.name);
    if (row.vip || vip) {
      setClientType("loyal");
      applyVip(
        vip ?? {
          name: row.name,
          account: row.tier.replace("Loyal VIP ", "").trim(),
          phone: "",
          safe: "",
          initials: row.name.slice(0, 2).toUpperCase(),
          tier: "Loyal VIP",
        },
      );
    } else {
      chooseWalkIn();
      setClientName(row.name);
    }
    setDirection(row.type);
    setWAir(row.air.replace(" g", ""));
    setWWater(row.water.replace(" g", ""));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function exportCsv() {
    const headers = [
      "Ticket",
      "Time",
      "Counterparty",
      "Tier",
      "Type",
      "Air Wt",
      "Water Wt",
      "Density",
      "Karat",
      "Rate",
      "Settlement",
      "Status",
    ];
    const lines = [
      headers.join(","),
      ...rows.map((row) =>
        [
          row.ticket,
          row.time,
          `"${row.name.replaceAll('"', '""')}"`,
          `"${row.tier.replaceAll('"', '""')}"`,
          row.type,
          row.air,
          row.water,
          row.density,
          `"${row.karat.replaceAll('"', '""')}"`,
          row.rate,
          row.settlement,
          row.status,
        ].join(","),
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "assay-ledger.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-10 px-6 py-8 lg:px-10">
      <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12">
        <div className="flex flex-col gap-8 rounded-2xl border border-outline bg-surface p-7 shadow-sm lg:col-span-7 lg:p-9">
          <div className="flex flex-col justify-between gap-4 border-b border-outline pb-6 sm:flex-row sm:items-center">
            <div className="flex flex-col">
              <h2 className="font-headline text-xl font-bold tracking-tight text-on-surface">
                Bullion Intake & Assay Execution
              </h2>
              <p className="mt-0.5 font-mono text-xs text-on-surface-variant">
                TICKET #TK-8942 • METTLER TOLEDO PRECISION LINKED
              </p>
            </div>
            <div className="inline-flex self-start rounded-xl border border-outline bg-surface-subtle p-1 sm:self-auto">
              <button
                id="tab-buy"
                type="button"
                onClick={() => {
                  setDirection("BUY");
                  setAuthorized(false);
                }}
                className={
                  direction === "BUY"
                    ? "flex items-center gap-1.5 rounded-lg bg-surface px-4 py-1.5 text-xs font-semibold text-on-surface shadow-sm transition-all"
                    : "flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-medium text-on-surface-variant transition-all hover:text-on-surface"
                }
              >
                {direction === "BUY" ? <span className="h-1.5 w-1.5 rounded-full bg-primary" /> : null}
                Buy (Inflow)
              </button>
              <button
                id="tab-sell"
                type="button"
                onClick={() => {
                  setDirection("SELL");
                  setAuthorized(false);
                }}
                className={
                  direction === "SELL"
                    ? "flex items-center gap-1.5 rounded-lg bg-surface px-4 py-1.5 text-xs font-semibold text-on-surface shadow-sm transition-all"
                    : "flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-medium text-on-surface-variant transition-all hover:text-on-surface"
                }
              >
                {direction === "SELL" ? <span className="h-1.5 w-1.5 rounded-full bg-primary" /> : null}
                Sell (Outflow)
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <label className="font-mono text-xs font-medium tracking-wider text-on-surface-variant uppercase">
                1. Customer Details
              </label>
              {/* <span className="flex items-center gap-1 font-mono text-xs text-tertiary">
                <Icon name="verified" className="text-[14px]" /> KYC / AML Verified
              </span> */}
            </div>
            <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Counterparty tier">
              <button
                type="button"
                role="radio"
                aria-checked={clientType === "walkin"}
                onClick={chooseWalkIn}
                className={`relative flex cursor-pointer flex-col rounded-xl border p-3.5 text-left transition-all ${
                  clientType === "walkin"
                    ? "border-primary bg-primary-light/40"
                    : "border-outline bg-surface-subtle hover:bg-surface"
                }`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-semibold text-on-surface">Walk-in Client</span>
                  <span
                    className={`h-3.5 w-3.5 rounded-full border ${
                      clientType === "walkin" ? "border-primary bg-primary" : "border-outline bg-surface"
                    }`}
                  />
                </div>
                {/* <span className="text-xs text-on-surface-variant">Spot board fix, standard desk spread.</span> */}
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={clientType === "loyal"}
                onClick={chooseLoyal}
                className={`relative flex cursor-pointer flex-col rounded-xl border p-3.5 text-left transition-all ${
                  clientType === "loyal"
                    ? "border-primary bg-primary-light/40"
                    : "border-outline bg-surface-subtle hover:bg-surface"
                }`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-semibold text-on-surface">Loyal VIP Customer</span>
                  <span
                    className={`h-3.5 w-3.5 rounded-full border ${
                      clientType === "loyal" ? "border-primary bg-primary" : "border-outline bg-surface"
                    }`}
                  />
                </div>
                <span className="text-xs text-on-surface-variant">
                  {/* Tier 1 Sovereign • +GHC 0.50/g buy subsidy incentive */}
                </span>
              </button>
            </div>
            <div className="mt-1 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="client-name" className="text-xs font-medium text-on-surface-variant">
                  Customer Full Name
                </label>
                {clientType === "loyal" ? (
                  <VipNameField value={selectedVip} onSelect={applyVip} />
                ) : (
                  <input
                    id="client-name"
                    className="w-full rounded-lg border border-outline bg-surface-subtle px-3.5 py-2 text-sm text-on-surface transition-colors focus:border-primary focus:bg-surface focus:outline-none"
                    type="text"
                    placeholder="Walk-in client full name"
                    value={clientName}
                    onChange={(event) => setClientName(event.target.value)}
                  />
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="client-phone" className="text-xs font-medium text-on-surface-variant">
                  Phone Number
                </label>
                <input
                  id="client-phone"
                  className="w-full rounded-lg border border-outline bg-surface-subtle px-3.5 py-2 font-mono text-sm text-on-surface transition-colors focus:border-primary focus:bg-surface focus:outline-none"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+233 00 000 0000"
                  readOnly={clientType === "loyal"}
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="custody-ref" className="text-xs font-medium text-on-surface-variant">
                  Account Reference
                </label>
                <div className="relative">
                  <input
                    id="custody-ref"
                    className={`w-full rounded-lg border border-outline bg-surface-subtle px-3.5 py-2 font-mono text-sm text-on-surface ${selectedVip?.safe ? "pr-24" : ""}`}
                    readOnly
                    type="text"
                    placeholder={clientType === "loyal" ? "Select a VIP account" : "Not allocated"}
                    value={custodyRef}
                  />
                  {selectedVip?.safe ? (
                    <span className="absolute top-2.5 right-3 font-mono text-[11px] text-tertiary">{selectedVip.safe}</span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* <div className="flex flex-col gap-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="font-mono text-xs font-medium tracking-wider text-on-surface-variant uppercase">
                2. Board Fixing Benchmark
              </label>
              <span className="font-mono text-xs text-on-surface-variant">Live AM Fixing</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {(
                [
                  ["24K Fine", "GHC 74.20", "Active Baseline"],
                  ["22K Crown", "GHC 68.05", "91.6% Au"],
                  ["18K Alloy", "GHC 55.65", "75.0% Au"],
                  ["14K Standard", "GHC 43.40", "58.5% Au"],
                ] as const
              ).map(([title, price, hint]) => {
                const active = activeBoard === title;
                return (
                <div
                  key={title}
                  className={`flex flex-col gap-0.5 rounded-xl border p-3 ${
                    active ? "border-primary/40 bg-primary-light/30" : "border-outline bg-surface-subtle"
                  }`}
                >
                  <span className={`text-xs ${active ? "font-semibold text-on-surface" : "font-medium text-on-surface"}`}>
                    {title}
                  </span>
                  <span className={`font-mono text-base ${active ? "font-bold" : "font-semibold"} text-on-surface`}>
                    {price}
                    <span className="text-xs font-normal text-on-surface-variant">/g</span>
                  </span>
                  <span
                    className={`mt-0.5 font-mono text-[10px] ${active ? "font-medium text-tertiary uppercase" : "text-on-surface-variant"}`}
                  >
                    {active ? "Active Baseline" : hint}
                  </span>
                </div>
                );
              })}
            </div>
          </div> */}

          <div className="flex flex-col gap-4 rounded-2xl border border-outline bg-surface-subtle p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-4 w-1.5 rounded-full bg-primary" />
                <span className="font-mono text-xs font-semibold tracking-wider text-on-surface uppercase">
                  Hydrostatic Metrology Assay
                </span>
              </div>
              {/* <span className="font-mono text-xs text-on-surface-variant">Water Temp: 20.2°C (Factor 1.000)</span> */}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="input-wair" className="text-xs font-medium text-on-surface-variant">
                    Dry Weight in Air (W_air)
                  </label>
                  <span className="font-mono text-[11px] text-tertiary">Live Scale</span>
                </div>
                <div className="relative flex items-center">
                  <input
                    id="input-wair"
                    className="w-full rounded-xl border border-outline bg-surface px-4 py-2.5 pr-16 font-mono text-lg font-semibold text-on-surface transition-colors focus:border-primary focus:outline-none"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    type="text"
                    value={wAir}
                    onChange={(event) => setWAir(event.target.value)}
                  />
                  <span className="pointer-events-none absolute right-4 font-mono text-xs text-on-surface-variant">
                    grams
                  </span>
                </div>
                <span className="font-mono text-[11px] text-on-surface-variant">
                  ~{formatNum(troyOz, 4)} Troy Ounces (ozt)
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="input-wwater" className="text-xs font-medium text-on-surface-variant">
                    Submerged Weight in Water (W_water)
                  </label>
                  <span className="font-mono text-[11px] text-on-surface-variant">Archimedes</span>
                </div>
                <div className="relative flex items-center">
                  <input
                    id="input-wwater"
                    className="w-full rounded-xl border border-outline bg-surface px-4 py-2.5 pr-16 font-mono text-lg font-semibold text-on-surface transition-colors focus:border-primary focus:outline-none"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    type="text"
                    value={wWater}
                    onChange={(event) => setWWater(event.target.value)}
                  />
                  <span className="pointer-events-none absolute right-4 font-mono text-xs text-on-surface-variant">
                    grams
                  </span>
                </div>
                <span className="font-mono text-[11px] text-on-surface-variant">
                  Displacement: {formatNum(assay.displacedVolume, 2)} cm³
                </span>
              </div>
            </div>
            <div className="mt-2 flex flex-col items-center justify-between gap-4 border-t border-outline pt-4 sm:flex-row">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${densityMatch ? "bg-tertiary-light text-tertiary" : "bg-primary-light text-primary-dark"}`}
                >
                  <Icon name={densityMatch ? "check" : "science"} className="text-[20px]" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-xs text-on-surface-variant uppercase">Specific Gravity:</span>
                    <span className="font-mono text-lg font-bold text-on-surface">
                      {assay.valid ? formatNum(assay.specificGravity, 2) : "—"}
                    </span>
                    <span className="font-mono text-xs text-on-surface-variant">g/cm³</span>
                  </div>
                  <span className={`text-xs font-medium ${densityMatch ? "text-tertiary" : "text-primary-dark"}`}>
                    {!assay.valid
                      ? "W_air must exceed W_water"
                      : densityMatch
                        ? "99.8% Density Tolerance Match"
                        : "Outside 24K density band"}
                  </span>
                </div>
              </div>
              <div className="text-right sm:border-l sm:border-outline sm:pl-6">
                <div className="font-mono text-[11px] text-on-surface-variant uppercase">Assay Result</div>
                <div className="font-headline text-sm font-bold text-primary-dark">{assay.karatLabel}</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-5 pt-2">
            <div className="flex flex-col gap-2.5 text-sm">
              <div className="flex items-center justify-between text-on-surface-variant">
                <span>
                  Gross Gold Value ({formatNum(air, 2)}g × {formatGhc(assay.ratePerGram)}/g Base):
                </span>
                <span className="font-mono font-medium text-on-surface">{formatGhc(payout)}</span>
              </div>
              {/* {subsidy > 0 ? (
                <div className="flex items-center justify-between text-tertiary">
                  <span className="flex items-center gap-1.5">VIP Account Subsidy (+GHC 0.50/g applied):</span>
                  <span className="font-mono font-medium">+{formatGhc(subsidy)}</span>
                </div>
              ) : (
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span>VIP Account Subsidy:</span>
                  <span className="font-mono text-xs">Not applied</span>
                </div>
              )} */}
              {/* <div className="flex items-center justify-between text-on-surface-variant">
                <span>Hydrostatic Assay Metrology Fee:</span>
                <span className="font-mono text-xs">Waived (GHC 0.00)</span>
              </div> */}
              <div className="my-1 h-px bg-outline" />
              <div className="flex items-baseline justify-between pt-1">
                <div className="flex flex-col">
                  <span className="font-mono text-xs tracking-wider text-on-surface-variant uppercase">
                    {direction === "BUY" ? "Net Payout to Customer" : "Net Receipt from Customer"}
                  </span>
                  <span className="text-xs text-on-surface-variant">Immediate Physical Intake Settlement</span>
                </div>
                <div className="font-mono text-3xl font-bold tracking-tight text-on-surface">{formatGhc(payout)}</div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="font-mono text-xs tracking-wider text-on-surface-variant uppercase">
                Payment Method
              </span>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    ["sepa", "Mobile Money Transfer"],
                    ["cash", "Cash"],
                    ["cheque", "Cheque"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setDisbursement(id)}
                    className={
                      disbursement === id
                        ? "rounded-lg border border-primary bg-primary-light/40 px-3 py-2 text-center text-xs font-medium text-on-surface"
                        : "rounded-lg border border-outline bg-surface-subtle px-3 py-2 text-center text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface hover:text-on-surface"
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="pt-2">
              <button
                id="btn-execute-ticket"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-on-surface px-6 py-4 font-headline text-sm font-semibold tracking-wide text-surface shadow-sm transition-all hover:bg-black hover:shadow disabled:cursor-not-allowed disabled:bg-on-surface/40 disabled:shadow-none"
                type="button"
                disabled={!payoutReady}
                onClick={() => setAuthorized(true)}
              >
                <Icon name="verified" className="text-[18px] text-primary" />
                <span>
                  {authorized
                    ? "Settlement Authorized"
                    : payoutReady
                      ? `${actionLabel} (${formatGhc(payout)})`
                      : "Enter valid hydrostatic weights"}
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-8 lg:col-span-5">
          <div className="flex flex-col gap-5 rounded-2xl border border-outline bg-surface p-7 shadow-sm">
            <div className="flex items-center justify-between border-b border-outline pb-3">
              <div className="flex flex-col">
                <h3 className="font-headline text-base font-bold text-on-surface">Daily GoldBod Price Schedule</h3>
                <span className="font-mono text-xs text-on-surface-variant">FIXED RATE MATRIX</span>
              </div>
              <Link href="/prices" className="font-mono text-xs text-primary hover:underline">
                Edit Margins
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-outline font-mono text-on-surface-variant">
                    <th className="py-2.5 font-medium">Grade</th>
                    <th className="py-2.5 font-medium">Density (g/cm³)</th>
                    <th className="py-2.5 text-right font-medium">Walk-in</th>
                    <th className="py-2.5 text-right font-medium text-primary-dark">Loyal VIP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline/50 font-mono">
                  {schedule.rows.map((row) => (
                    <tr key={row.id} className="transition-colors hover:bg-surface-subtle/70">
                      <td className="py-3 font-semibold text-on-surface">
                        <span className="inline-flex items-center gap-2">
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${row.grade === activeBoard ? "bg-primary" : "bg-outline"}`}
                          />
                          {row.grade}
                        </span>
                      </td>
                      <td className="py-3 text-on-surface-variant">{formatDensityRange(row.densityMin, row.densityMax)}</td>
                      <td className="py-3 text-right text-on-surface">{formatGhc(row.walkin)}</td>
                      <td className="py-3 text-right font-semibold text-primary-dark">{formatGhc(row.vip)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-outline pt-1 font-mono text-[11px] text-on-surface-variant">
              <span>{schedule.note || `Board ${schedule.effectiveDate}`}</span>
              <span>{schedule.pmSync ? `LBMA PM SYNC ${schedule.pmSync}` : schedule.effectiveDate}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 rounded-2xl border border-outline bg-surface p-7 shadow-sm lg:p-9">
        <div className="flex flex-col justify-between gap-4 border-b border-outline pb-4 sm:flex-row sm:items-center">
          <div className="flex flex-col">
            <h3 className="font-headline text-lg font-bold text-on-surface">
              Live Transactions & Hydrostatic Assay Audit Ledger
            </h3>
            <p className="mt-0.5 font-mono text-xs text-on-surface-variant">
              Continuous verification log under London Bullion Clearing Rules
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(["all", "BUY", "SELL"] as const).map((id) => (
              <button
                key={id}
                className={
                  ledgerFilter === id
                    ? "flex items-center gap-1.5 rounded-lg border border-outline bg-surface-subtle px-3 py-1.5 text-xs font-semibold text-on-surface"
                    : "flex items-center gap-1.5 rounded-lg border border-outline px-3 py-1.5 text-xs font-medium text-on-surface-variant transition-colors hover:text-on-surface"
                }
                type="button"
                aria-pressed={ledgerFilter === id}
                onClick={() => setLedgerFilter(id)}
              >
                {id === "all" ? "All" : id}
              </button>
            ))}
            <button
              className="flex items-center gap-1.5 rounded-lg border border-outline bg-surface-subtle px-3.5 py-1.5 text-xs font-medium text-on-surface transition-colors hover:bg-surface-muted"
              type="button"
              onClick={exportCsv}
            >
              <Icon name="download" className="text-[16px]" /> Export CSV
            </button>
          </div>
        </div>
        <div className="-mx-2 overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-xs">
            <thead>
              <tr className="border-b border-outline font-mono tracking-wider text-on-surface-variant uppercase">
                <th className="px-3 py-3 font-medium">Ticket / Time</th>
                <th className="px-3 py-3 font-medium">Counterparty</th>
                <th className="px-3 py-3 text-center font-medium">Type</th>
                <th className="px-3 py-3 text-right font-medium">Air Wt (g)</th>
                <th className="px-3 py-3 text-right font-medium">Water Wt (g)</th>
                <th className="px-3 py-3 font-medium">Density / Karat</th>
                <th className="px-3 py-3 text-right font-medium">Fix Rate</th>
                <th className="px-3 py-3 text-right font-medium">Settlement</th>
                <th className="px-3 py-3 text-center font-medium">Status</th>
                <th className="px-3 py-3 text-right font-medium">Assay Slip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline/60 font-mono">
              {rows.map((row) => (
                <tr key={row.ticket} className="transition-colors hover:bg-surface-subtle/50">
                  <td className="px-3 py-4">
                    <span className="font-semibold text-on-surface">{row.ticket}</span>
                    <span className="block text-[11px] text-on-surface-variant">{row.time}</span>
                  </td>
                  <td className="px-3 py-4">
                    <span className="block font-sans font-medium text-on-surface">{row.name}</span>
                    <span
                      className={`font-mono text-[11px] ${row.vip ? "font-medium text-primary-dark" : "text-on-surface-variant"}`}
                    >
                      {row.tier}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-center">
                    <span
                      className={
                        row.type === "BUY"
                          ? "rounded bg-tertiary-light px-2 py-0.5 text-[11px] font-semibold text-tertiary"
                          : "rounded bg-primary-light px-2 py-0.5 text-[11px] font-semibold text-primary-dark"
                      }
                    >
                      {row.type}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-right font-medium text-on-surface">{row.air}</td>
                  <td className="px-3 py-4 text-right text-on-surface-variant">{row.water}</td>
                  <td className="px-3 py-4">
                    <span className="font-medium text-on-surface">{row.density}</span>
                    <span className="block text-[11px] text-on-surface-variant">{row.karat}</span>
                  </td>
                  <td className="px-3 py-4 text-right text-on-surface-variant">{row.rate}</td>
                  <td className="px-3 py-4 text-right font-bold text-on-surface">{row.settlement}</td>
                  <td className="px-3 py-4 text-center">
                    <span
                      className={`text-[11px] font-medium ${row.status === "Settled" ? "text-tertiary" : "text-on-surface-variant"}`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-right">
                    <button
                      className="inline-flex items-center gap-1 text-on-surface-variant transition-colors hover:text-primary"
                      type="button"
                      onClick={() => loadSlip(row)}
                    >
                      <Icon name="receipt_long" className="text-[16px]" /> Slip
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-outline pt-2 font-mono text-xs text-on-surface-variant">
          <span>
            Showing {rows.length} of {LEDGER.length} trades
            {ledgerFilter !== "all" ? ` · ${ledgerFilter} only` : ""}
          </span>
        </div>
      </div>
    </div>
  );
}
