import { load } from "@/lib/store";
import { signIn } from "@/lib/actions";
import Link from "next/link";
import { Err } from "@/components/ui";
export const dynamic = "force-dynamic";
const tabs = [["employee", "Employee"], ["manager", "Manager"], ["hr_admin", "HR admin"]] as const;
export default async function Login({ searchParams }: { searchParams: Promise<{ as?: string; error?: string }> }) {
  const { as: a, error } = await searchParams;
  const as = tabs.some(([k]) => k === a) ? (a as "employee" | "manager" | "hr_admin") : "employee";
  const emps = load().employees.filter((e) => e.is_active && e.role === as);
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="flex flex-col justify-between bg-navy p-8 text-white lg:p-14">
        <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 font-bold">P</span><span className="font-semibold">PMS</span></div>
        <div className="my-12"><h1 className="max-w-md text-4xl font-semibold leading-tight">Annual appraisals, without the spreadsheets.</h1>
          <p className="mt-4 max-w-md text-slate-400">Set goals, run self-appraisals and manager reviews in one place — with a clear status at every step.</p>
          <ul className="mt-8 space-y-3 text-sm text-slate-300">{["Goals with weightage, approved by managers", "Self-appraisal and manager review per goal", "Manager ratings hidden until the review is submitted"].map((t) => <li key={t} className="flex gap-3"><span className="text-emerald-400">✓</span>{t}</li>)}</ul></div>
        <p className="text-xs text-slate-500">Performance Management System</p>
      </section>
      <section className="flex items-center justify-center p-6 lg:p-14">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-semibold text-slate-900">Sign in</h2>
          <p className="mt-1 text-sm text-slate-500">Choose how you are signing in.</p>
          <div className="mt-5 grid grid-cols-3 gap-1 rounded-xl bg-slate-200/70 p-1 text-center text-sm font-medium">
            {tabs.map(([k, l]) => <Link key={k} href={`/login?as=${k}`} className={`rounded-lg py-2 ${k === as ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>{l}</Link>)}
          </div>
          <div className="mt-4"><Err msg={error} /></div>
          <form action={signIn} className="card space-y-4">
            <input type="hidden" name="as" value={as} />
            <div><label className="label">{as === "employee" ? "Employee" : as === "manager" ? "Manager" : "HR admin"}</label>
              <select name="id" required defaultValue="" className="input"><option value="" disabled>Select your name…</option>
                {emps.map((e) => <option key={e.id} value={e.id}>{e.full_name} — {e.designation}</option>)}</select></div>
            <div><label className="label">Password</label><input name="password" type="password" required autoComplete="current-password" className="input" placeholder="Enter password" /></div>
            <button className="btn w-full">Sign in as {as === "hr_admin" ? "HR admin" : as}</button>
          </form>
        </div>
      </section>
    </div>
  );
}
