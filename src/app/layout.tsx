import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Aureus Vault & Trading Desk",
    template: "%s · Aureus Vault",
  },
  description: "Physical bullion trading desk with hydrostatic assay valuation and LBMA board schedules.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${poppins.variable} h-full antialiased`}>
      <body
        className={`${poppins.className} flex min-h-full flex-col bg-background font-sans text-on-surface selection:bg-primary/20`}
      >
        {children}
      </body>
    </html>
  );
}
