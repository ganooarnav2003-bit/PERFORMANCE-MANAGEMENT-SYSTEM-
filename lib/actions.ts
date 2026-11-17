"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { load, mutate, sendEmail, uid } from "./store";
import { requireUser } from "./auth";
import type { DB } from "./types";

const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const n = (f: FormData, k: string) => { const v = parseFloat(s(f, k)); return Number.isFinite(v) ? v : NaN; };
const fail = (msg: string, to = "/"): never => redirect(`${to}${to.includes("?") ? "&" : "?"}error=${encodeURIComponent(msg)}`);
const ok = (path: string) => { revalidatePath(path); redirect(path); };
const openCycle = (db: DB) => db.review_cycles.find((c) => c.status === "open");
const mail = (db: DB, empId: string | null, subject: string, body: string) => {
  const e = db.employees.find((x) => x.id === empId); if (e) sendEmail(db, e.email, subject, body);
};

// Demo passwords per role (override with env vars). Replace with Clerk for real accounts.
const PASSWORDS = { employee: process.env.PMS_EMPLOYEE_PASSWORD ?? "1234", manager: process.env.PMS_MANAGER_PASSWORD ?? "5678", hr_admin: process.env.PMS_HR_PASSWORD ?? "0000" };
export async function signIn(f: FormData) {
  const id = s(f, "id"), as = s(f, "as") as keyof typeof PASSWORDS, pw = s(f, "password");
  const back = `/login?as=${as}`;
  if (!(as in PASSWORDS)) redirect("/login");
  const u = load().employees.find((e) => e.id === id && e.is_active && e.role === as);
  if (!u) fail("Please choose a user.", back);
  if (pw !== PASSWORDS[as]) fail("Incorrect password.", back);
  (await cookies()).set("pms_user", id, { httpOnly: true, path: "/" });
  redirect("/");
}
export async function signOut() { (await cookies()).delete("pms_user"); redirect("/login"); }

// ---------- HR ----------
export async function createCycle(f: FormData) {
  const me = await requireUser("hr_admin");
  const name = s(f, "name"), start = s(f, "start_date"), end = s(f, "end_date");
  if (!name || !start || !end || end < start) fail("Enter a name and a valid date range.", "/hr");
  mutate((db) => db.review_cycles.push({ id: uid(), name, start_date: start, end_date: end, status: "draft", created_by: me.id }));
  ok("/hr");
}
export async function openCycleAction(f: FormData) {
  await requireUser("hr_admin");
  const id = s(f, "id");
  const err = mutate((db) => {
    if (openCycle(db)) return "Another cycle is already open. Close it first.";
    const c = db.review_cycles.find((x) => x.id === id && x.status === "draft"); if (!c) return "Cycle not found.";
    c.status = "open";
    for (const e of db.employees.filter((x) => x.is_active && x.role !== "hr_admin")) {
      db.reviews.push({ id: uid(), employee_id: e.id, manager_id: e.manager_id, cycle_id: c.id, status: "not_started",
        overall_self_rating: null, overall_manager_rating: null, manager_summary: null, submitted_at: null, reviewed_at: null });
      mail(db, e.id, `${c.name} is open`, "Please set your goals and submit them for approval.");
    }
    return null;
  });
  if (err) fail(err, "/hr");
  ok("/hr");
}
export async function closeCycle(f: FormData) {
  await requireUser("hr_admin");
  mutate((db) => { const c = db.review_cycles.find((x) => x.id === s(f, "id") && x.status === "open"); if (c) c.status = "closed"; });
  ok("/hr");
}
export async function saveEmployee(f: FormData) {
  await requireUser("hr_admin");
  const id = s(f, "id"), full_name = s(f, "full_name"), email = s(f, "email");
  if (!full_name || !email) fail("Name and email are required.", "/hr");
  const mgr = s(f, "manager_id") || null;
  if (id && mgr === id) fail("A person cannot manage themselves.", "/hr");
  const role = s(f, "role") as "employee" | "manager" | "hr_admin";
  mutate((db) => {
    const data = { full_name, email, designation: s(f, "designation"), department: s(f, "department"),
      date_of_joining: s(f, "date_of_joining") || new Date().toISOString().slice(0, 10), manager_id: mgr, role, is_active: f.get("is_active") !== "off" };
    const ex = db.employees.find((e) => e.id === id);
    if (ex) Object.assign(ex, data);
    else db.employees.push({ id: uid(), clerk_user_id: null, created_at: new Date().toISOString(), ...data });
  });
  ok("/hr");
}

