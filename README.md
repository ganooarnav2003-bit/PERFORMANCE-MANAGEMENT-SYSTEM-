# Performance Management System (PMS)

An annual appraisal system for a ~200-person services company, replacing email and Excel.
HR runs the cycle, employees set goals and self-appraise, managers approve goals and review their team.

> Status: working app. Runs locally in **demo mode** (JSON store + user picker); see "Going to production".

## Tech stack
Next.js (App Router, TypeScript, Tailwind) · Clerk · Supabase Postgres · Resend · Vercel

## Roles
- **Employee** – sets goals, submits a self-appraisal, reads and acknowledges the manager's review.
- **Manager** – approves/sends back direct reports' goals and reviews their self-appraisals.
- **HR admin** – manages employees and review cycles (create, open, close); sees cycle progress.

## Workflow
1. HR creates a cycle and opens it (only one open at a time); a review row is created per employee.
2. Employee adds goals (weightage must total 100) and submits → manager approves or sends back with a comment.
3. Once all goals are approved, the employee rates each goal 1–5 and submits (`self_submitted`).
4. Manager rates each goal and writes a summary (`manager_reviewed`); manager ratings stay hidden from the employee until this point.
5. Employee acknowledges → `completed`. HR closes the cycle.

## Setup
```bash
npm install
npm run dev   # http://localhost:3000 — pick a seeded user on /login
```
Sign in by choosing the **Employee**, **Manager** or **HR admin** tab, picking your name and entering the password: employee `1234`, manager `5678`, HR admin `0009` (override with `PMS_EMPLOYEE_PASSWORD`, `PMS_MANAGER_PASSWORD`, `PMS_HR_PASSWORD`).
Data is kept in `.data/db.json` (delete it to reset). Seed users: one HR admin, two managers, three employees.

## Environment variables
None in demo mode. For production: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`.

## Going to production
- Auth: `lib/auth.ts` → use Clerk `auth()` and look up the employee by `clerk_user_id`.
- Data: `lib/store.ts` → replace with Supabase queries; run `supabase/schema.sql`.
- Email: `sendEmail` in `lib/store.ts` → call Resend.

## Project docs
- [Research notes](RESEARCH.md)
- [Data model](docs/data-model.md)
