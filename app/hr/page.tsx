import { load } from "@/lib/store";
import { requireUser } from "@/lib/auth";
import { closeCycle, createCycle, openCycleAction, saveEmployee } from "@/lib/actions";
import { Pie, pct } from "@/components/charts";
import { Badge, Err, PageHeader, Shell } from "@/components/ui";
export const dynamic = "force-dynamic";

const counts2 = (rs: { status: string }[]) => rs.reduce<Record<string, number>>((a, r) => ((a[r.status] = (a[r.status] ?? 0) + 1), a), {});

export default async function HR({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const me = await requireUser("hr_admin");
  const db = load();
  const name = (id: string | null) => db.employees.find((e) => e.id === id)?.full_name ?? "—";
  const open = db.review_cycles.find((c) => c.status === "open");
  const counts = open ? Object.entries(db.reviews.filter((r) => r.cycle_id === open.id).reduce<Record<string, number>>((a, r) => ((a[r.status] = (a[r.status] ?? 0) + 1), a), {})) : [];
  return (
    <Shell user={me}>
      <PageHeader title="HR admin" sub="Manage cycles and people" />
      <div><Err msg={error} /></div>

      {(() => {
        const revs = db.reviews.filter((r) => r.cycle_id === (open?.id ?? "")); 
        const scored = db.reviews.filter((r) => r.overall_manager_rating != null && ["manager_reviewed", "completed"].includes(r.status));
        const dept = (id: string) => db.employees.find((e) => e.id === id)?.department || "Other";
        const byDept: Record<string, number> = {}; db.employees.filter((e) => e.is_active).forEach((e) => { byDept[e.department || "Other"] = (byDept[e.department || "Other"] ?? 0) + 1; });
        const avg: Record<string, number[]> = {}; scored.forEach((r) => (avg[dept(r.employee_id)] ??= []).push(r.overall_manager_rating!));
        const band = (r: number) => (r >= 4.5 ? "Outstanding (4.5–5)" : r >= 3.5 ? "Exceeds (3.5–4.4)" : r >= 2.5 ? "Meets (2.5–3.4)" : "Needs improvement (<2.5)");
        const bands: Record<string, number> = {}; scored.forEach((r) => (bands[band(r.overall_manager_rating!)] = (bands[band(r.overall_manager_rating!)] ?? 0) + 1));
        const co = scored.length ? pct(scored.reduce((a, r) => a + r.overall_manager_rating!, 0) / scored.length) : null;
        return (
          <section className="mb-6 grid gap-4 md:grid-cols-2">
            <div className="card"><h2 className="section-title mb-4">Review progress</h2><Pie data={Object.entries(counts2(revs)).map(([k, v]) => ({ label: k.replace(/_/g, " "), value: v }))} center={revs.length ? `${Math.round((revs.filter((r) => r.status === "completed").length / revs.length) * 100)}%` : ""} sub="completed" empty="Open a cycle to track progress" /></div>
            <div className="card"><h2 className="section-title mb-4">Company performance</h2><Pie data={Object.entries(bands).map(([label, value]) => ({ label, value }))} center={co != null ? `${co}%` : ""} sub="avg score" empty="Appears once managers submit reviews" /></div>
            <div className="card"><h2 className="section-title mb-4">Employees by department</h2><Pie data={Object.entries(byDept).map(([label, value]) => ({ label, value }))} center={String(db.employees.filter((e) => e.is_active).length)} sub="people" /></div>
            <div className="card"><h2 className="section-title mb-4">Average performance by department</h2>
              <ul className="space-y-3 text-sm">{Object.entries(avg).map(([d, v]) => { const p = pct(v.reduce((a, b) => a + b, 0) / v.length)!; return (
                <li key={d}><div className="mb-1 flex justify-between"><span>{d}</span><b>{p}%</b></div><div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-brand-500" style={{ width: `${p}%` }} /></div></li>); })}
                {!Object.keys(avg).length && <li className="text-slate-500">No reviewed appraisals yet</li>}</ul></div>
          </section>); })()}

      <section className="card">
        <h2 className="section-title">Review cycles</h2>
        <ul className="mt-3 divide-y text-sm">
          {db.review_cycles.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-2 py-2"><span>{c.name} <span className="text-slate-500">{c.start_date} → {c.end_date}</span></span>
              <span className="flex items-center gap-2"><Badge s={c.status} />
                {c.status === "draft" && <form action={openCycleAction}><input type="hidden" name="id" value={c.id} /><button className="btn">Open</button></form>}
                {c.status === "open" && <form action={closeCycle}><input type="hidden" name="id" value={c.id} /><button className="btn-danger">Close</button></form>}</span></li>))}
        </ul>
        {open && <div className="mt-3 flex flex-wrap gap-2 text-xs">{counts.map(([s, n]) => <span key={s} className="rounded bg-slate-100 px-2 py-1">{s.replace(/_/g, " ")}: {n}</span>)}</div>}
        <form action={createCycle} className="mt-4 grid gap-2 sm:grid-cols-4">
          <input name="name" placeholder="e.g. FY2026 Annual" className="input" required />
          <input name="start_date" type="date" className="input" required /><input name="end_date" type="date" className="input" required />
          <button className="btn justify-center">Create draft</button>
        </form>
      </section>

      <section className="card mt-6">
        <h2 className="section-title">Employees</h2>
        <div className="mt-3 overflow-x-auto"><table className="w-full"><thead><tr><th className="th">Name</th><th className="th">Role</th><th className="th">Manager</th><th className="th">Dept</th><th className="th">Active</th></tr></thead>
          <tbody className="divide-y">{db.employees.map((e) => <tr key={e.id}><td className="td">{e.full_name}<div className="text-xs text-slate-500">{e.email}</div></td><td className="td">{e.role.replace("_", " ")}</td><td className="td">{name(e.manager_id)}</td><td className="td">{e.department}</td><td className="td">{e.is_active ? "Yes" : "No"}</td></tr>)}</tbody></table></div>
        <form action={saveEmployee} className="mt-4 grid gap-2 sm:grid-cols-3">
          <h3 className="text-sm font-medium sm:col-span-3">Add employee</h3>
          <input name="full_name" placeholder="Full name" className="input" required /><input name="email" type="email" placeholder="Email" className="input" required />
          <input name="designation" placeholder="Designation" className="input" /><input name="department" placeholder="Department" className="input" />
          <input name="date_of_joining" type="date" className="input" />
          <select name="role" className="input"><option value="employee">Employee</option><option value="manager">Manager</option><option value="hr_admin">HR admin</option></select>
          <select name="manager_id" className="input"><option value="">No manager</option>{db.employees.filter((e) => e.role !== "employee").map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}</select>
          <button className="btn justify-center">Add</button>
        </form>
      </section>

      <section className="card mt-6"><h2 className="section-title">Email log <span className="text-xs font-normal text-slate-500">(demo stand-in for Resend)</span></h2>
        <ul className="mt-2 divide-y text-sm">{db.emails.slice(0, 10).map((m) => <li key={m.id} className="py-2"><b>{m.subject}</b> <span className="text-slate-500">→ {m.to}</span></li>)}
          {!db.emails.length && <li className="py-2 text-slate-500">No emails yet.</li>}</ul></section>
    </Shell>
  );
}
