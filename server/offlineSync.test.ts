import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock("./supabase", () => ({
  getSupabase: () => ({ rpc: mocks.rpc }),
  ensureSupabaseSuccess: (error: { message: string } | null) => { if (error) throw new Error(error.message); },
}));

import { finalizeSale } from "./commerce";

describe("sincronização de vendas offline", () => {
  beforeEach(() => {
    mocks.rpc.mockReset();
    mocks.rpc.mockResolvedValue({ data: { saleId: 17, total: 15, amountPaid: 20, change: 5 }, error: null });
  });

  it("reenvia o mesmo identificador de operação para que o banco reconheça uma repetição", async () => {
    const clientSaleId = "bd7ebeb7-a8fd-4493-a638-f23bb7dc078d";
    await finalizeSale({ clientSaleId, paymentMethod: "dinheiro", amountPaid: 20, items: [{ productId: 4, quantity: 2 }] });

    expect(mocks.rpc).toHaveBeenCalledWith("finalize_sale", {
      p_operation_id: clientSaleId,
      p_payment_method: "dinheiro",
      p_amount_paid: 20,
      p_items: [{ productId: 4, quantity: 2 }],
    });
  });
});
