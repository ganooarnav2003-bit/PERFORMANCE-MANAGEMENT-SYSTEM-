import Link from "next/link";
import { signOut } from "@/lib/actions";
import type { Employee, ReviewStatus } from "@/lib/types";

const tones: Record<string, [string, string]> = {
  draft: ["bg-slate-100 text-slate-700", "bg-slate-400"], not_started: ["bg-slate-100 text-slate-700", "bg-slate-400"],
  open: ["bg-emerald-50 text-emerald-700", "bg-emerald-500"], submitted: ["bg-amber-50 text-amber-700", "bg-amber-500"],
  self_submitted: ["bg-amber-50 text-amber-700", "bg-amber-500"], approved: ["bg-emerald-50 text-emerald-700", "bg-emerald-500"],
  sent_back: ["bg-rose-50 text-rose-700", "bg-rose-500"], manager_reviewed: ["bg-sky-50 text-sky-700", "bg-sky-500"],
  completed: ["bg-emerald-50 text-emerald-700", "bg-emerald-500"], closed: ["bg-slate-200 text-slate-600", "bg-slate-500"],
};
export const Badge = ({ s }: { s: string }) => {
  const [c, d] = tones[s] ?? tones.draft;
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${c}`}><i className={`h-1.5 w-1.5 rounded-full ${d}`} />{s.replace(/_/g, " ")}</span>;
};
export const Err = ({ msg }: { msg?: string }) => msg ? <div role="alert" className="mb-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"><b>!</b>{msg}</div> : null;

const hues = ["bg-indigo-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500", "bg-sky-500", "bg-violet-500"];
export const Avatar = ({ name, size = 36 }: { name: string; size?: number }) => (
  <span style={{ width: size, height: size, fontSize: size * 0.38 }} className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${hues[name.length % hues.length]}`}>
    {name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
  </span>
);
export const PageHeader = ({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
    <div><h1 className="text-2xl font-semibold text-slate-900">{title}</h1>{sub && <p className="mt-1 text-sm text-slate-500">{sub}</p>}</div>{children}
  </div>
);
export const Stat = ({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) => (
  <div className="card"><div className="label !mb-2">{label}</div><div className="text-3xl font-semibold text-slate-900">{value}</div>{hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}</div>
);

const STEPS: [ReviewStatus, string][] = [["not_started", "Goals & self"], ["self_submitted", "Manager review"], ["manager_reviewed", "Acknowledge"], ["completed", "Done"]];
export function Stepper({ status }: { status: ReviewStatus }) {
  const cur = STEPS.findIndex(([s]) => s === status);
  return (
    <ol className="flex items-center gap-2">
      {STEPS.map(([, l], i) => (
        <li key={l} className="flex flex-1 items-center gap-2">
          <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${i < cur || status === "completed" ? "bg-emerald-500 text-white" : i === cur ? "bg-brand-600 text-white ring-4 ring-brand-100" : "bg-slate-200 text-slate-500"}`}>{i < cur || status === "completed" ? "✓" : i + 1}</span>
          <span className={`hidden text-xs sm:inline ${i === cur ? "font-semibold text-slate-900" : "text-slate-500"}`}>{l}</span>
          {i < STEPS.length - 1 && <span className={`h-px flex-1 ${i < cur ? "bg-emerald-400" : "bg-slate-200"}`} />}
        </li>))}
    </ol>
  );
}

const I = (d: string) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>;
const icons: Record<string, string> = {
  "/": "M3 12l9-9 9 9M5 10v10h14V10", "/goals": "M12 3a9 9 0 100 18 9 9 0 000-18zm0 5a4 4 0 100 8 4 4 0 000-8zm0 3a1 1 0 100 2 1 1 0 000-2z",
  "/team": "M17 20v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M10 10a4 4 0 100-8 4 4 0 000 8zM21 20v-2a4 4 0 00-3-3.9M16 2.1a4 4 0 010 7.8",
  "/hr": "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z",
};
export function Shell({ user, children }: { user: Employee; children: React.ReactNode }) {
  const links = [["/", "Dashboard"], ["/goals", "My goals"], ...(user.role !== "employee" ? [["/team", "My team"]] : []), ...(user.role === "hr_admin" ? [["/hr", "HR admin"]] : [])];
  return (
    <div className="min-h-screen md:flex">
      <aside className="bg-navy text-slate-300 md:sticky md:top-0 md:flex md:h-screen md:w-64 md:shrink-0 md:flex-col">
        <div className="flex items-center gap-3 px-5 py-4 md:py-6">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 font-bold text-white">P</span>
          <div><div className="text-sm font-semibold text-white">PMS</div><div className="text-[11px] text-slate-400">Performance Management</div></div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-1 md:flex-col md:pb-0">
          {links.map(([h, l]) => <Link key={h} href={h} className="flex items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white">{I(icons[h])}{l}</Link>)}
        </nav>
        <div className="hidden border-t border-white/10 p-4 md:block">
          <div className="flex items-center gap-3"><Avatar name={user.full_name} /><div className="min-w-0"><div className="truncate text-sm font-medium text-white">{user.full_name}</div><div className="truncate text-xs capitalize text-slate-400">{user.role.replace("_", " ")}</div></div></div>
          <form action={signOut} className="mt-3"><button className="w-full rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-200 transition hover:bg-white/10 cursor-pointer">Sign out</button></form>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 md:px-10 md:py-8"><div className="mx-auto max-w-5xl">
        <div className="mb-4 flex items-center justify-between md:hidden"><span className="text-sm text-slate-600">{user.full_name}</span><form action={signOut}><button className="btn-ghost">Sign out</button></form></div>
        {children}
      </div></main>
    </div>
  );
}
