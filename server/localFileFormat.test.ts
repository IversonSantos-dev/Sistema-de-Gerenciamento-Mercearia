import { describe, expect, it } from "vitest";
import { parseLocalPdvData } from "../client/src/lib/offlineStore";

describe("formato do arquivo local do caixa", () => {
  it("restaura catálogo e vendas pendentes do arquivo pdv-local.json", () => {
    const data = parseLocalPdvData(JSON.stringify({
      version: 1,
      updatedAt: 1_700_000_000_000,
      products: [{ id: 1, name: "Café", description: null, costPrice: 10, salePrice: 15, unit: "un", stockCurrent: 4, stockMinimum: 1, barcode: "7891234567890", active: true }],
      pendingSales: [{ clientSaleId: "f92ef7d0-e39a-4988-9d4a-3d7c23d9333b", items: [{ productId: 1, quantity: 1 }], paymentMethod: "pix", amountPaid: 15, queuedAt: 1_700_000_000_000 }],
    }));

    expect(data.products).toHaveLength(1);
    expect(data.pendingSales[0]?.clientSaleId).toBe("f92ef7d0-e39a-4988-9d4a-3d7c23d9333b");
  });

  it("rejeita um arquivo que não possui a estrutura esperada", () => {
    expect(() => parseLocalPdvData('{"version":2,"products":[]}')).toThrow("não possui o formato esperado");
  });
});
