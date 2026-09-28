import type { InsertUser } from "../drizzle/schema";
import { ensureSupabaseSuccess, getSupabase } from "./supabase";

type SupabaseUser = {
  id: number;
  open_id: string;
  name: string | null;
  email: string | null;
  username: string | null;
  password_hash?: string | null;
  login_method: string | null;
  role: "user" | "admin";
  active: boolean;
  failed_login_attempts?: number;
  locked_until?: string | null;
  created_at: string;
  updated_at: string;
  last_signed_in: string;
};

function mapUser(user: SupabaseUser) { return { id: user.id, openId: user.open_id, name: user.name, email: user.email, username: user.username, passwordHash: user.password_hash ?? null, loginMethod: user.login_method, role: user.role, active: user.active, failedLoginAttempts: user.failed_login_attempts ?? 0, lockedUntil: user.locked_until ? new Date(user.locked_until) : null, createdAt: new Date(user.created_at), updatedAt: new Date(user.updated_at), lastSignedIn: new Date(user.last_signed_in) }; }
export async function getDb() { return getSupabase(); }
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const { error } = await getSupabase().from("users").upsert({ open_id: user.openId, name: user.name ?? null, email: user.email ?? null, login_method: user.loginMethod ?? "local", role: user.role ?? "user", last_signed_in: (user.lastSignedIn ?? new Date()).toISOString(), updated_at: new Date().toISOString() }, { onConflict: "open_id" });
  ensureSupabaseSuccess(error);
}
export async function getUserByOpenId(openId: string) {
  const { data, error } = await getSupabase().from("users").select("id,open_id,name,email,username,login_method,role,active,created_at,updated_at,last_signed_in").eq("open_id", openId).maybeSingle();
  ensureSupabaseSuccess(error);
  return data ? mapUser(data as SupabaseUser) : undefined;
}
