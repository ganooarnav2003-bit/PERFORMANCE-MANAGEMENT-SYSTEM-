import Link from "next/link";
import { load } from "@/lib/store";
import { requireUser } from "@/lib/auth";
import { Pie, pct } from "@/components/charts";
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
          <Stat label="Self score" value={pct(myReview.overall_self_rating) != null ? `${pct(myReview.overall_self_rating)}%` : "—"} hint="weighted self rating" />
          <Stat label="Status" value={<Badge s={myReview.status} />} />
        </div>
        <div className="card mt-4"><div className="mb-4 flex items-center justify-between"><h2 className="section-title">My appraisal progress</h2>
          <div className="flex gap-2"><Link className="btn-ghost" href="/goals">Goals</Link><Link className="btn" href={`/reviews/${myReview.id}`}>Open appraisal</Link></div></div>
          <Stepper status={myReview.status} /></div></>)}
      {cycle && myReview && (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="card"><h2 className="section-title mb-4">Goal weightage</h2>
            <Pie data={myGoals.map((g) => ({ label: g.title, value: g.weightage }))} center={`${myGoals.reduce((a, g) => a + g.weightage, 0)}%`} sub="allocated" empty="Add goals to see the split" /></div>
          <div className="card"><h2 className="section-title mb-4">Performance score</h2>
            {(() => { const done = myReview.status === "manager_reviewed" || myReview.status === "completed"; const v = pct(done ? myReview.overall_manager_rating : myReview.overall_self_rating);
              return <Pie data={v == null ? [] : [{ label: done ? "Manager score" : "Self score", value: v, color: "#10b981" }, { label: "Gap to 100%", value: 100 - v, color: "#e2e8f0" }]} center={v == null ? "" : `${v}%`} sub={done ? "manager rated" : "self rated"} empty="Appears after your self-appraisal" />; })()}</div>
        </div>)}
      {cycle && me.role !== "employee" && (
        <div className="card mt-4">
          <div className="mb-3 flex items-center justify-between"><h2 className="section-title">My team</h2>
            <span className="text-xs text-slate-500">{pending} goal(s) awaiting approval · {team.filter((r) => r.status === "self_submitted").length} review(s) awaiting you</span></div>
          {(() => { const st = team.reduce<Record<string, number>>((a, r) => ((a[r.status] = (a[r.status] ?? 0) + 1), a), {});
            const sc = team.filter((r) => r.overall_manager_rating != null); const avg = sc.length ? pct(sc.reduce((a, r) => a + r.overall_manager_rating!, 0) / sc.length) : null;
            return (<div className="mb-4 grid gap-6 border-b border-slate-100 pb-4 md:grid-cols-2">
              <div><div className="label">Team review progress</div><Pie data={Object.entries(st).map(([k, v]) => ({ label: k.replace(/_/g, " "), value: v }))} center={team.length ? `${Math.round(((st.completed ?? 0) / team.length) * 100)}%` : ""} sub="completed" /></div>
              <div><div className="label">Team performance</div><Pie data={avg == null ? [] : [{ label: "Average score", value: avg, color: "#10b981" }, { label: "Gap to 100%", value: 100 - avg, color: "#e2e8f0" }]} center={avg == null ? "" : `${avg}%`} sub="average" empty="Appears after you submit reviews" /></div></div>); })()}
          <ul className="divide-y divide-slate-100">{team.map((r) => (
            <li key={r.id}><Link href={`/reviews/${r.id}`} className="flex items-center gap-3 py-3 transition hover:bg-slate-50"><Avatar name={nm(r.employee_id)} size={32} /><span className="flex-1 text-sm font-medium">{nm(r.employee_id)}</span>{pct(r.overall_manager_rating) != null && <b className="mr-3 text-sm tabular-nums">{pct(r.overall_manager_rating)}%</b>}<Badge s={r.status} /></Link></li>))}
            {!team.length && <li className="py-3 text-sm text-slate-500">No direct reports.</li>}</ul>
        </div>)}
      {!cycle && <div className="card text-center text-sm text-slate-500">When HR opens a cycle, your goals and appraisal will appear here.</div>}
    </Shell>
  );
}
