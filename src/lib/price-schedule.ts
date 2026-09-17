export const PRICE_SCHEDULE_STORAGE_KEY = "Versitechgh Gold.goldbod.price-schedule.v1";
export const PRICE_SCHEDULE_EVENT = "Versitechgh Gold-goldbod-schedule";

export type PriceScheduleRow = {
  id: string;
  grade: string;
  densityMin: number;
  densityMax: number;
  walkin: number;
  vip: number;
  sell: number;
};

export type PriceSchedule = {
  effectiveDate: string;
  pmSync: string;
  note: string;
  rows: PriceScheduleRow[];
  updatedAt: string;
};

export const DEFAULT_SCHEDULE: PriceSchedule = {
  effectiveDate: "2026-09-15",
  pmSync: "15:00",
  note: "LBMA PM locked board",
  updatedAt: "2026-09-15T08:30:00.000Z",
  rows: [
    { id: "24k", grade: "24K (99.9%)", densityMin: 19.28, densityMax: 19.32, walkin: 73.8, vip: 74.3, sell: 76.8 },
    { id: "22k", grade: "22K (91.6%)", densityMin: 17.5, densityMax: 18.1, walkin: 67.5, vip: 68.1, sell: 70.4 },
    { id: "18k", grade: "18K (75.0%)", densityMin: 15.2, densityMax: 15.8, walkin: 55.1, vip: 55.7, sell: 57.9 },
    { id: "14k", grade: "14K (58.5%)", densityMin: 13.1, densityMax: 13.9, walkin: 42.8, vip: 43.4, sell: 45.6 },
    { id: "scrap", grade: "Scrap / Melt", densityMin: 0, densityMax: 14.8, walkin: 42, vip: 42.6, sell: 44.5 },
  ],
};

export const PRICE_SCHEDULE_CSV_TEMPLATE = [
  "grade,density_min,density_max,walkin,vip,sell",
  "24K (99.9%),19.28,19.32,73.80,74.30,76.80",
  "22K (91.6%),17.50,18.10,67.50,68.10,70.40",
  "18K (75.0%),15.20,15.80,55.10,55.70,57.90",
  "14K (58.5%),13.10,13.90,42.80,43.40,45.60",
  "Scrap / Melt,0,14.80,42.00,42.60,44.50",
].join("\n");

export function createScheduleRow(partial?: Partial<PriceScheduleRow>): PriceScheduleRow {
  return {
    id: newRowId(),
    grade: "",
    densityMin: 0,
    densityMax: 0,
    walkin: 0,
    vip: 0,
    sell: 0,
    ...partial,
  };
}

export function formatDensityRange(min: number, max: number): string {
  if (!Number.isFinite(min) && !Number.isFinite(max)) return "—";
  if (min <= 0) return `< ${formatLoose(max)}`;
  return `${formatLoose(min)} – ${formatLoose(max)}`;
}

export function matchScheduleRow(specificGravity: number, rows: PriceScheduleRow[]): PriceScheduleRow | null {
  if (!Number.isFinite(specificGravity) || specificGravity <= 0 || rows.length === 0) return null;
  const hits = rows.filter((row) => specificGravity >= row.densityMin && specificGravity <= row.densityMax);
  if (hits.length > 0) {
    return [...hits].sort((a, b) => b.densityMin - a.densityMin)[0];
  }
  return [...rows].sort((a, b) => distanceToRange(specificGravity, a) - distanceToRange(specificGravity, b))[0];
}

export function validateSchedule(schedule: PriceSchedule): string[] {
  const errors: string[] = [];
  if (!schedule.effectiveDate) errors.push("Set the board effective date.");
  if (schedule.rows.length === 0) errors.push("Add at least one karat band.");
  schedule.rows.forEach((row, index) => {
    const n = index + 1;
    if (!row.grade.trim()) errors.push(`Row ${n}: grade is required.`);
    if (!Number.isFinite(row.densityMin) || !Number.isFinite(row.densityMax)) {
      errors.push(`Row ${n}: density range must be numeric.`);
    } else if (row.densityMax < row.densityMin) {
      errors.push(`Row ${n}: density max cannot be below density min.`);
    }
    if (!isRate(row.walkin)) errors.push(`Row ${n}: walk-in rate must be 0 or greater.`);
    if (!isRate(row.vip)) errors.push(`Row ${n}: loyal VIP rate must be 0 or greater.`);
    if (!isRate(row.sell)) errors.push(`Row ${n}: sell rate must be 0 or greater.`);
  });
  return errors;
}