// ---------- Goals ----------
export async function saveGoal(f: FormData) {
  const me = await requireUser();
  const title = s(f, "title"), weight = n(f, "weightage"), target = s(f, "target_date"), id = s(f, "id");
  if (!title || !(weight > 0 && weight <= 100) || !target) fail("Title, weightage (1-100) and target date are required.", "/goals");
  const err = mutate((db) => {
    const c = openCycle(db); if (!c) return "No cycle is open.";
    const data = { title, description: s(f, "description"), weightage: weight, target_date: target };
    if (id) {
      const g = db.goals.find((x) => x.id === id && x.employee_id === me.id);
      if (!g || !["draft", "sent_back"].includes(g.status)) return "This goal can't be edited now.";
      Object.assign(g, data);
    } else db.goals.push({ id: uid(), employee_id: me.id, cycle_id: c.id, status: "draft", manager_comment: null, ...data });
    return null;
  });
  if (err) fail(err, "/goals");
  ok("/goals");
}
export async function deleteGoal(f: FormData) {
  const me = await requireUser();
  mutate((db) => { db.goals = db.goals.filter((g) => !(g.id === s(f, "id") && g.employee_id === me.id && ["draft", "sent_back"].includes(g.status))); });
  ok("/goals");
}
export async function submitGoals() {
  const me = await requireUser();
  const err = mutate((db) => {
    const c = openCycle(db); if (!c) return "No cycle is open.";
    const mine = db.goals.filter((g) => g.employee_id === me.id && g.cycle_id === c.id);
    const total = mine.reduce((a, g) => a + g.weightage, 0);
    if (!mine.length) return "Add at least one goal.";
    if (Math.abs(total - 100) > 0.001) return `Weightages must total 100 (currently ${total}).`;
    for (const g of mine) if (g.status === "draft" || g.status === "sent_back") g.status = "submitted";
    mail(db, me.manager_id, `${me.full_name} submitted goals`, "Please review and approve or send them back.");
    return null;
  });
  if (err) fail(err, "/goals");
  ok("/goals");
}
export async function approveGoal(f: FormData) { return decideGoal(f, true); }
export async function sendBackGoal(f: FormData) { return decideGoal(f, false); }
async function decideGoal(f: FormData, approve: boolean) {
  const me = await requireUser("manager", "hr_admin");
  const id = s(f, "id"), comment = s(f, "comment");
  if (!approve && !comment) fail("Add a comment when sending a goal back.", "/team");
  mutate((db) => {
    const g = db.goals.find((x) => x.id === id && x.status === "submitted");
    const emp = db.employees.find((e) => e.id === g?.employee_id);
    if (!g || !emp || (emp.manager_id !== me.id && me.role !== "hr_admin")) return;
    g.status = approve ? "approved" : "sent_back"; g.manager_comment = comment || null;
    mail(db, emp.id, `Goal "${g.title}" ${approve ? "approved" : "sent back"}`, comment || "");
  });
  ok("/team");
}

// ---------- Reviews ----------
const wavg = (rows: { w: number; r: number }[]) => {
  const tw = rows.reduce((a, x) => a + x.w, 0); return tw ? Math.round((rows.reduce((a, x) => a + x.w * x.r, 0) / tw) * 100) / 100 : null;
};
const rating = (f: FormData, k: string) => { const v = n(f, k); return v >= 1 && v <= 5 ? v : NaN; };

export async function submitSelf(f: FormData) {
  const me = await requireUser();
  const rid = s(f, "review_id"), back = `/reviews/${rid}`;
  const err = mutate((db) => {
    const r = db.reviews.find((x) => x.id === rid && x.employee_id === me.id); if (!r) return "Review not found.";
    if (db.review_cycles.find((c) => c.id === r.cycle_id)?.status !== "open") return "Cycle is not open.";
    if (r.status !== "not_started") return "Already submitted.";
    const goals = db.goals.filter((g) => g.employee_id === me.id && g.cycle_id === r.cycle_id);
    if (!goals.length || goals.some((g) => g.status !== "approved")) return "All goals must be approved before self-appraisal.";
    const rows = [];
    for (const g of goals) {
      const v = rating(f, `rating_${g.id}`); if (Number.isNaN(v)) return `Rate every goal from 1 to 5 ("${g.title}").`;
      rows.push({ g, v });
    }
    for (const { g, v } of rows) {
      let gr = db.goal_ratings.find((x) => x.review_id === r.id && x.goal_id === g.id);
      if (!gr) { gr = { id: uid(), review_id: r.id, goal_id: g.id, self_comment: null, self_rating: null, manager_comment: null, manager_rating: null }; db.goal_ratings.push(gr); }
      gr.self_rating = v; gr.self_comment = s(f, `comment_${g.id}`) || null;
    }
    r.overall_self_rating = wavg(rows.map((x) => ({ w: x.g.weightage, r: x.v })));
    r.status = "self_submitted"; r.submitted_at = new Date().toISOString();
    mail(db, r.manager_id, `${me.full_name} submitted a self-appraisal`, "Your review is waiting.");
    return null;
  });
  if (err) fail(err, back);
  ok(back);
}
export async function submitManager(f: FormData) {
  const me = await requireUser("manager", "hr_admin");
  const rid = s(f, "review_id"), back = `/reviews/${rid}`;
  const err = mutate((db) => {
    const r = db.reviews.find((x) => x.id === rid); if (!r) return "Review not found.";
    if (r.manager_id !== me.id && me.role !== "hr_admin") return "Not your report.";
    if (r.status !== "self_submitted") return "Employee has not submitted a self-appraisal.";
    const rows = [];
    for (const gr of db.goal_ratings.filter((x) => x.review_id === r.id)) {
      const v = rating(f, `rating_${gr.goal_id}`); if (Number.isNaN(v)) return "Rate every goal from 1 to 5.";
      rows.push({ gr, v, w: db.goals.find((g) => g.id === gr.goal_id)!.weightage });
    }
    const summary = s(f, "summary"); if (!summary) return "Write a summary.";
    for (const { gr, v } of rows) { gr.manager_rating = v; gr.manager_comment = s(f, `comment_${gr.goal_id}`) || null; }
    r.overall_manager_rating = wavg(rows.map((x) => ({ w: x.w, r: x.v })));
    r.manager_summary = summary; r.status = "manager_reviewed"; r.reviewed_at = new Date().toISOString();
    mail(db, r.employee_id, "Your review is ready", "Your manager has completed your review. Please read and acknowledge it.");
    return null;
  });
  if (err) fail(err, back);
  ok(back);
}
export async function acknowledge(f: FormData) {
  const me = await requireUser();
  const rid = s(f, "review_id");
  mutate((db) => { const r = db.reviews.find((x) => x.id === rid && x.employee_id === me.id && x.status === "manager_reviewed"); if (r) r.status = "completed"; });
  ok(`/reviews/${rid}`);
}
