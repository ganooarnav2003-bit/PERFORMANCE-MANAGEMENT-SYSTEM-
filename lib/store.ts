import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { DB, Employee, Role } from "./types";

// Demo persistence: one JSON file with the same five tables as docs/data-model.md.
// Swap this module for Supabase queries (see supabase/schema.sql) for production.
const FILE = path.join(process.cwd(), ".data", "db.json");
export const uid = () => randomUUID();
const now = () => new Date().toISOString();

function seed(): DB {
  const mk = (n: string, d: string, dept: string, role: Role, mgr: string | null, join: string): Employee => ({
    id: uid(), clerk_user_id: null, full_name: n, email: n.toLowerCase().replace(/[^a-z]+/g, ".") + "@acme.test",
    designation: d, department: dept, date_of_joining: join, manager_id: mgr, role, is_active: true, created_at: now(),
  });
  const hr = mk("Priya Sharma", "HR Director", "People", "hr_admin", null, "2018-04-02");
  const m1 = mk("Rahul Mehta", "Engineering Manager", "Engineering", "manager", hr.id, "2019-06-10");
  const m2 = mk("Neha Kapoor", "Delivery Manager", "Delivery", "manager", hr.id, "2020-01-15");
  const e = [
    mk("Arjun Rao", "Software Engineer", "Engineering", "employee", m1.id, "2021-03-01"),
    mk("Sara Khan", "QA Analyst", "Engineering", "employee", m1.id, "2022-07-18"),
    mk("Dev Patel", "Business Analyst", "Delivery", "employee", m2.id, "2023-02-06"),
  ];
  return {
    employees: [hr, m1, m2, ...e], review_cycles: [], goals: [], reviews: [], goal_ratings: [], emails: [],
  };
}

export function load(): DB {
  if (!fs.existsSync(FILE)) { fs.mkdirSync(path.dirname(FILE), { recursive: true }); save(seed()); }
  return JSON.parse(fs.readFileSync(FILE, "utf8"));
}
export function save(db: DB) { fs.writeFileSync(FILE, JSON.stringify(db, null, 2)); }
export function mutate<T>(fn: (db: DB) => T): T { const db = load(); const r = fn(db); save(db); return r; }

/** Stand-in for Resend: records the email so it shows up in the HR "Email log". */
export function sendEmail(db: DB, to: string, subject: string, body: string) {
  db.emails.unshift({ id: uid(), to, subject, body, sent_at: now() });
  db.emails = db.emails.slice(0, 100);
}
