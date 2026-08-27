import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ existingPlu: { id: 8 } as { id: number } | null, update: vi.fn() }));

vi.mock("./supabase", () => ({
  getSupabase: () => ({
    from: () => ({
      select: (columns: string) => {
        if (columns === "id, unit") return { eq: () => ({ single: async () => ({ data: { id: 7, unit: "kg" }, error: null }) }) };
        return { eq: () => ({ neq: () => ({ maybeSingle: async () => ({ data: state.existingPlu, error: null }) }) }) };
      },
      update: state.update.mockImplementation(() => ({ eq: async () => ({ error: null }) })),
    }),
  }),
  ensureSupabaseSuccess: (error: unknown) => { if (error) throw error; },
}));

import { updateProductScalePlu } from "./commerce";

describe("updateProductScalePlu", () => {
  beforeEach(() => {
    state.existingPlu = { id: 8 };
    state.update.mockClear();
  });

  it("não atualiza o produto quando o PLU já está atribuído", async () => {
    await expect(updateProductScalePlu({ productId: 7, scalePlu: 12345 })).rejects.toThrow("Este PLU já está em uso por outro produto.");
    expect(state.update).not.toHaveBeenCalled();
  });

  it("atualiza e remove o PLU de um produto por peso quando não há conflito", async () => {
    state.existingPlu = null;

    await expect(updateProductScalePlu({ productId: 7, scalePlu: 12345 })).resolves.toEqual({ productId: 7, scalePlu: 12345 });
    expect(state.update).toHaveBeenLastCalledWith(expect.objectContaining({ scale_plu: 12345 }));
    await expect(updateProductScalePlu({ productId: 7, scalePlu: null })).resolves.toEqual({ productId: 7, scalePlu: null });
    expect(state.update).toHaveBeenLastCalledWith(expect.objectContaining({ scale_plu: null }));
  });
});
