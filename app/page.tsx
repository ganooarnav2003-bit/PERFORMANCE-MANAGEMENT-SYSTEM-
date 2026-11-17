import Link from "next/link";
import { load } from "@/lib/store";
import { requireUser } from "@/lib/auth";
import { Avatar, Badge, PageHeader, Shell, Stat, Stepper } from "@/components/ui";
export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const me = await requireUser();
  const db = load();
  const cycle = db.review_cycles.find((c) => c.status === "open");
  const myReview = cycle && db.reviews.find((r) => r.cycle_id === cycle.id && r.employee_id === me.id);
  const myGoals = cycle ? db.goals.filter((g) => g.cycle_id === cycle.id && g.employee_id === me.id) : [];
  const team = cycle ? db.reviews.filter((r) => r.cycle_id === cycle.id && r.manager_id === me.id) : [];
  const pending = cycle ? db.goals.filter((g) => g.cycle_id === cycle.id && g.status === "submitted" && db.employees.find((e) => e.id === g.employee_id)?.manager_id === me.id).length : 0;
  const nm = (id: string) => db.employees.find((e) => e.id === id)?.full_name ?? "";
  return (
    <Shell user={me}>
      <PageHeader title={`Welcome back, ${me.full_name.split(" ")[0]}`} sub={cycle ? `${cycle.name} · ${cycle.start_date} → ${cycle.end_date}` : "No appraisal cycle is open right now."} />
      {cycle && myReview && (<>
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Goals" value={myGoals.length} hint={`${myGoals.filter((g) => g.status === "approved").length} approved`} />
          <Stat label="Self rating" value={myReview.overall_self_rating ?? "—"} hint="out of 5" />
          <Stat label="Status" value={<Badge s={myReview.status} />} />
        </div>
        <div className="card mt-4"><div className="mb-4 flex items-center justify-between"><h2 className="section-title">My appraisal progress</h2>
          <div className="flex gap-2"><Link className="btn-ghost" href="/goals">Goals</Link><Link className="btn" href={`/reviews/${myReview.id}`}>Open appraisal</Link></div></div>
          <Stepper status={myReview.status} /></div></>)}
      {cycle && me.role !== "employee" && (
        <div className="card mt-4">
          <div className="mb-3 flex items-center justify-between"><h2 className="section-title">My team</h2>
            <span className="text-xs text-slate-500">{pending} goal(s) awaiting approval · {team.filter((r) => r.status === "self_submitted").length} review(s) awaiting you</span></div>
          <ul className="divide-y divide-slate-100">{team.map((r) => (
            <li key={r.id}><Link href={`/reviews/${r.id}`} className="flex items-center gap-3 py-3 transition hover:bg-slate-50"><Avatar name={nm(r.employee_id)} size={32} /><span className="flex-1 text-sm font-medium">{nm(r.employee_id)}</span><Badge s={r.status} /></Link></li>))}
            {!team.length && <li className="py-3 text-sm text-slate-500">No direct reports.</li>}</ul>
        </div>)}
      {!cycle && <div className="card text-center text-sm text-slate-500">When HR opens a cycle, your goals and appraisal will appear here.</div>}
    </Shell>
  );
}
