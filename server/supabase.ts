import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

async function resilientSupabaseFetch(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, init);
  if (response.status !== 401) return response;
  const body = await response.clone().text().catch(() => "");
  if (!body.includes("JWT issued at future")) return response;
  await new Promise(resolve => setTimeout(resolve, 1_500));
  return fetch(input, init);
}

export function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) throw new Error("A conexão com o banco principal não está configurada.");
  if (!client) {
    client = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { fetch: resilientSupabaseFetch },
    });
  }
  return client;
}

export function ensureSupabaseSuccess(error: { message: string; code?: string } | null) {
  if (error) throw new Error(error.message || error.code || "Não foi possível concluir a operação no banco principal.");
}
