import type { Metadata } from "next";
import { PriceScheduleScreen } from "@/components/screens/price-schedule";

export const metadata: Metadata = { title: "Price Schedules" };

export default function PricesPage() {
  return <PriceScheduleScreen />;
}
