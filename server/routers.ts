import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { commerceRouter } from "./routers/commerce";
import { validSetupKey } from "./auth/setupKey";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { authenticateLocalUser, createInitialLocalAdmin, localAccountStatus } from "./auth/localUsers";
import { sdk } from "./_core/sdk";
import { ENV } from "./_core/env";

const localLoginInput = z.object({ username: z.string().trim().min(3).max(40), password: z.string().min(1).max(128) });

async function createLocalSession(ctx: { res: { cookie: (name: string, value: string, options: object) => unknown; }; req: Parameters<typeof getSessionCookieOptions>[0]; }, user: { openId: string; name: string | null; username: string | null }) {
  const token = await sdk.createSessionToken(user.openId, { name: user.name || user.username || "Operador" });
  ctx.res.cookie(COOKIE_NAME, token, getSessionCookieOptions(ctx.req));
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    verifySetupKey: publicProcedure.input(z.object({ setupKey: z.string().min(1).max(256) })).mutation(({ input }) => ({ valid: validSetupKey(input.setupKey) })),
    localStatus: publicProcedure.query(async ({ ctx }) => ({ ...(await localAccountStatus()), ownerAssistedSetup: Boolean(ENV.ownerOpenId) && ctx.user?.openId === ENV.ownerOpenId })),
    setupLocalAdmin: publicProcedure.input(localLoginInput.extend({ name: z.string().trim().max(100), setupKey: z.string().min(1).max(256).optional() })).mutation(async ({ input, ctx }) => {
      const ownerSession = Boolean(ENV.ownerOpenId) && ctx.user?.openId === ENV.ownerOpenId;
      if (!ownerSession && !validSetupKey(input.setupKey ?? "")) throw new TRPCError({ code: "FORBIDDEN", message: "Chave de ativação inválida." });
      try {
        const user = await createInitialLocalAdmin(input);
        await createLocalSession(ctx, user);
        return { user };
      } catch (error) {
        throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Não foi possível configurar o acesso." });
      }
    }),
    loginLocal: publicProcedure.input(localLoginInput).mutation(async ({ input, ctx }) => {
      try {
        const user = await authenticateLocalUser(input);
        await createLocalSession(ctx, user);
        return { user };
      } catch (error) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: error instanceof Error ? error.message : "Não foi possível entrar." });
      }
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  commerce: commerceRouter,
});

export type AppRouter = typeof appRouter;
