import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { load } from "./store";
import type { Employee, Role } from "./types";

// Demo auth: a cookie holds the employee id. Replace with Clerk's auth() and look the
// employee up by clerk_user_id; every other file keeps working unchanged.
export async function currentUser(): Promise<Employee | null> {
  const id = (await cookies()).get("pms_user")?.value;
  return load().employees.find((e) => e.id === id && e.is_active) ?? null;
}
export async function requireUser(...roles: Role[]): Promise<Employee> {
  const u = await currentUser();
  if (!u) redirect("/login");
  if (roles.length && !roles.includes(u.role)) redirect("/");
  return u;
}
