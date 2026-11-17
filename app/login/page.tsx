import { load } from "@/lib/store";
import { signIn } from "@/lib/actions";
import { Avatar } from "@/components/ui";
export const dynamic = "force-dynamic";
export default function Login() {
  const emps = load().employees.filter((e) => e.is_active);
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
          <p className="mt-1 text-sm text-slate-500">Demo mode — choose a user to continue.</p>
          <div className="mt-6 space-y-2.5">{emps.map((e) => (
            <form key={e.id} action={signIn}><input type="hidden" name="id" value={e.id} />
              <button className="card flex w-full cursor-pointer items-center gap-3 !p-3.5 text-left transition hover:border-brand-500 hover:shadow-md">
                <Avatar name={e.full_name} /><span className="min-w-0 flex-1"><span className="block text-sm font-medium text-slate-900">{e.full_name}</span><span className="text-xs text-slate-500">{e.designation}</span></span>
                <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium capitalize text-brand-700">{e.role.replace("_", " ")}</span></button></form>))}</div>
        </div>
      </section>
    </div>
  );
}
