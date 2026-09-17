"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  DEFAULT_SCHEDULE,
  PRICE_SCHEDULE_EVENT,
  PRICE_SCHEDULE_STORAGE_KEY,
  clearStoredSchedule,
  loadStoredSchedule,
  persistSchedule,
  type PriceSchedule,
} from "@/lib/price-schedule";

type PriceScheduleContextValue = {
  schedule: PriceSchedule;
  publish: (next: PriceSchedule) => PriceSchedule;
  restoreDefault: () => PriceSchedule;
};

const PriceScheduleContext = createContext<PriceScheduleContextValue | null>(null);

export function PriceScheduleProvider({ children }: { children: ReactNode }) {
  const [schedule, setSchedule] = useState<PriceSchedule>(DEFAULT_SCHEDULE);

  useEffect(() => {
    setSchedule(loadStoredSchedule());
    const sync = () => setSchedule(loadStoredSchedule());
    const onStorage = (event: StorageEvent) => {
      if (event.key === PRICE_SCHEDULE_STORAGE_KEY) sync();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(PRICE_SCHEDULE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(PRICE_SCHEDULE_EVENT, sync);
    };
  }, []);

  const publish = useCallback((next: PriceSchedule) => {
    const saved = persistSchedule(next);
    setSchedule(saved);
    return saved;
  }, []);

  const restoreDefault = useCallback(() => {
    clearStoredSchedule();
    setSchedule(DEFAULT_SCHEDULE);
    return DEFAULT_SCHEDULE;
  }, []);

  const value = useMemo(
    () => ({ schedule, publish, restoreDefault }),
    [schedule, publish, restoreDefault],
  );

  return <PriceScheduleContext.Provider value={value}>{children}</PriceScheduleContext.Provider>;
}

export function usePriceSchedule() {
  const context = useContext(PriceScheduleContext);
  if (!context) {
    throw new Error("usePriceSchedule must be used within PriceScheduleProvider");
  }
  return context;
}
