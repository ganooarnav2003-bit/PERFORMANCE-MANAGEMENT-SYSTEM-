import { load } from "@/lib/store";
import { signIn } from "@/lib/actions";
export const dynamic = "force-dynamic";
export default function Login() {
  const emps = load().employees.filter((e) => e.is_active);
  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-semibold">Performance Management System</h1>
      <p className="mt-1 text-sm text-slate-500">Demo sign-in — pick a user. (Production uses Clerk.)</p>
      <div className="mt-6 space-y-2">
        {emps.map((e) => (
          <form key={e.id} action={signIn}>
            <input type="hidden" name="id" value={e.id} />
            <button className="card flex w-full items-center justify-between text-left hover:border-indigo-400">
              <span><span className="block font-medium">{e.full_name}</span><span className="text-xs text-slate-500">{e.designation}</span></span>
              <span className="text-xs text-indigo-700">{e.role.replace("_", " ")}</span>
            </button>
          </form>
        ))}
      </div>
    </main>
  );
}
