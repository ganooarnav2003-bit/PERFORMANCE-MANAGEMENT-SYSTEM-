import { notFound, redirect } from "next/navigation";
import { load } from "@/lib/store";
import { requireUser } from "@/lib/auth";
import { acknowledge, submitManager, submitSelf } from "@/lib/actions";
import { Pie, pct } from "@/components/charts";
import { Avatar, Badge, Err, Shell, Stepper } from "@/components/ui";
export const dynamic = "force-dynamic";

const Stars = ({ name, def }: { name: string; def?: number | null }) => (
  <select name={name} defaultValue={def ?? ""} className="input w-28" required>
    <option value="" disabled>Rate…</option>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
  </select>
);

export default async function ReviewPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params; const { error } = await searchParams;
  const me = await requireUser();
  const db = load();
  const r = db.reviews.find((x) => x.id === id); if (!r) notFound();
  const isOwner = r.employee_id === me.id;
  const isReviewer = r.manager_id === me.id || me.role === "hr_admin";
  if (!isOwner && !isReviewer) redirect("/");
  const emp = db.employees.find((e) => e.id === r.employee_id)!;
  const cycle = db.review_cycles.find((c) => c.id === r.cycle_id)!;
  const goals = db.goals.filter((g) => g.employee_id === r.employee_id && g.cycle_id === r.cycle_id && g.status === "approved");
  const rating = (gid: string) => db.goal_ratings.find((x) => x.review_id === r.id && x.goal_id === gid);
  // Employees must not see manager feedback until the manager has submitted it.
  const showMgr = r.status === "manager_reviewed" || r.status === "completed" || (isReviewer && !isOwner);
  const editable = cycle.status === "open";
  return (
    <Shell user={me}>
      <div className="card mb-2"><div className="flex items-center gap-4"><Avatar name={emp.full_name} size={48} /><div className="flex-1"><h1 className="text-xl font-semibold text-slate-900">{emp.full_name}</h1>
        <p className="text-sm text-slate-500">{emp.designation} · {cycle.name}</p></div><Badge s={r.status} /></div><div className="mt-5"><Stepper status={r.status} /></div></div>
      <div className="mt-4"><Err msg={error} /></div>

      {isOwner && r.status === "not_started" && editable ? (
        <form action={submitSelf} className="space-y-3">
          <input type="hidden" name="review_id" value={r.id} />
          {!goals.length && <p className="card text-slate-600">Get your goals approved before starting your self-appraisal.</p>}
          {goals.map((g) => (
            <div key={g.id} className="card"><div className="font-medium">{g.title} <span className="text-sm text-slate-500">({g.weightage}%)</span></div>
              <div className="mt-2 grid gap-2 sm:grid-cols-[7rem_1fr]"><Stars name={`rating_${g.id}`} />
                <textarea name={`comment_${g.id}`} rows={2} placeholder="What did you achieve?" className="input" /></div></div>))}
          {goals.length > 0 && <button className="btn">Submit self-appraisal</button>}
        </form>
      ) : (
        <div className="space-y-3">
          {goals.map((g) => { const gr = rating(g.id); return (
            <div key={g.id} className="card"><div className="font-medium">{g.title} <span className="text-sm text-slate-500">({g.weightage}%)</span></div>
              <div className="mt-2 text-sm"><b>Self:</b> {gr?.self_rating ?? "—"}/5 {gr?.self_comment && `· ${gr.self_comment}`}</div>
              {showMgr && gr?.manager_rating && <div className="mt-1 text-sm"><b>Manager:</b> {gr.manager_rating}/5 {gr.manager_comment && `· ${gr.manager_comment}`}</div>}
            </div>); })}
        </div>)}

      {isReviewer && !isOwner && r.status === "self_submitted" && editable && (
        <form action={submitManager} className="mt-6 space-y-3">
          <input type="hidden" name="review_id" value={r.id} />
          <h2 className="font-medium">Your assessment</h2>
          {goals.map((g) => (
            <div key={g.id} className="card"><div className="text-sm font-medium">{g.title}</div>
              <div className="mt-2 grid gap-2 sm:grid-cols-[7rem_1fr]"><Stars name={`rating_${g.id}`} />
                <textarea name={`comment_${g.id}`} rows={2} placeholder="Feedback" className="input" /></div></div>))}
          <div><label className="label">Overall summary</label><textarea name="summary" rows={3} className="input" required /></div>
          <button className="btn">Submit review</button>
        </form>)}

      {goals.length > 0 && (
        <div className="card mt-6 grid gap-6 md:grid-cols-2">
          <div><h2 className="section-title mb-4">Goal weightage</h2><Pie data={goals.map((g) => ({ label: g.title, value: g.weightage }))} center={`${goals.reduce((a, g) => a + g.weightage, 0)}%`} sub="total" /></div>
          <div><h2 className="section-title mb-4">Performance score</h2>
            {(() => { const v = pct(showMgr && r.overall_manager_rating ? r.overall_manager_rating : r.overall_self_rating);
              return <Pie data={v == null ? [] : [{ label: showMgr && r.overall_manager_rating ? "Manager score" : "Self score", value: v, color: "#10b981" }, { label: "Gap to 100%", value: 100 - v, color: "#e2e8f0" }]} center={v == null ? "" : `${v}%`} sub="of 5.0" empty="Appears after self-appraisal" />; })()}</div>
        </div>)}
      {(r.overall_self_rating || (showMgr && r.overall_manager_rating)) && (
        <div className="card mt-6 grid gap-2 sm:grid-cols-2">
          <div><div className="label">Overall self rating</div><div className="text-2xl font-semibold">{r.overall_self_rating ?? "—"}</div></div>
          {showMgr && <div><div className="label">Overall manager rating</div><div className="text-2xl font-semibold">{r.overall_manager_rating ?? "—"}</div></div>}
          {showMgr && r.manager_summary && <p className="text-sm text-slate-700 sm:col-span-2">{r.manager_summary}</p>}
        </div>)}
      {isOwner && r.status === "manager_reviewed" && (
        <form action={acknowledge} className="mt-4"><input type="hidden" name="review_id" value={r.id} /><button className="btn">Acknowledge &amp; complete</button></form>)}
    </Shell>
  );
}
