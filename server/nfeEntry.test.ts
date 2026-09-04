import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("./supabase", () => ({ getSupabase: () => ({ rpc: mocks.rpc }), ensureSupabaseSuccess: (error: { message?: string } | null) => { if (error) throw new Error(error?.message || "Erro Supabase"); } }));

import { importNfeEntry } from "./commerce";

const base = {
  accessKey: "35260112345678000199550010000001231234567890",
  invoiceNumber: "123",
  series: "1",
  issueDate: "2026-09-04T13:00:00.000Z",
  supplierName: "Fornecedor Teste",
  supplierDocument: "12345678000199",
  totalAmount: 8.13,
  importedBy: 1,
};

describe("entrada de NF-e", () => {
  it("envia produto existente e produto novo para a transação", async () => {
    mocks.rpc.mockResolvedValueOnce({ data: { entryId: 7, createdProducts: 1, updatedProducts: 1 }, error: null });
    const result = await importNfeEntry({ ...base, items: [
      { productId: 10, productCode: "AB-01", barcode: "7891234567895", name: "Queijo", unit: "kg", quantity: 2.5, unitCost: 3.25 },
      { productId: null, productCode: "AB-02", barcode: null, name: "Produto Novo", unit: "un", quantity: 4, unitCost: 2, salePrice: 3.5 },
    ] });
    expect(result).toEqual({ entryId: 7, createdProducts: 1, updatedProducts: 1 });
    expect(mocks.rpc).toHaveBeenCalledWith("import_nfe_entry", expect.objectContaining({ p_access_key: base.accessKey, p_items: expect.arrayContaining([expect.objectContaining({ productId: 10, quantity: 2.5, unitCost: 3.25 }), expect.objectContaining({ productId: null, salePrice: 3.5 })]) }));
  });

  it("bloqueia produto novo sem preço de venda antes de chamar o banco", async () => {
    mocks.rpc.mockClear();
    await expect(importNfeEntry({ ...base, items: [{ productId: null, productCode: "AB-02", name: "Produto Novo", unit: "un", quantity: 1, unitCost: 2 }] })).rejects.toThrow("preço de venda");
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("propaga a rejeição de NF-e duplicada da transação", async () => {
    mocks.rpc.mockResolvedValueOnce({ data: null, error: { message: "Esta NF-e já foi importada" } });
    await expect(importNfeEntry({ ...base, items: [{ productId: 10, productCode: "AB-01", name: "Queijo", unit: "kg", quantity: 1, unitCost: 3.25 }] })).rejects.toThrow("Esta NF-e já foi importada");
  });
});
