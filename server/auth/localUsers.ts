import { ensureSupabaseSuccess, getSupabase } from "../supabase";
import { hashPassword, normalizeUsername, validatePassword, verifyPassword } from "./localCredentials";

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

type LocalUserRow = {
  id: number;
  open_id: string;
  name: string | null;
  email: string | null;
  username: string | null;
  password_hash: string | null;
  role: "user" | "admin";
  active: boolean;
  failed_login_attempts: number;
  locked_until: string | null;
  created_at: string;
  updated_at: string;
  last_signed_in: string;
};

function mapLocalUser(user: LocalUserRow) {
  return { id: Number(user.id), openId: user.open_id, name: user.name, email: user.email, username: user.username, loginMethod: "local", role: user.role, createdAt: new Date(user.created_at), updatedAt: new Date(user.updated_at), lastSignedIn: new Date(user.last_signed_in) };
}

export async function localAccountStatus() {
  const { count, error } = await getSupabase().from("users").select("id", { count: "exact", head: true }).not("username", "is", null);
  ensureSupabaseSuccess(error);
  return { configured: (count ?? 0) > 0 };
}

export async function createInitialLocalAdmin(input: { name: string; username: string; password: string }) {
  const status = await localAccountStatus();
  if (status.configured) throw new Error("O acesso local já foi configurado. Entre com as credenciais cadastradas.");
  const username = normalizeUsername(input.username);
  const passwordHash = await hashPassword(validatePassword(input.password));
  const now = new Date().toISOString();
  const { data, error } = await getSupabase().from("users").insert({ open_id: `local:${username}`, name: input.name.trim().slice(0, 100) || "Administrador", username, password_hash: passwordHash, login_method: "local", role: "admin", active: true, last_signed_in: now, updated_at: now }).select("*").single();
  if (error?.code === "23505") throw new Error("O acesso local já foi configurado ou este usuário já existe.");
  ensureSupabaseSuccess(error);
  if (!data) throw new Error("Não foi possível criar o administrador local.");
  return mapLocalUser(data as LocalUserRow);
}

export async function authenticateLocalUser(input: { username: string; password: string }) {
  const username = normalizeUsername(input.username);
  const { data, error } = await getSupabase().from("users").select("*").eq("username", username).maybeSingle();
  ensureSupabaseSuccess(error);
  const user = data as LocalUserRow | null;
  const now = new Date();
  const locked = user?.locked_until && new Date(user.locked_until).getTime() > now.getTime();
  const passwordMatches = user?.password_hash ? await verifyPassword(input.password, user.password_hash) : false;
  if (!user || !user.active || locked || !passwordMatches) {
    if (user && user.active && !locked) {
      const attempts = Number(user.failed_login_attempts ?? 0) + 1;
      const lockedUntil = attempts >= MAX_FAILED_ATTEMPTS ? new Date(now.getTime() + LOCK_DURATION_MS).toISOString() : null;
      await getSupabase().from("users").update({ failed_login_attempts: attempts, locked_until: lockedUntil, updated_at: now.toISOString() }).eq("id", user.id);
    }
    throw new Error(locked ? "Acesso temporariamente bloqueado. Aguarde 15 minutos e tente novamente." : "Usuário ou senha inválidos.");
  }
  const { data: updated, error: updateError } = await getSupabase().from("users").update({ failed_login_attempts: 0, locked_until: null, last_signed_in: now.toISOString(), updated_at: now.toISOString() }).eq("id", user.id).select("*").single();
  ensureSupabaseSuccess(updateError);
  return mapLocalUser((updated ?? user) as LocalUserRow);
}
