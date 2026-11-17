import { load } from "@/lib/store";
import { requireUser } from "@/lib/auth";
import { deleteGoal, saveGoal, submitGoals } from "@/lib/actions";
import { Badge, Err, Shell } from "@/components/ui";
export const dynamic = "force-dynamic";

export default async function Goals({ searchParams }: { searchParams: Promise<{ error?: string; edit?: string }> }) {
  const { error, edit } = await searchParams;
  const me = await requireUser();
  const db = load();
  const cycle = db.review_cycles.find((c) => c.status === "open");
  const goals = cycle ? db.goals.filter((g) => g.employee_id === me.id && g.cycle_id === cycle.id) : [];
  const total = goals.reduce((a, g) => a + g.weightage, 0);
  const editing = goals.find((g) => g.id === edit && ["draft", "sent_back"].includes(g.status));
  const canSubmit = goals.some((g) => ["draft", "sent_back"].includes(g.status));
  return (
    <Shell user={me}>
      <h1 className="text-xl font-semibold">My goals {cycle && <span className="text-sm font-normal text-slate-500">· {cycle.name}</span>}</h1>
      <div className="mt-4"><Err msg={error} /></div>
      {!cycle ? <p className="card text-slate-600">No cycle is open.</p> : <>
        <div className="space-y-3">
          {goals.map((g) => (
            <div key={g.id} className="card">
              <div className="flex items-start justify-between gap-3">
                <div><div className="font-medium">{g.title}</div><div className="text-sm text-slate-600">{g.description}</div>
                  <div className="mt-1 text-xs text-slate-500">Weight {g.weightage}% · target {g.target_date}</div></div>
                <Badge s={g.status} />
              </div>
              {g.manager_comment && <p className="mt-2 rounded bg-slate-50 p-2 text-sm text-slate-700">Manager: {g.manager_comment}</p>}
              {["draft", "sent_back"].includes(g.status) && (
                <div className="mt-3 flex gap-2"><a className="btn-ghost" href={`/goals?edit=${g.id}`}>Edit</a>
                  <form action={deleteGoal}><input type="hidden" name="id" value={g.id} /><button className="btn-ghost">Delete</button></form></div>)}
            </div>))}
          {!goals.length && <p className="text-sm text-slate-500">No goals yet.</p>}
        </div>
        <div className="mt-3 flex items-center justify-between text-sm"><span className={Math.abs(total - 100) < 0.001 ? "text-emerald-700" : "text-amber-700"}>Total weightage: {total}/100</span>
          {canSubmit && <form action={submitGoals}><button className="btn">Submit for approval</button></form>}</div>
        <form action={saveGoal} key={editing?.id ?? "new"} className="card mt-6 grid gap-3 sm:grid-cols-2">
          <h2 className="font-medium sm:col-span-2">{editing ? "Edit goal" : "Add goal"}</h2>
          <input type="hidden" name="id" value={editing?.id ?? ""} />
          <div className="sm:col-span-2"><label className="label">Title</label><input name="title" className="input" defaultValue={editing?.title} required /></div>
          <div className="sm:col-span-2"><label className="label">Description</label><textarea name="description" rows={2} className="input" defaultValue={editing?.description} /></div>
          <div><label className="label">Weightage (%)</label><input name="weightage" type="number" min={1} max={100} className="input" defaultValue={editing?.weightage} required /></div>
          <div><label className="label">Target date</label><input name="target_date" type="date" className="input" defaultValue={editing?.target_date} required /></div>
          <div><button className="btn">{editing ? "Save changes" : "Add goal"}</button></div>
        </form></>}
    </Shell>
  );
}
