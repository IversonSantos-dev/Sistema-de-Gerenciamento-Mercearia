import { beforeEach, describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  productRows: [] as Array<Record<string, unknown>>,
  categoryRows: [] as Array<Record<string, unknown>>,
  rpc: vi.fn(),
  productEq: vi.fn(),
}));

vi.mock("./supabase", () => {
  const productQuery = {
    select: vi.fn(() => productQuery),
    order: vi.fn(() => productQuery),
    or: vi.fn(() => productQuery),
    eq: mocked.productEq.mockImplementation(() => productQuery),
    then: (resolve: (value: { data: Array<Record<string, unknown>>; error: null }) => unknown) => Promise.resolve({ data: mocked.productRows, error: null }).then(resolve),
  };
  const categoryQuery = {
    select: vi.fn(() => categoryQuery),
    order: vi.fn(() => categoryQuery),
    then: (resolve: (value: { data: Array<Record<string, unknown>>; error: null }) => unknown) => Promise.resolve({ data: mocked.categoryRows, error: null }).then(resolve),
  };
  return {
    getSupabase: () => ({
      from: (table: string) => table === "products" ? { select: () => productQuery } : { select: () => categoryQuery },
      rpc: mocked.rpc,
    }),
    ensureSupabaseSuccess: (error: unknown) => { if (error) throw error; },
  };
});

import { adjustProductStock, listProducts } from "./commerce";

describe("contratos de catálogo e ajuste", () => {
  beforeEach(() => {
    mocked.productRows = [{ id: 7, name: "Arroz", description: null, cost_price: 4, sale_price: 6, unit: "un", stock_current: 10, stock_minimum: 2, category_id: 3, use_category_minimum: false, inventory_code: null, barcode: null, active: true, created_at: "2026-08-27T00:00:00Z", updated_at: "2026-08-27T00:00:00Z" }];
    mocked.categoryRows = [];
    mocked.productEq.mockClear();
    mocked.rpc.mockReset();
  });

  it("restringe a consulta do catálogo à categoria selecionada", async () => {
    const products = await listProducts(undefined, 3);

    expect(mocked.productEq).toHaveBeenCalledWith("category_id", 3);
    expect(products).toHaveLength(1);
  });

  it("envia o ajuste completo ao procedimento transacional e retorna a movimentação", async () => {
    mocked.rpc.mockResolvedValue({ data: { productId: 7, previousQuantity: 10, resultingQuantity: 8.5, adjustmentQuantity: -1.5 }, error: null });

    const result = await adjustProductStock({ productId: 7, newQuantity: 8.5, reason: "Conferência", adjustedBy: 22 });

    expect(mocked.rpc).toHaveBeenCalledWith("adjust_product_stock", { p_product_id: 7, p_new_quantity: 8.5, p_reason: "Conferência", p_user_id: 22 });
    expect(result).toEqual({ productId: 7, previousQuantity: 10, resultingQuantity: 8.5, adjustmentQuantity: -1.5 });
  });
});
