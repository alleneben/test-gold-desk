"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AureusMark } from "@/components/desk/logo";
import { Icon } from "@/components/desk/icon";
import { NAV_ITEMS } from "@/lib/nav";

export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-outline bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between gap-8 px-6 lg:px-10">
        <Link href="/" className="flex items-center gap-4" onClick={() => setMenuOpen(false)}>
          <AureusMark className="h-10 w-10 shrink-0" />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-headline text-base font-bold tracking-tight text-on-surface uppercase">
                Aureus Vault
              </span>
              <span className="font-mono text-xs tracking-wider text-on-surface-variant">/ DESK</span>
            </div>
            <span className="text-xs font-normal text-on-surface-variant">
              Physical Bullion & Hydrostatic Assay
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 text-sm font-medium text-on-surface-variant lg:flex">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  active
                    ? "rounded-lg bg-surface-subtle px-3.5 py-2 font-semibold text-on-surface transition-colors"
                    : "rounded-lg px-3.5 py-2 transition-colors hover:text-on-surface"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4 sm:gap-6">
          {/* <div className="hidden items-center gap-3 border-l border-outline pl-4 sm:flex">
            <div className="h-2 w-2 rounded-full bg-tertiary" />
            <div className="flex flex-col text-right">
              <span className="font-mono text-[11px] tracking-wider text-on-surface-variant uppercase">
                Spot AM Fix
              </span>
              <span className="font-mono text-sm font-semibold tracking-tight text-on-surface">
                GHC 2,342.65 <span className="text-xs font-normal text-on-surface-variant">/oz</span>
              </span>
            </div>
          </div> */}
          <div className="flex items-center gap-3 border-l border-outline pl-4">
            <div className="hidden text-right sm:block">
              <div className="text-xs leading-tight font-semibold text-on-surface">User</div>
              <div className="font-mono text-[10px] tracking-widest text-primary-dark uppercase">
                Senior Dealer
              </div>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-outline bg-surface-muted text-xs font-semibold text-on-surface">
              MV
            </div>
          </div>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-outline text-on-surface lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-desk-nav"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <Icon name={menuOpen ? "close" : "menu"} className="text-[20px]" />
          </button>
        </div>
      </div>
      <nav
        id="mobile-desk-nav"
        hidden={!menuOpen}
        className={`border-t border-outline bg-surface px-6 py-3 lg:hidden ${menuOpen ? "" : "hidden"}`}
      >
        <div className="mx-auto flex max-w-[1440px] flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                  active
                    ? "rounded-lg bg-surface-subtle px-3.5 py-2.5 text-sm font-semibold text-on-surface"
                    : "rounded-lg px-3.5 py-2.5 text-sm text-on-surface-variant hover:text-on-surface"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
