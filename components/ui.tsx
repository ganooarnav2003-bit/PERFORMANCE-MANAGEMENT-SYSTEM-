import Link from "next/link";
import { signOut } from "@/lib/actions";
import type { Employee } from "@/lib/types";

const tones: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700", not_started: "bg-slate-100 text-slate-700", open: "bg-emerald-100 text-emerald-800",
  submitted: "bg-amber-100 text-amber-800", self_submitted: "bg-amber-100 text-amber-800", approved: "bg-emerald-100 text-emerald-800",
  sent_back: "bg-rose-100 text-rose-800", manager_reviewed: "bg-sky-100 text-sky-800", completed: "bg-emerald-100 text-emerald-800", closed: "bg-slate-200 text-slate-600",
};
export const Badge = ({ s }: { s: string }) => (
  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[s] ?? tones.draft}`}>{s.replace(/_/g, " ")}</span>
);
export const Err = ({ msg }: { msg?: string }) => msg ? <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-800">{msg}</div> : null;

export function Shell({ user, children }: { user: Employee; children: React.ReactNode }) {
  const links = [["/", "Dashboard"], ["/goals", "My goals"], ...(user.role !== "employee" ? [["/team", "My team"]] : []), ...(user.role === "hr_admin" ? [["/hr", "HR admin"]] : [])];
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <span className="font-semibold text-indigo-700">PMS</span>
          <nav className="flex flex-1 gap-4 text-sm">{links.map(([h, l]) => <Link key={h} href={h} className="text-slate-600 hover:text-slate-900">{l}</Link>)}</nav>
          <span className="text-sm text-slate-500">{user.full_name} · {user.role.replace("_", " ")}</span>
          <form action={signOut}><button className="btn-ghost">Sign out</button></form>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
