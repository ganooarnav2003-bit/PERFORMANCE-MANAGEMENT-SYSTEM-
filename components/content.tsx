export const ROLE_INFO: Record<string, { title: string; points: string[] }> = {
  employee: { title: "For employees", points: ["Set up to 100% of weighted goals for the year", "Submit goals for your manager's approval", "Rate yourself, then read and acknowledge your review"] },
  manager: { title: "For managers", points: ["Approve or send back your team's goals with comments", "Review each self-appraisal goal by goal", "Track team progress and average performance"] },
  hr_admin: { title: "For HR admins", points: ["Create, open and close appraisal cycles", "Add employees and assign managers", "Monitor company-wide progress and performance by department"] },
};
export const SCALE: [string, string][] = [["5", "Outstanding"], ["4", "Exceeds expectations"], ["3", "Meets expectations"], ["2", "Needs improvement"], ["1", "Unsatisfactory"]];
const TIPS: Record<string, string[]> = {
  employee: ["Keep goals specific and measurable.", "Make weightages add up to exactly 100%.", "You can edit goals a manager sends back."],
  manager: ["Add a short comment when sending a goal back.", "Ratings stay hidden from employees until you submit.", "Use the rating scale consistently across your team."],
  hr_admin: ["Only one cycle can be open at a time.", "Closing a cycle locks goals and reviews.", "Check department averages before the review window ends."],
};
export function Guide({ role }: { role: string }) {
  return (
    <div className="mt-4 grid gap-4 md:grid-cols-2">
      <div className="card"><h2 className="section-title mb-3">Tips for you</h2>
        <ul className="space-y-2 text-sm text-slate-600">{TIPS[role].map((t) => <li key={t} className="flex gap-2"><span className="text-brand-600">●</span>{t}</li>)}</ul></div>
      <div className="card"><h2 className="section-title mb-3">Rating scale</h2>
        <ul className="space-y-1.5 text-sm">{SCALE.map(([n, l]) => <li key={n} className="flex items-center gap-3"><b className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-50 text-brand-700">{n}</b><span className="text-slate-600">{l}</span></li>)}</ul></div>
    </div>
  );
}
