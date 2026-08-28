import { describe, expect, it } from "vitest";
import { hashPassword, normalizeUsername, validatePassword, verifyPassword } from "./localCredentials";

describe("credenciais locais", () => {
  it("normaliza o usuário e confirma somente a senha que originou o hash", async () => {
    const password = "SenhaOperacao#2026";
    const hash = await hashPassword(password);

    expect(normalizeUsername("  Caixa.Principal  ")).toBe("caixa.principal");
    await expect(verifyPassword(password, hash)).resolves.toBe(true);
    await expect(verifyPassword("SenhaErrada#2026", hash)).resolves.toBe(false);
  });

  it("rejeita usuários e senhas fora das regras de segurança", () => {
    expect(() => normalizeUsername("caixa operador")).toThrow("O usuário deve ter");
    expect(() => validatePassword("curta123")).toThrow("A senha deve ter entre 12 e 128 caracteres");
  });
});
