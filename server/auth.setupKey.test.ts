import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function publicContext() {
  return { user: null, req: { protocol: "https", headers: {} }, res: {} } as TrpcContext;
}

describe("auth.verifySetupKey", () => {
  it("valida a chave de ativação configurada por meio do roteador", async () => {
    const configuredKey = process.env.PDV_SETUP_KEY;
    expect(configuredKey).toBeTruthy();
    const caller = appRouter.createCaller(publicContext());
    await expect(caller.auth.verifySetupKey({ setupKey: configuredKey! })).resolves.toEqual({ valid: true });
    await expect(caller.auth.verifySetupKey({ setupKey: `${configuredKey}-invalida` })).resolves.toEqual({ valid: false });
  });
});
