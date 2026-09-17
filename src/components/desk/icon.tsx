type IconName =
  | "menu"
  | "close"
  | "verified"
  | "check"
  | "science"
  | "download"
  | "upload"
  | "add"
  | "delete"
  | "receipt_long"
  | "search"
  | "expand";

const PATHS: Record<IconName, string> = {
  menu: "M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5",
  close: "M6 6l12 12M18 6L6 18",
  search: "M10.5 6.75a3.75 3.75 0 1 1 0 7.5 3.75 3.75 0 0 1 0-7.5zM16.5 16.5l-2.6-2.6",
  expand: "M6.75 9.75L12 15l5.25-5.25",
  check: "M5 12.5l4.5 4.5L19 7.5",
  download: "M12 4.5v10.25M7.75 10.5L12 14.75l4.25-4.25M5 19.25h14",
  upload: "M12 14.75V4.5M7.75 8.75L12 4.5l4.25 4.25M5 14.75v4.5h14v-4.5",
  add: "M12 5v14M5 12h14",
  delete: "M6.75 7.5h10.5M9.5 7.5V6.2h5V7.5M8.4 7.5l.7 10.3h5.8l.7-10.3",
  receipt_long:
    "M6.75 3.75h10.5v16.5l-1.75-1-1.75 1-1.75-1-1.75 1-1.75-1-1.75 1V3.75zM9 8.25h6M9 12h6M9 15.75h3.75",
  science:
    "M9.5 4.75h5M10.25 4.75v4.1L6.4 16.2A2.6 2.6 0 0 0 8.62 20h6.76a2.6 2.6 0 0 0 2.22-3.8l-3.85-7.35V4.75M9.9 13.25h4.2",
  verified:
    "M12 3.4l2.12 1.02 2.36-.28.9 2.2 2.2.9-.28 2.36L21.04 12l-1.02 2.12.28 2.36-2.2.9-.9 2.2-2.36-.28L12 20.6l-2.12-1.02-2.36.28-.9-2.2-2.2-.9.28-2.36L2.96 12l1.02-2.12-.28-2.36 2.2-.9.9-2.2 2.36.28L12 3.4z",
};

const FILL_PATHS: Partial<Record<IconName, string>> = {
  verified: "M10.2 15.35l-2.7-2.7 1.05-1.05 1.65 1.65 4.35-4.4 1.05 1.05-5.4 5.45z",
};

export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={`inline-block h-[1em] w-[1em] shrink-0 align-middle ${className ?? ""}`}
    >
      <path
        d={PATHS[name]}
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {FILL_PATHS[name] ? <path d={FILL_PATHS[name]} fill="currentColor" /> : null}
    </svg>
  );
}
