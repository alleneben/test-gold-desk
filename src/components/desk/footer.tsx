export function Footer() {
  return (
    <footer className="mt-auto border-t border-outline bg-surface py-6 font-mono text-xs text-on-surface-variant">
      <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-4 px-6 md:flex-row lg:px-10">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <span className="font-semibold text-on-surface">Versitechgh Gold VAULT DEPOSITORY</span>
          <span className="text-outline">•</span>
          <span>Zurich & Mayfair Network</span>
          <span className="text-outline">•</span>
          <span>Archimedes ISO/IEC 17025</span>
        </div>
        <div className="flex items-center gap-4">
          <span>
            Clearing ID: <span className="text-on-surface">AU-9994-LDN</span>
          </span>
          <span className="text-outline">•</span>
          <span>
            Session: <span className="text-on-surface">SEC-8492-OK</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
