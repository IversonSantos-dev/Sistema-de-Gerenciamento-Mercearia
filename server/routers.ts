import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, permissionProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { commerceRouter } from "./routers/commerce";
import { validSetupKey } from "./auth/setupKey";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { authenticateLocalUser, changeOwnPassword, createInitialLocalAdmin, createLocalUser, listLocalUsers, localAccountStatus, resetLocalUserPassword, updateLocalUser } from "./auth/localUsers";
import { sdk } from "./_core/sdk";
import { ENV } from "./_core/env";
import { normalizePermissions } from "./auth/permissions";

const localLoginInput = z.object({ username: z.string().trim().min(3).max(40), password: z.string().min(1).max(128) });
const roleInput = z.enum(["user", "admin"]);

async function createLocalSession(ctx: { res: { cookie: (name: string, value: string, options: object) => unknown }; req: Parameters<typeof getSessionCookieOptions>[0] }, user: { openId: string; name: string | null; username: string | null }) {
  const token = await sdk.createSessionToken(user.openId, { name: user.name || user.username || "Operador" });
  ctx.res.cookie(COOKIE_NAME, token, getSessionCookieOptions(ctx.req));
}

function badRequest(error: unknown, fallback: string): never {
  throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : fallback });
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    verifySetupKey: publicProcedure.input(z.object({ setupKey: z.string().min(1).max(256) })).mutation(({ input }) => ({ valid: validSetupKey(input.setupKey) })),
    localStatus: publicProcedure.query(async ({ ctx }) => {
      try {
        return { ...(await localAccountStatus()), ownerAssistedSetup: Boolean(ENV.ownerOpenId) && ctx.user?.openId === ENV.ownerOpenId };
      } catch (error) {
        console.error("[Auth] Banco indisponível ao verificar o acesso local:", error);
        return { configured: false, available: false, ownerAssistedSetup: false, message: "Não foi possível conectar ao banco principal. Verifique a configuração do Supabase e tente novamente." };
      }
    }),
    setupLocalAdmin: publicProcedure.input(localLoginInput.extend({ name: z.string().trim().max(100), setupKey: z.string().min(1).max(256).optional() })).mutation(async ({ input, ctx }) => {
      const ownerSession = Boolean(ENV.ownerOpenId) && ctx.user?.openId === ENV.ownerOpenId;
      if (!ownerSession && !validSetupKey(input.setupKey ?? "")) throw new TRPCError({ code: "FORBIDDEN", message: "Chave de ativação inválida." });
      try {
        const user = await createInitialLocalAdmin(input);
        await createLocalSession(ctx, user);
        return { user };
      } catch (error) { badRequest(error, "Não foi possível configurar o acesso."); }
    }),
    loginLocal: publicProcedure.input(localLoginInput).mutation(async ({ input, ctx }) => {
      try {
        const user = await authenticateLocalUser(input);
        await createLocalSession(ctx, user);
        return { user };
      } catch (error) { throw new TRPCError({ code: "UNAUTHORIZED", message: error instanceof Error ? error.message : "Não foi possível entrar." }); }
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    users: router({
      list: permissionProcedure("users", "read").query(() => listLocalUsers()),
      create: permissionProcedure("users", "edit").input(z.object({ name: z.string().trim().max(100), username: z.string().trim().min(3).max(40), password: z.string().min(1).max(128), role: roleInput })).mutation(async ({ input }) => {
        try { return await createLocalUser(input); } catch (error) { badRequest(error, "Não foi possível criar o usuário."); }
      }),
      update: permissionProcedure("users", "edit").input(z.object({ id: z.number().int().positive(), name: z.string().trim().max(100), username: z.string().trim().min(3).max(40), role: roleInput, active: z.boolean(), permissions: z.record(z.string(), z.object({ read: z.boolean(), edit: z.boolean() })).optional() })).mutation(async ({ input, ctx }) => {
        try { return await updateLocalUser({ ...input, permissions: normalizePermissions(input.permissions, input.role), actorId: ctx.user.id }); } catch (error) { badRequest(error, "Não foi possível atualizar o usuário."); }
      }),
      resetPassword: permissionProcedure("users", "edit").input(z.object({ id: z.number().int().positive(), password: z.string().min(1).max(128) })).mutation(async ({ input }) => {
        try { return await resetLocalUserPassword(input); } catch (error) { badRequest(error, "Não foi possível alterar a senha."); }
      }),
      changePassword: protectedProcedure.input(z.object({ currentPassword: z.string().min(1).max(128), newPassword: z.string().min(1).max(128) })).mutation(async ({ input, ctx }) => {
        try { return await changeOwnPassword({ id: ctx.user.id, ...input }); } catch (error) { badRequest(error, "Não foi possível alterar sua senha."); }
      }),
    }),
  }),
  commerce: commerceRouter,
});

export type AppRouter = typeof appRouter;
