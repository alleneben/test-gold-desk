import type { ReactNode } from "react";
import { Footer } from "@/components/desk/footer";
import { Header } from "@/components/desk/header";
import { PriceScheduleProvider } from "@/components/desk/price-schedule-provider";

export default function DeskLayout({ children }: { children: ReactNode }) {
  return (
    <PriceScheduleProvider>
      <div className="flex min-h-full flex-col">
        <Header />
        <main className="flex flex-1 flex-col">{children}</main>
        <Footer />
      </div>
    </PriceScheduleProvider>
  );
}
