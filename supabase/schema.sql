-- Production schema matching docs/data-model.md. RLS is on; all access is server-side via the service role.
create extension if not exists pgcrypto;
create table employees (
  id uuid primary key default gen_random_uuid(), clerk_user_id text unique, full_name text not null, email text unique not null,
  designation text, department text, date_of_joining date, manager_id uuid references employees(id),
  role text not null check (role in ('employee','manager','hr_admin')), is_active boolean not null default true, created_at timestamptz default now());
create table review_cycles (
  id uuid primary key default gen_random_uuid(), name text not null, start_date date not null, end_date date not null,
  status text not null default 'draft' check (status in ('draft','open','closed')), created_by uuid references employees(id));
create unique index one_open_cycle on review_cycles ((status)) where status = 'open';
create table goals (
  id uuid primary key default gen_random_uuid(), employee_id uuid not null references employees(id), cycle_id uuid not null references review_cycles(id),
  title text not null, description text, weightage numeric not null check (weightage > 0 and weightage <= 100), target_date date,
  status text not null default 'draft' check (status in ('draft','submitted','approved','sent_back')), manager_comment text);
create table reviews (
  id uuid primary key default gen_random_uuid(), employee_id uuid not null references employees(id), manager_id uuid references employees(id),
  cycle_id uuid not null references review_cycles(id), status text not null default 'not_started'
    check (status in ('not_started','self_submitted','manager_reviewed','completed')),
  overall_self_rating numeric, overall_manager_rating numeric, manager_summary text, submitted_at timestamptz, reviewed_at timestamptz,
  unique (employee_id, cycle_id));
create table goal_ratings (
  id uuid primary key default gen_random_uuid(), review_id uuid not null references reviews(id), goal_id uuid not null references goals(id),
  self_comment text, self_rating numeric check (self_rating between 1 and 5), manager_comment text, manager_rating numeric check (manager_rating between 1 and 5),
  unique (review_id, goal_id));
alter table employees enable row level security; alter table review_cycles enable row level security; alter table goals enable row level security;
alter table reviews enable row level security; alter table goal_ratings enable row level security;
