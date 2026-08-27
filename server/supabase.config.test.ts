import { describe, expect, it } from "vitest";

describe("Supabase configuration", () => {
  it("connects to the configured Supabase REST endpoint with the server key", async () => {
    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    expect(url, "SUPABASE_URL deve estar configurada").toMatch(/^https:\/\/[a-z0-9-]+\.supabase\.co$/);
    expect(serviceKey, "SUPABASE_SERVICE_ROLE_KEY deve estar configurada").toBeTruthy();

    const response = await fetch(`${url}/rest/v1/`, {
      headers: {
        apikey: serviceKey!,
        Authorization: `Bearer ${serviceKey!}`,
      },
    });

    expect(response.ok, `Supabase respondeu com HTTP ${response.status}`).toBe(true);
  });
});
