import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import { COOKIE_NAME } from "../shared/const";

const mocks = vi.hoisted(() => ({
  authenticateLocalUser: vi.fn(async () => ({ id: 7, openId: "local:caixa", name: "Caixa", username: "caixa", loginMethod: "local", role: "admin" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() })),
  localAccountStatus: vi.fn(async () => ({ configured: true })),
  createInitialLocalAdmin: vi.fn(async () => ({ id: 8, openId: "local:gestor", name: "Gestor", username: "gestor", loginMethod: "local", role: "admin" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() })),
}));

vi.mock("./auth/localUsers", () => ({
  authenticateLocalUser: mocks.authenticateLocalUser,
  createInitialLocalAdmin: mocks.createInitialLocalAdmin,
  localAccountStatus: mocks.localAccountStatus,
}));

import { appRouter } from "./routers";

describe("auth.loginLocal", () => {
  it("cria uma sessão protegida após validar a credencial local", async () => {
    const cookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];
    const ctx = { user: null, req: { protocol: "https", headers: {} }, res: { cookie: (name: string, value: string, options: Record<string, unknown>) => cookies.push({ name, value, options }) } } as unknown as TrpcContext;

    const result = await appRouter.createCaller(ctx).auth.loginLocal({ username: "caixa", password: "SenhaOperacao#2026" });

    expect(mocks.authenticateLocalUser).toHaveBeenCalledWith({ username: "caixa", password: "SenhaOperacao#2026" });
    expect(result.user.openId).toBe("local:caixa");
    expect(cookies).toHaveLength(1);
    expect(cookies[0]).toMatchObject({ name: COOKIE_NAME, options: { httpOnly: true, path: "/" } });
    expect(cookies[0]?.value).toMatch(/^eyJ/);
  });

  it("recusa uma credencial inválida sem criar sessão", async () => {
    mocks.authenticateLocalUser.mockRejectedValueOnce(new Error("Usuário ou senha inválidos."));
    const cookies: unknown[] = [];
    const ctx = { user: null, req: { protocol: "https", headers: {} }, res: { cookie: (...args: unknown[]) => cookies.push(args) } } as unknown as TrpcContext;

    await expect(appRouter.createCaller(ctx).auth.loginLocal({ username: "caixa", password: "SenhaIncorreta#2026" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(cookies).toHaveLength(0);
  });

  it("mantém os procedimentos comerciais bloqueados sem sessão", async () => {
    const ctx = { user: null, req: { protocol: "https", headers: {} }, res: {} } as unknown as TrpcContext;

    await expect(appRouter.createCaller(ctx).commerce.products.lowStock()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("informa a configuração assistida somente para a sessão do proprietário", async () => {
    const ownerOpenId = process.env.OWNER_OPEN_ID!;
    mocks.localAccountStatus.mockResolvedValue({ configured: false });
    const ownerCtx = { user: { id: 1, openId: ownerOpenId, name: "Proprietário", email: null, loginMethod: "manus", role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: {}, res: {} } as unknown as TrpcContext;
    const otherAdminCtx = { user: { id: 2, openId: "outro-admin", name: "Administrador", email: null, loginMethod: "local", role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: {}, res: {} } as unknown as TrpcContext;

    await expect(appRouter.createCaller(ownerCtx).auth.localStatus()).resolves.toEqual({ configured: false, ownerAssistedSetup: true });
    await expect(appRouter.createCaller(otherAdminCtx).auth.localStatus()).resolves.toEqual({ configured: false, ownerAssistedSetup: false });
  });

  it("permite ao proprietário criar o acesso inicial sem chave de ativação", async () => {
    const ctx = { user: { id: 1, openId: process.env.OWNER_OPEN_ID!, name: "Proprietário", email: null, loginMethod: "manus", role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { protocol: "https", headers: {} }, res: { cookie: vi.fn() } } as unknown as TrpcContext;

    await expect(appRouter.createCaller(ctx).auth.setupLocalAdmin({ name: "Gestor", username: "gestor", password: "SenhaOperacao#2026" })).resolves.toMatchObject({ user: { openId: "local:gestor" } });
    expect(mocks.createInitialLocalAdmin).toHaveBeenCalledWith(expect.objectContaining({ username: "gestor" }));
  });

  it("exige chave de ativação de outro administrador antes de criar o acesso", async () => {
    mocks.createInitialLocalAdmin.mockClear();
    const ctx = { user: { id: 2, openId: "outro-admin", name: "Administrador", email: null, loginMethod: "local", role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: {}, res: {} } as unknown as TrpcContext;

    await expect(appRouter.createCaller(ctx).auth.setupLocalAdmin({ name: "Gestor", username: "gestor", password: "SenhaOperacao#2026" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(mocks.createInitialLocalAdmin).not.toHaveBeenCalled();
  });
});
