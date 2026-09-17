"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/desk/icon";
import { filterVipAccounts, type VipAccount } from "@/lib/counterparties";

export function VipNameField({
  value,
  onSelect,
}: {
  value: VipAccount | null;
  onSelect: (account: VipAccount) => void;
}) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const matches = useMemo(() => filterVipAccounts(query), [query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActiveIndex(0);
    const frame = window.requestAnimationFrame(() => searchRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    function handlePointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handlePointer);
    return () => document.removeEventListener("mousedown", handlePointer);
  }, []);

  function choose(account: VipAccount) {
    onSelect(account);
    setQuery("");
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative z-20">
      <button
        id="client-name"
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        className="flex w-full items-center rounded-lg border border-outline bg-surface-subtle py-2 pr-9 pl-3.5 text-left text-sm transition-colors hover:bg-surface focus:border-primary focus:bg-surface focus:outline-none"
        onClick={() => setOpen((current) => !current)}
      >
        {value ? (
          <span className="truncate text-on-surface">{value.name}</span>
        ) : (
          <span className="truncate text-on-surface-variant">Select loyal VIP account</span>
        )}
      </button>
      <Icon
        name="expand"
        className="pointer-events-none absolute top-2.5 right-3 text-[16px] text-on-surface-variant"
      />
      {open ? (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-outline bg-surface shadow-lg">
          <div className="border-b border-outline p-2">
            <div className="relative">
              <Icon
                name="search"
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[16px] text-on-surface-variant"
              />
              <input
                ref={searchRef}
                id="vip-search"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={open}
                aria-controls={listId}
                aria-activedescendant={matches[activeIndex] ? `${listId}-${activeIndex}` : undefined}
                className="w-full rounded-lg border border-outline bg-surface-subtle py-2 pr-3 pl-9 text-sm text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:bg-surface focus:outline-none"
                type="search"
                placeholder="Type to search VIP accounts"
                value={query}
                autoComplete="off"
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    setActiveIndex((index) => Math.min(matches.length - 1, index + 1));
                  } else if (event.key === "ArrowUp") {
                    event.preventDefault();
                    setActiveIndex((index) => Math.max(0, index - 1));
                  } else if (event.key === "Enter" && matches[activeIndex]) {
                    event.preventDefault();
                    choose(matches[activeIndex]);
                  } else if (event.key === "Escape") {
                    setOpen(false);
                  }
                }}
              />
            </div>
          </div>
          <ul id={listId} role="listbox" className="max-h-56 overflow-auto py-1">
            {matches.length === 0 ? (
              <li className="px-3.5 py-2.5 text-sm text-on-surface-variant">No matching VIP accounts</li>
            ) : (
              matches.map((account, index) => (
                <li key={account.account} role="none">
                  <button
                    id={`${listId}-${index}`}
                    type="button"
                    role="option"
                    aria-selected={value?.account === account.account}
                    className={`flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left ${
                      index === activeIndex ? "bg-primary-light/50" : "hover:bg-surface-subtle"
                    }`}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => choose(account)}
                  >
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium text-on-surface">{account.name}</span>
                      <span className="font-mono text-[11px] text-on-surface-variant">
                        {account.phone} · {account.tier}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-xs font-semibold text-primary-dark">{account.account}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
