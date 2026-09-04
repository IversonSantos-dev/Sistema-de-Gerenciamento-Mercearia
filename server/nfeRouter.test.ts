import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ importNfeEntry: vi.fn() }));
vi.mock("./commerce", async importOriginal => ({ ...(await importOriginal<typeof import("./commerce")>()), importNfeEntry: mocks.importNfeEntry }));

import { commerceRouter } from "./routers/commerce";

const caller = () => commerceRouter.createCaller({
  user: { id: 42, openId: "operator-42", name: "Operador", username: "operador", role: "admin" },
  req: {} as never,
  res: {} as never,
});

const validInput = {
  accessKey: "35260112345678000199550010000001231234567890",
  invoiceNumber: "123",
  series: "1",
  issueDate: "2026-09-04T13:00:00.000Z",
  supplierName: "Fornecedor Teste",
  supplierDocument: "12345678000199",
  totalAmount: 8.13,
  items: [{ productId: 10, productCode: "AB-01", barcode: "7891234567895", name: "Queijo", unit: "kg" as const, quantity: 2.5, unitCost: 3.25 }],
};

describe("commerce.nfe.import", () => {
  it("chama a entrada protegida com o usuário da sessão", async () => {
    mocks.importNfeEntry.mockResolvedValueOnce({ entryId: 11, createdProducts: 0, updatedProducts: 1 });
    const result = await caller().nfe.import(validInput);
    expect(result.entryId).toBe(11);
    expect(mocks.importNfeEntry).toHaveBeenCalledWith(expect.objectContaining({ importedBy: 42, accessKey: validInput.accessKey }));
  });

  it("converte NF-e duplicada em conflito compreensível", async () => {
    mocks.importNfeEntry.mockRejectedValueOnce(new Error("Esta NF-e já foi importada"));
    await expect(caller().nfe.import(validInput)).rejects.toMatchObject({ code: "CONFLICT", message: "Esta NF-e já foi importada" });
  });

  it("recusa produto novo sem preço de venda antes do backend", async () => {
    mocks.importNfeEntry.mockClear();
    await expect(caller().nfe.import({ ...validInput, items: [{ ...validInput.items[0], productId: null }] })).rejects.toThrow();
    expect(mocks.importNfeEntry).not.toHaveBeenCalled();
  });
});
