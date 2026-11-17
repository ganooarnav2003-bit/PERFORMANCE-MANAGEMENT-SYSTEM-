export const PALETTE = ["#5b5bd6", "#10b981", "#f59e0b", "#f43f5e", "#0ea5e9", "#8b5cf6", "#14b8a6", "#64748b"];
export interface Slice { label: string; value: number; color?: string }

/** Pure-SVG pie/donut with a percentage legend. */
export function Pie({ data, center, sub, empty = "No data yet" }: { data: Slice[]; center?: string; sub?: string; empty?: string }) {
  const rows = data.filter((d) => d.value > 0);
  const total = rows.reduce((a, d) => a + d.value, 0);
  const R = 15.9155; // circumference = 100, so dash lengths are percentages
  let acc = 0;
  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="relative h-36 w-36 shrink-0">
        <svg viewBox="0 0 42 42" className="h-full w-full -rotate-90" role="img" aria-label={center ?? "chart"}>
          <circle cx="21" cy="21" r={R} fill="none" stroke="#e2e8f0" strokeWidth="6" />
          {total > 0 && rows.map((d, i) => {
            const pct = (d.value / total) * 100; const el = (
              <circle key={d.label} cx="21" cy="21" r={R} fill="none" stroke={d.color ?? PALETTE[i % PALETTE.length]} strokeWidth="6"
                strokeDasharray={`${Math.max(pct - 0.6, 0)} ${100 - Math.max(pct - 0.6, 0)}`} strokeDashoffset={-acc} />); acc += pct; return el; })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-semibold text-slate-900">{total > 0 ? center ?? "" : "—"}</span>
          {sub && <span className="text-[11px] text-slate-500">{sub}</span>}
        </div>
      </div>
      <ul className="min-w-[10rem] flex-1 space-y-1.5 text-sm">
        {total === 0 && <li className="text-slate-500">{empty}</li>}
        {rows.map((d, i) => (
          <li key={d.label} className="flex items-center gap-2">
            <i className="h-2.5 w-2.5 rounded-sm" style={{ background: d.color ?? PALETTE[i % PALETTE.length] }} />
            <span className="flex-1 truncate text-slate-700">{d.label}</span>
            <b className="tabular-nums text-slate-900">{Math.round((d.value / total) * 100)}%</b>
          </li>))}
      </ul>
    </div>
  );
}
export const pct = (rating: number | null | undefined) => (rating == null ? null : Math.round((rating / 5) * 100));
