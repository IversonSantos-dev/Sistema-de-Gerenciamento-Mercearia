import { describe, expect, it } from "vitest";
import { applyStockReduction } from "../client/src/lib/offlineStore";

describe("estoque local offline", () => {
  it("reduz o catálogo local e agrupa quantidades repetidas da mesma venda", () => {
    const catalog = [{ id: 1, name: "Arroz", description: null, costPrice: 4, salePrice: 6, unit: "un" as const, stockCurrent: 8, stockMinimum: 2, barcode: "7891234567890", active: true }];

    const updated = applyStockReduction(catalog, [{ productId: 1, quantity: 2 }, { productId: 1, quantity: 3 }]);

    expect(updated[0]?.stockCurrent).toBe(3);
  });

  it("nunca registra estoque local negativo", () => {
    const catalog = [{ id: 1, name: "Feijão", description: null, costPrice: 5, salePrice: 8, unit: "un" as const, stockCurrent: 1, stockMinimum: 0, barcode: null, active: true }];

    expect(applyStockReduction(catalog, [{ productId: 1, quantity: 2 }])[0]?.stockCurrent).toBe(0);
  });
});
