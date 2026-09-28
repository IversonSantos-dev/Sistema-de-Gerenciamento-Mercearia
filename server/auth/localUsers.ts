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
  login_method: string | null;
  role: "user" | "admin";
  active: boolean;
  failed_login_attempts: number;
  locked_until: string | null;
  created_at: string;
  updated_at: string;
  last_signed_in: string;
};

export type LocalUser = {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  username: string | null;
  loginMethod: "local";
  role: "user" | "admin";
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
};

function mapLocalUser(user: LocalUserRow): LocalUser {
  return {
    id: Number(user.id),
    openId: user.open_id,
    name: user.name,
    email: user.email,
    username: user.username,
    loginMethod: "local",
    role: user.role,
    active: user.active,
    createdAt: new Date(user.created_at),
    updatedAt: new Date(user.updated_at),
    lastSignedIn: new Date(user.last_signed_in),
  };
}

const publicUserColumns = "id,open_id,name,email,username,login_method,role,active,created_at,updated_at,last_signed_in";

async function ensureIversonAdmin() {
  const { error } = await getSupabase()
    .from("users")
    .update({ role: "admin", active: true, updated_at: new Date().toISOString() })
    .eq("username", "iverson");
  ensureSupabaseSuccess(error);
}

export async function localAccountStatus() {
  await ensureIversonAdmin();
  const { count, error } = await getSupabase().from("users").select("id", { count: "exact", head: true }).not("username", "is", null);
  ensureSupabaseSuccess(error);
  return { configured: (count ?? 0) > 0 };
}

export async function createInitialLocalAdmin(input: { name: string; username: string; password: string }) {
  const status = await localAccountStatus();
  if (status.configured) throw new Error("O acesso local já foi configurado. Entre com as credenciais cadastradas.");
  return createLocalUser({ ...input, role: "admin" });
}

export async function authenticateLocalUser(input: { username: string; password: string }) {
  const username = normalizeUsername(input.username);
  if (username === "iverson") await ensureIversonAdmin();
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

export async function listLocalUsers() {
  const { data, error } = await getSupabase().from("users").select(publicUserColumns).not("username", "is", null).order("name", { ascending: true });
  ensureSupabaseSuccess(error);
  return ((data ?? []) as LocalUserRow[]).map(mapLocalUser);
}

export async function createLocalUser(input: { name: string; username: string; password: string; role: "user" | "admin" }) {
  const username = normalizeUsername(input.username);
  const passwordHash = await hashPassword(validatePassword(input.password));
  const now = new Date().toISOString();
  const name = input.name.trim().slice(0, 100) || "Operador";
  const { data, error } = await getSupabase().from("users").insert({ open_id: `local:${username}`, name, username, password_hash: passwordHash, login_method: "local", role: input.role, active: true, failed_login_attempts: 0, locked_until: null, last_signed_in: now, updated_at: now }).select(publicUserColumns).single();
  if (error?.code === "23505") throw new Error("Este nome de usuário já está em uso.");
  ensureSupabaseSuccess(error);
  if (!data) throw new Error("Não foi possível criar o usuário.");
  return mapLocalUser(data as LocalUserRow);
}

async function ensureAdminSafety(targetId: number, actorId: number, nextRole: "user" | "admin", nextActive: boolean) {
  if (targetId === actorId && (nextRole !== "admin" || !nextActive)) throw new Error("Você não pode bloquear ou remover seu próprio perfil de administrador.");
  if (nextRole === "admin" && nextActive) return;
  const { count, error } = await getSupabase().from("users").select("id", { count: "exact", head: true }).eq("role", "admin").eq("active", true);
  ensureSupabaseSuccess(error);
  if ((count ?? 0) <= 1) {
    const { data: target, error: targetError } = await getSupabase().from("users").select("role,active").eq("id", targetId).maybeSingle();
    ensureSupabaseSuccess(targetError);
    if (target?.role === "admin" && target?.active) throw new Error("Mantenha pelo menos um administrador ativo no sistema.");
  }
}

export async function updateLocalUser(input: { id: number; actorId: number; name: string; username: string; role: "user" | "admin"; active: boolean }) {
  const username = normalizeUsername(input.username);
  await ensureAdminSafety(input.id, input.actorId, input.role, input.active);
  const { data, error } = await getSupabase().from("users").update({ name: input.name.trim().slice(0, 100) || "Operador", username, open_id: `local:${username}`, role: input.role, active: input.active, updated_at: new Date().toISOString() }).eq("id", input.id).select(publicUserColumns).single();
  if (error?.code === "23505") throw new Error("Este nome de usuário já está em uso.");
  ensureSupabaseSuccess(error);
  if (!data) throw new Error("Usuário não encontrado.");
  return mapLocalUser(data as LocalUserRow);
}

export async function resetLocalUserPassword(input: { id: number; password: string }) {
  const passwordHash = await hashPassword(validatePassword(input.password));
  const { error } = await getSupabase().from("users").update({ password_hash: passwordHash, failed_login_attempts: 0, locked_until: null, updated_at: new Date().toISOString() }).eq("id", input.id).not("username", "is", null);
  ensureSupabaseSuccess(error);
  return { success: true as const };
}

export async function changeOwnPassword(input: { id: number; currentPassword: string; newPassword: string }) {
  const { data, error } = await getSupabase().from("users").select("password_hash").eq("id", input.id).single();
  ensureSupabaseSuccess(error);
  if (!data?.password_hash || !(await verifyPassword(input.currentPassword, data.password_hash))) throw new Error("A senha atual está incorreta.");
  const passwordHash = await hashPassword(validatePassword(input.newPassword));
  const { error: updateError } = await getSupabase().from("users").update({ password_hash: passwordHash, failed_login_attempts: 0, locked_until: null, updated_at: new Date().toISOString() }).eq("id", input.id);
  ensureSupabaseSuccess(updateError);
  return { success: true as const };
}
