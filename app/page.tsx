import Link from "next/link";
import { load } from "@/lib/store";
import { requireUser } from "@/lib/auth";
import { Badge, Shell } from "@/components/ui";
export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const me = await requireUser();
  const db = load();
  const cycle = db.review_cycles.find((c) => c.status === "open");
  const myReview = cycle && db.reviews.find((r) => r.cycle_id === cycle.id && r.employee_id === me.id);
  const myGoals = cycle ? db.goals.filter((g) => g.cycle_id === cycle.id && g.employee_id === me.id) : [];
  const team = cycle ? db.reviews.filter((r) => r.cycle_id === cycle.id && r.manager_id === me.id) : [];
  const pendingGoals = cycle ? db.goals.filter((g) => g.cycle_id === cycle.id && g.status === "submitted" && db.employees.find((e) => e.id === g.employee_id)?.manager_id === me.id) : [];
  const name = (id: string) => db.employees.find((e) => e.id === id)?.full_name;
  return (
    <Shell user={me}>
      <h1 className="text-xl font-semibold">Welcome, {me.full_name.split(" ")[0]}</h1>
      {!cycle ? <p className="card mt-4 text-slate-600">No appraisal cycle is open right now.</p> : (
        <div className="mt-4 space-y-4">
          <div className="card"><span className="text-xs uppercase text-slate-500">Open cycle</span>
            <div className="text-lg font-medium">{cycle.name}</div><div className="text-sm text-slate-500">{cycle.start_date} → {cycle.end_date}</div></div>
          {myReview && (
            <div className="card">
              <div className="flex items-center justify-between"><h2 className="font-medium">My appraisal</h2><Badge s={myReview.status} /></div>
              <p className="mt-2 text-sm text-slate-600">{myGoals.length} goal(s): {myGoals.filter((g) => g.status === "approved").length} approved.</p>
              <div className="mt-3 flex gap-2"><Link className="btn-ghost" href="/goals">Goals</Link><Link className="btn" href={`/reviews/${myReview.id}`}>Appraisal</Link></div>
            </div>)}
          {me.role !== "employee" && (
            <div className="card">
              <h2 className="font-medium">My team</h2>
              <p className="mt-1 text-sm text-slate-600">{pendingGoals.length} goal(s) awaiting approval · {team.filter((r) => r.status === "self_submitted").length} review(s) awaiting you.</p>
              <ul className="mt-2 divide-y text-sm">{team.map((r) => <li key={r.id} className="flex justify-between py-2"><Link className="text-indigo-700" href={`/reviews/${r.id}`}>{name(r.employee_id)}</Link><Badge s={r.status} /></li>)}</ul>
            </div>)}
        </div>)}
    </Shell>
  );
}
