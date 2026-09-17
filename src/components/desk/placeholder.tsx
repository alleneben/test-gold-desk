export function PlaceholderPage({
  kicker,
  title,
  description,
  metrics,
}: {
  kicker: string;
  title: string;
  description: string;
  metrics: { label: string; value: string; hint: string }[];
}) {
  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-8 px-6 py-8 lg:px-10">
      <div className="rounded-2xl border border-outline bg-surface p-7 shadow-sm lg:p-9">
        <span className="font-mono text-xs tracking-wider text-primary-dark uppercase">{kicker}</span>
        <h1 className="font-headline mt-1 text-2xl font-bold tracking-tight text-on-surface">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-on-surface-variant">{description}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-2xl border border-outline bg-surface p-6 shadow-sm">
            <span className="font-mono text-[11px] tracking-wider text-on-surface-variant uppercase">
              {metric.label}
            </span>
            <p className="font-mono mt-2 text-2xl font-semibold tracking-tight text-on-surface">{metric.value}</p>
            <p className="mt-1 text-xs text-on-surface-variant">{metric.hint}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