export function parsePriceScheduleFile(text: string, filename = ""): PriceSchedule {
  const trimmed = text.replace(/^\uFEFF/, "").trim();
  if (!trimmed) throw new Error("The file is empty.");
  const looksJson = filename.toLowerCase().endsWith(".json") || trimmed.startsWith("{") || trimmed.startsWith("[");
  if (looksJson) return parseScheduleJson(trimmed);
  return parseScheduleCsv(trimmed);
}

export function scheduleToCsv(schedule: PriceSchedule): string {
  const header = "grade,density_min,density_max,walkin,vip,sell";
  const lines = schedule.rows.map((row) =>
    [csvCell(row.grade), row.densityMin, row.densityMax, row.walkin, row.vip, row.sell].join(","),
  );
  return [header, ...lines].join("\n");
}

export function loadStoredSchedule(): PriceSchedule {
  if (typeof window === "undefined") return DEFAULT_SCHEDULE;
  try {
    const raw = window.localStorage.getItem(PRICE_SCHEDULE_STORAGE_KEY);
    if (!raw) return DEFAULT_SCHEDULE;
    return normalizeSchedule(JSON.parse(raw));
  } catch {
    return DEFAULT_SCHEDULE;
  }
}

export function persistSchedule(schedule: PriceSchedule): PriceSchedule {
  const next: PriceSchedule = {
    ...normalizeSchedule(schedule),
    updatedAt: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(PRICE_SCHEDULE_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(PRICE_SCHEDULE_EVENT));
  }
  return next;
}

export function clearStoredSchedule() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PRICE_SCHEDULE_STORAGE_KEY);
  window.dispatchEvent(new Event(PRICE_SCHEDULE_EVENT));
}

function parseScheduleJson(text: string): PriceSchedule {
  const parsed: unknown = JSON.parse(text);
  if (Array.isArray(parsed)) {
    return normalizeSchedule({ ...DEFAULT_SCHEDULE, rows: parsed });
  }
  if (!parsed || typeof parsed !== "object") {
    throw new Error("JSON must be an object with rows, or an array of karat bands.");
  }
  return normalizeSchedule({ ...DEFAULT_SCHEDULE, ...(parsed as Partial<PriceSchedule>) });
}

function parseScheduleCsv(text: string): PriceSchedule {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
  if (lines.length === 0) throw new Error("No rows found in the CSV.");

  const headerCells = splitCsvLine(lines[0]).map(normalizeHeader);
  const hasHeader = headerCells.some((cell) => HEADER_ALIASES[cell]);
  const start = hasHeader ? 1 : 0;
  const column = hasHeader
    ? Object.fromEntries(headerCells.map((cell, index) => [HEADER_ALIASES[cell] ?? cell, index]))
    : { grade: 0, density_min: 1, density_max: 2, walkin: 3, vip: 4, sell: 5 };

  const dataLines = lines.slice(start);
  if (dataLines.length === 0) throw new Error("CSV has a header but no price rows.");

  const rows = dataLines.map((line, index) => {
    const cells = splitCsvLine(line);
    const grade = readCell(cells, column.grade) || readCell(cells, column.karat);
    const density = readCell(cells, column.density);
    const range = parseDensityRange(density);
    const densityMin = parseMoney(readCell(cells, column.density_min)) ?? range?.min ?? 0;
    const densityMax = parseMoney(readCell(cells, column.density_max)) ?? range?.max ?? 0;
    const walkin = parseMoney(readCell(cells, column.walkin) || readCell(cells, column.buy));
    const vip = parseMoney(readCell(cells, column.vip) || readCell(cells, column.loyal));
    const sell = parseMoney(readCell(cells, column.sell) || readCell(cells, column.ask));
    if (!grade) throw new Error(`Row ${index + 1} is missing a grade.`);
    if (walkin === null || vip === null) {
      throw new Error(`Row ${index + 1} needs walk-in and loyal VIP rates.`);
    }
    return createScheduleRow({
      grade,
      densityMin,
      densityMax,
      walkin,
      vip,
      sell: sell ?? vip,
    });
  });

  return normalizeSchedule({ ...DEFAULT_SCHEDULE, rows });
}

