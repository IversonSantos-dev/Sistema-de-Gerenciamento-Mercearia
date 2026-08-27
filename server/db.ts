import type { InsertUser } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { ensureSupabaseSuccess, getSupabase } from "./supabase";

type SupabaseUser = {
  id: number;
  open_id: string;
  name: string | null;
  email: string | null;
  login_method: string | null;
  role: "user" | "admin";
  created_at: string;
  updated_at: string;
  last_signed_in: string;
};

function mapUser(user: SupabaseUser) {
  return {
    id: user.id,
    openId: user.open_id,
    name: user.name,
    email: user.email,
    loginMethod: user.login_method,
    role: user.role,
    createdAt: new Date(user.created_at),
    updatedAt: new Date(user.updated_at),
    lastSignedIn: new Date(user.last_signed_in),
  };
}

export async function getDb() {
  return getSupabase();
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const role = user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user");
  const { error } = await getSupabase().from("users").upsert({
    open_id: user.openId,
    name: user.name ?? null,
    email: user.email ?? null,
    login_method: user.loginMethod ?? null,
    role,
    last_signed_in: (user.lastSignedIn ?? new Date()).toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: "open_id" });
  ensureSupabaseSuccess(error);
}

export async function getUserByOpenId(openId: string) {
  const { data, error } = await getSupabase().from("users").select("*").eq("open_id", openId).maybeSingle();
  ensureSupabaseSuccess(error);
  return data ? mapUser(data as SupabaseUser) : undefined;
}
