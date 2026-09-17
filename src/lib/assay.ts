import { DEFAULT_SCHEDULE, matchScheduleRow, type PriceScheduleRow } from "@/lib/price-schedule";

export const GRAMS_PER_TROY_OZ = 31.1034768;
export const VIP_SUBSIDY_PER_GRAM = 0.5;

function groupThousands(intPart: string): string {
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function formatNum(value: number, digits = 2): string {
  if (!Number.isFinite(value)) {
    return digits > 0 ? `0.${"0".repeat(digits)}` : "0";
  }
  const sign = value < 0 ? "-" : "";
  const [intPart, fracPart] = Math.abs(value).toFixed(digits).split(".");
  const grouped = groupThousands(intPart);
  return fracPart === undefined ? `${sign}${grouped}` : `${sign}${grouped}.${fracPart}`;
}

export function formatGhc(value: number): string {
  return `${value < 0 ? "-" : ""}GHC ${formatNum(Math.abs(value), 2)}`;
}

export type TradeDirection = "BUY" | "SELL";

export type ClientRateTier = "walkin" | "loyal";

export type AssayBand = {
  label: string;
  buy: number;
  sell: number;
  vip: number;
};

export function classifyAssay(
  specificGravity: number,
  rows: PriceScheduleRow[] = DEFAULT_SCHEDULE.rows,
): AssayBand {
  const row = matchScheduleRow(specificGravity, rows);
  if (!row) return { label: "Assay Required", buy: 0, sell: 0, vip: 0 };
  return { label: row.grade, buy: row.walkin, sell: row.sell, vip: row.vip };
}

export function hydrostaticValuation(
  wAir: number,
  wWater: number,
  direction: TradeDirection,
  options?: { rows?: PriceScheduleRow[]; clientType?: ClientRateTier },
) {
  const rows = options?.rows ?? DEFAULT_SCHEDULE.rows;
  const clientType = options?.clientType ?? "walkin";
  const valid = wAir > 0 && wWater >= 0 && wAir > wWater;
  const displacedVolume = valid ? wAir - wWater : 0;
  const specificGravity = valid ? wAir / displacedVolume : 0;
  const density = wAir > 0 ? wWater / wAir : 0;
  const row = valid ? matchScheduleRow(specificGravity, rows) : null;
  const band = row
    ? { label: row.grade, buy: row.walkin, sell: row.sell, vip: row.vip }
    : { label: "Assay Required", buy: 0, sell: 0, vip: 0 };
  const ratePerGram =
    !row ? 0 : direction === "SELL" ? band.sell : clientType === "loyal" ? band.vip : band.buy;
  return {
    displacedVolume,
    specificGravity,
    density,
    karatLabel: band.label,
    matchedGrade: row?.grade ?? null,
    ratePerGram,
    valid,
  };
}

export function boardKeyForKarat(karatLabel: string): string | null {
  if (karatLabel.startsWith("24K") || karatLabel.startsWith("24 ")) return "24K (99.9%)";
  if (karatLabel.startsWith("22K")) return "22K (91.6%)";
  if (karatLabel.startsWith("18K")) return "18K (75.0%)";
  if (karatLabel.startsWith("14K")) return "14K (58.5%)";
  if (karatLabel.startsWith("Low Carat") || karatLabel.startsWith("Scrap")) return "Scrap / Melt";
  return karatLabel || null;
}