function normalizeSchedule(input: Partial<PriceSchedule> & { rows?: unknown }): PriceSchedule {
  const rows = Array.isArray(input.rows) ? input.rows.map(normalizeRow).filter((row): row is PriceScheduleRow => row !== null) : [];
  if (rows.length === 0) {
    throw new Error("No valid karat bands were found.");
  }
  return {
    effectiveDate: typeof input.effectiveDate === "string" && input.effectiveDate ? input.effectiveDate : DEFAULT_SCHEDULE.effectiveDate,
    pmSync: typeof input.pmSync === "string" ? input.pmSync : DEFAULT_SCHEDULE.pmSync,
    note: typeof input.note === "string" ? input.note : DEFAULT_SCHEDULE.note,
    updatedAt: typeof input.updatedAt === "string" && input.updatedAt ? input.updatedAt : DEFAULT_SCHEDULE.updatedAt,
    rows,
  };
}

function normalizeRow(value: unknown): PriceScheduleRow | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const grade = String(row.grade ?? row.karat ?? "").trim();
  if (!grade) return null;
  const range = parseDensityRange(String(row.density ?? row.densityRange ?? ""));
  const densityMin = asNumber(row.densityMin ?? row.density_min) ?? range?.min ?? 0;
  const densityMax = asNumber(row.densityMax ?? row.density_max) ?? range?.max ?? 0;
  const walkin = asNumber(row.walkin ?? row.walkIn ?? row.buy);
  const vip = asNumber(row.vip ?? row.loyal ?? row.loyalVip);
  const sell = asNumber(row.sell ?? row.ask);
  if (walkin === null || vip === null) return null;
  return createScheduleRow({
    id: typeof row.id === "string" && row.id ? row.id : undefined,
    grade,
    densityMin,
    densityMax,
    walkin,
    vip,
    sell: sell ?? vip,
  });
}

function parseDensityRange(value: string): { min: number; max: number } | null {
  const text = value.trim();
  if (!text) return null;
  const below = text.match(/^<\s*([0-9.]+)/);
  if (below) return { min: 0, max: Number(below[1]) };
  const parts = text.split(/\s*[–—-]\s*/);
  if (parts.length === 2) {
    const min = parseMoney(parts[0]);
    const max = parseMoney(parts[1]);
    if (min !== null && max !== null) return { min, max };
  }
  const single = parseMoney(text);
  return single === null ? null : { min: single, max: single };
}

function parseMoney(value: string | undefined): number | null {
  if (value === undefined) return null;
  const cleaned = value.replace(/GHC|GHS|USD|\/g|,/gi, "").replace(/[$]/g, "").trim();
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") return parseMoney(value);
  return null;
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else if (ch === '"') {
        quoted = false;
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === "," || ch === "\t") {
      cells.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current.trim());
  return cells;
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replaceAll('"', '""')}"`;
  return value;
}

function readCell(cells: string[], index: number | undefined): string {
  if (index === undefined || index < 0) return "";
  return cells[index] ?? "";
}

function normalizeHeader(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

const HEADER_ALIASES: Record<string, string> = {
  grade: "grade",
  karat: "karat",
  purity: "grade",
  band: "grade",
  density: "density",
  density_range: "density",
  sg: "density",
  density_min: "density_min",
  min_density: "density_min",
  sg_min: "density_min",
  density_max: "density_max",
  max_density: "density_max",
  sg_max: "density_max",
  walkin: "walkin",
  walk_in: "walkin",
  public: "walkin",
  buy: "buy",
  vip: "vip",
  loyal: "loyal",
  loyal_vip: "vip",
  sell: "sell",
  ask: "ask",
  desk_sell: "sell",
};

function isRate(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

function distanceToRange(value: number, row: PriceScheduleRow): number {
  if (value < row.densityMin) return row.densityMin - value;
  if (value > row.densityMax) return value - row.densityMax;
  return 0;
}

function formatLoose(value: number): string {
  if (!Number.isFinite(value)) return "0";
  const text = value.toFixed(2).replace(/\.?0+$/, "");
  return text.length ? text : "0";
}

function newRowId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `row-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
