import Link from "next/link";
import { load } from "@/lib/store";
import { requireUser } from "@/lib/auth";
import { approveGoal, sendBackGoal } from "@/lib/actions";
import { Badge, Err, Shell } from "@/components/ui";
export const dynamic = "force-dynamic";

export default async function Team({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const me = await requireUser("manager", "hr_admin");
  const db = load();
  const cycle = db.review_cycles.find((c) => c.status === "open");
  const reports = db.employees.filter((e) => e.manager_id === me.id && e.is_active);
  return (
    <Shell user={me}>
      <h1 className="text-xl font-semibold">My team</h1>
      <div className="mt-4"><Err msg={error} /></div>
      {!cycle ? <p className="card text-slate-600">No cycle is open.</p> : <div className="space-y-4">
        {reports.map((e) => {
          const goals = db.goals.filter((g) => g.employee_id === e.id && g.cycle_id === cycle.id);
          const rev = db.reviews.find((r) => r.employee_id === e.id && r.cycle_id === cycle.id);
          return (
            <div key={e.id} className="card">
              <div className="flex items-center justify-between"><div><div className="font-medium">{e.full_name}</div><div className="text-xs text-slate-500">{e.designation}</div></div>
                {rev && <Link href={`/reviews/${rev.id}`} className="flex items-center gap-2 text-sm text-indigo-700">Review <Badge s={rev.status} /></Link>}</div>
              <ul className="mt-3 space-y-3">
                {goals.filter((g) => g.status !== "draft").map((g) => (
                  <li key={g.id} className="rounded-lg border border-slate-100 p-3">
                    <div className="flex justify-between"><span className="text-sm font-medium">{g.title} <span className="text-slate-500">({g.weightage}%)</span></span><Badge s={g.status} /></div>
                    <p className="text-sm text-slate-600">{g.description}</p>
                    {g.status === "submitted" && (
                      <form className="mt-2 flex flex-wrap gap-2">
                        <input type="hidden" name="id" value={g.id} />
                        <input name="comment" placeholder="Comment (required to send back)" className="input flex-1" />
                        <button formAction={approveGoal} className="btn">Approve</button>
                        <button formAction={sendBackGoal} className="btn-danger">Send back</button>
                      </form>)}
                  </li>))}
                {!goals.some((g) => g.status !== "draft") && <li className="text-sm text-slate-500">No submitted goals.</li>}
              </ul>
            </div>);
        })}
        {!reports.length && <p className="text-sm text-slate-500">No direct reports.</p>}
      </div>}
    </Shell>
  );
}
