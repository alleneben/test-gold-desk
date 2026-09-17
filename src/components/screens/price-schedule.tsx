"use client";

import { useEffect, useState, type ChangeEvent, type DragEvent, type ReactNode } from "react";
import { Icon } from "@/components/desk/icon";
import { usePriceSchedule } from "@/components/desk/price-schedule-provider";
import { formatGhc } from "@/lib/assay";
import {
  PRICE_SCHEDULE_CSV_TEMPLATE,
  createScheduleRow,
  parsePriceScheduleFile,
  scheduleToCsv,
  validateSchedule,
  type PriceSchedule,
  type PriceScheduleRow,
} from "@/lib/price-schedule";

const fieldClass =
  "w-full rounded-lg border border-outline bg-surface-subtle px-3 py-2 text-sm text-on-surface transition-colors focus:border-primary focus:bg-surface focus:outline-none";

export function PriceScheduleScreen() {
  const { schedule, publish, restoreDefault } = usePriceSchedule();
  const [draft, setDraft] = useState<PriceSchedule>(schedule);
  const [errors, setErrors] = useState<string[]>([]);
  const [status, setStatus] = useState("");
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    setDraft(cloneSchedule(schedule));
  }, [schedule]);

  const fine = draft.rows.find((row) => row.grade.startsWith("24K")) ?? draft.rows[0];

  function updateDraft(patch: Partial<PriceSchedule>) {
    setStatus("");
    setErrors([]);
    setDraft((current) => ({ ...current, ...patch }));
  }

  function updateRow(id: string, patch: Partial<PriceScheduleRow>) {
    setStatus("");
    setErrors([]);
    setDraft((current) => ({
      ...current,
      rows: current.rows.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    }));
  }

  function addRow() {
    setStatus("");
    setErrors([]);
    setDraft((current) => ({
      ...current,
      rows: [...current.rows, createScheduleRow()],
    }));
  }

  function removeRow(id: string) {
    setStatus("");
    setErrors([]);
    setDraft((current) => ({
      ...current,
      rows: current.rows.filter((row) => row.id !== id),
    }));
  }

  function saveDraft(next: PriceSchedule, message: string) {
    const issues = validateSchedule(next);
    if (issues.length > 0) {
      setErrors(issues);
      setStatus("");
      return false;
    }
    publish(next);
    setErrors([]);
    setStatus(message);
    return true;
  }

  function handlePublish() {
    saveDraft(draft, "GoldBod board published to the trading desk.");
  }

  function handleRestore() {
    const restored = restoreDefault();
    setDraft(cloneSchedule(restored));
    setErrors([]);
    setStatus("Default GoldBod matrix restored.");
  }

  async function handleFile(file: File) {
    try {
      const text = await file.text();
      const parsed = parsePriceScheduleFile(text, file.name);
      const next: PriceSchedule = {
        ...draft,
        ...parsed,
        effectiveDate: parsed.effectiveDate || draft.effectiveDate,
        pmSync: parsed.pmSync || draft.pmSync,
        note: parsed.note || draft.note,
      };
      setDraft(next);
      saveDraft(next, `Uploaded ${file.name} and published ${next.rows.length} karat bands.`);
    } catch (error) {
      setStatus("");
      setErrors([error instanceof Error ? error.message : "Could not read that price file."]);
    }
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void handleFile(file);
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) void handleFile(file);
  }

  function downloadTemplate() {
    downloadText("goldbod-price-schedule-template.csv", PRICE_SCHEDULE_CSV_TEMPLATE);
  }

  function downloadCurrent() {
    downloadText(`goldbod-price-schedule-${draft.effectiveDate || "board"}.csv`, scheduleToCsv(draft));
  }

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-8 px-6 py-8 lg:px-10">
      <div className="rounded-2xl border border-outline bg-surface p-7 shadow-sm lg:p-9">
        <span className="font-mono text-xs tracking-wider text-primary-dark uppercase">Fixed Rate Matrix</span>
        <h1 className="font-headline mt-1 text-2xl font-bold tracking-tight text-on-surface">
          Daily GoldBod Price Schedules
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-on-surface-variant">
          Enter the locked board by karat, or upload a CSV / JSON file. Published rates feed the trading desk walk-in,
          loyal VIP, and sell valuations.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Metric
          label="24K Walk-in / VIP"
          value={fine ? `${formatGhc(fine.walkin)} / ${formatGhc(fine.vip)}` : "—"}
          hint="Per gram buy rates"
        />
        <Metric label="Effective Date" value={formatDateLabel(draft.effectiveDate)} hint={draft.note || "Board date"} />
        <Metric
          label="PM Sync"
          value={draft.pmSync || "—"}
          hint={schedule.updatedAt ? `Last published ${formatStamp(schedule.updatedAt)}` : "Not published yet"}
        />
      </div>

      {status ? (
        <p className="rounded-xl border border-tertiary/30 bg-tertiary-light px-4 py-3 text-sm text-tertiary">{status}</p>
      ) : null}
      {errors.length > 0 ? (
        <ul className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : null}

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        <form
          className="flex flex-col gap-6 rounded-2xl border border-outline bg-surface p-6 shadow-sm xl:col-span-8 lg:p-8"
          onSubmit={(event) => {
            event.preventDefault();
            handlePublish();
          }}
        >
          <div className="flex flex-col gap-1 border-b border-outline pb-4">
            <h2 className="font-headline text-base font-bold text-on-surface">Enter board rates</h2>
            <p className="text-sm text-on-surface-variant">All prices are GHC per gram for the hydrostatic assay bands.</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Effective date" htmlFor="board-date">
              <input
                id="board-date"
                className={fieldClass}
                type="date"
                value={draft.effectiveDate}
                onChange={(event) => updateDraft({ effectiveDate: event.target.value })}
              />
            </Field>
            <Field label="PM sync" htmlFor="board-sync">
              <input
                id="board-sync"
                className={fieldClass}
                type="time"
                value={draft.pmSync}
                onChange={(event) => updateDraft({ pmSync: event.target.value })}
              />
            </Field>
            <Field label="Board note" htmlFor="board-note">
              <input
                id="board-note"
                className={fieldClass}
                type="text"
                placeholder="LBMA PM locked board"
                value={draft.note}
                onChange={(event) => updateDraft({ note: event.target.value })}
              />
            </Field>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead>
                <tr className="border-b border-outline font-mono text-on-surface-variant">
                  <th className="py-2.5 pr-2 font-medium">Grade</th>
                  <th className="py-2.5 pr-2 font-medium">Density min</th>
                  <th className="py-2.5 pr-2 font-medium">Density max</th>
                  <th className="py-2.5 pr-2 font-medium">Walk-in</th>
                  <th className="py-2.5 pr-2 font-medium text-primary-dark">Loyal VIP</th>
                  <th className="py-2.5 pr-2 font-medium">Sell</th>
                  <th className="py-2.5 w-10 font-medium">
                    <span className="sr-only">Remove</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline/50">
                {draft.rows.map((row) => (
                  <tr key={row.id}>
                    <td className="py-2 pr-2">
                      <input
                        className={fieldClass}
                        type="text"
                        placeholder="24K (99.9%)"
                        aria-label="Grade"
                        value={row.grade}
                        onChange={(event) => updateRow(row.id, { grade: event.target.value })}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <RateInput
                        ariaLabel="Density min"
                        value={row.densityMin}
                        onChange={(value) => updateRow(row.id, { densityMin: value })}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <RateInput
                        ariaLabel="Density max"
                        value={row.densityMax}
                        onChange={(value) => updateRow(row.id, { densityMax: value })}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <RateInput
                        ariaLabel="Walk-in GHC per gram"
                        value={row.walkin}
                        onChange={(value) => updateRow(row.id, { walkin: value })}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <RateInput
                        ariaLabel="Loyal VIP GHC per gram"
                        value={row.vip}
                        onChange={(value) => updateRow(row.id, { vip: value })}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <RateInput
                        ariaLabel="Sell GHC per gram"
                        value={row.sell}
                        onChange={(value) => updateRow(row.id, { sell: value })}
                      />
                    </td>
                    <td className="py-2">
                      <button
                        type="button"
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-outline text-on-surface-variant hover:text-on-surface"
                        aria-label={`Remove ${row.grade || "row"}`}
                        onClick={() => removeRow(row.id)}
                        disabled={draft.rows.length <= 1}
                      >
                        <Icon name="delete" className="text-[16px]" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-outline px-3.5 py-2 text-sm font-medium text-on-surface-variant hover:text-on-surface"
              onClick={addRow}
            >
              <Icon name="add" className="text-[16px]" />
              Add karat band
            </button>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                className="rounded-lg border border-outline px-4 py-2.5 text-sm font-medium text-on-surface-variant hover:text-on-surface"
                onClick={handleRestore}
              >
                Restore default
              </button>
              <button
                type="submit"
                className="rounded-lg bg-primary-dark px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark/90"
              >
                Publish board
              </button>
            </div>
          </div>
        </form>

        <aside className="flex flex-col gap-5 rounded-2xl border border-outline bg-surface p-6 shadow-sm xl:col-span-4 lg:p-8">
          <div className="flex flex-col gap-1 border-b border-outline pb-4">
            <h2 className="font-headline text-base font-bold text-on-surface">Upload schedule</h2>
            <p className="text-sm text-on-surface-variant">CSV or JSON. Upload replaces the current karat bands and publishes immediately.</p>
          </div>

          <input
            id="goldbod-file"
            className="sr-only"
            type="file"
            accept=".csv,.json,text/csv,application/json"
            onChange={onFileChange}
          />

          <label
            htmlFor="goldbod-file"
            className={`flex cursor-pointer flex-col items-center gap-3 rounded-2xl border border-dashed px-4 py-10 text-center transition-colors ${
              dragging ? "border-primary bg-primary-light/60" : "border-outline bg-surface-subtle hover:border-primary/60"
            }`}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-light text-primary-dark">
              <Icon name="upload" className="text-[20px]" />
            </span>
            <span className="text-sm font-medium text-on-surface">Drop a GoldBod file here</span>
            <span className="font-mono text-xs text-on-surface-variant">CSV · JSON</span>
            <span className="mt-1 rounded-lg border border-outline bg-surface px-3.5 py-2 text-sm font-medium text-on-surface">
              Choose file
            </span>
          </label>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-outline px-3.5 py-2 text-sm font-medium text-on-surface-variant hover:text-on-surface"
              onClick={downloadTemplate}
            >
              <Icon name="download" className="text-[16px]" />
              Download CSV template
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-outline px-3.5 py-2 text-sm font-medium text-on-surface-variant hover:text-on-surface"
              onClick={downloadCurrent}
            >
              <Icon name="download" className="text-[16px]" />
              Export current draft
            </button>
          </div>

          <p className="font-mono text-[11px] leading-5 text-on-surface-variant">
            Columns: grade, density_min, density_max, walkin, vip, sell. Density may also be a range such as 19.28 – 19.32.
            JSON may be an array of bands or an object with rows plus effectiveDate.
          </p>
        </aside>
      </div>
    </div>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-outline bg-surface p-6 shadow-sm">
      <span className="font-mono text-[11px] tracking-wider text-on-surface-variant uppercase">{label}</span>
      <p className="font-mono mt-2 text-2xl font-semibold tracking-tight text-on-surface">{value}</p>
      <p className="mt-1 text-xs text-on-surface-variant">{hint}</p>
    </div>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-xs font-medium text-on-surface-variant">
        {label}
      </label>
      {children}
    </div>
  );
}

function RateInput({
  value,
  onChange,
  ariaLabel,
}: {
  value: number;
  onChange: (value: number) => void;
  ariaLabel: string;
}) {
  return (
    <input
      className={`${fieldClass} font-mono`}
      type="number"
      inputMode="decimal"
      step="0.01"
      min="0"
      aria-label={ariaLabel}
      value={Number.isFinite(value) ? value : 0}
      onChange={(event) => onChange(event.target.value === "" ? 0 : Number(event.target.value))}
    />
  );
}

function cloneSchedule(schedule: PriceSchedule): PriceSchedule {
  return {
    ...schedule,
    rows: schedule.rows.map((row) => ({ ...row })),
  };
}

function downloadText(filename: string, contents: string) {
  const blob = new Blob([contents], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDateLabel(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value || "—";
  return `${Number(match[3])} ${MONTHS[Number(match[2]) - 1]} ${match[1]}`;
}

function formatStamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hour = String(date.getUTCHours()).padStart(2, "0");
  const minute = String(date.getUTCMinutes()).padStart(2, "0");
  return `${day} ${MONTHS[date.getUTCMonth()]} ${hour}:${minute} UTC`;
}
