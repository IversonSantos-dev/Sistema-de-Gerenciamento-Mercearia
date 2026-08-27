import { describe, expect, it } from "vitest";
import { calculateCartTotals, calculateCashDifferences, calculateStockAdjustment } from "./commerce";
import { buildCatalogQueryInput, stepStockQuantity } from "../client/src/lib/catalogControls";

describe("calculateCartTotals", () => {
  it("soma itens unitários e fracionados com precisão monetária", () => {
    const result = calculateCartTotals([
      { unitPrice: 7.5, quantity: 2 },
      { unitPrice: 12.99, quantity: 0.35 },
    ]);

    expect(result.total).toBe(19.55);
    expect(result.amountDue).toBe(19.55);
    expect(result.change).toBe(0);
  });

  it("calcula o troco quando o pagamento em dinheiro excede o total", () => {
    const result = calculateCartTotals([{ unitPrice: 14.9, quantity: 2 }], 50);

    expect(result.total).toBe(29.8);
    expect(result.amountPaid).toBe(50);
    expect(result.change).toBe(20.2);
    expect(result.amountDue).toBe(0);
  });

  it("informa o valor restante sem retornar troco quando o pagamento é insuficiente", () => {
    const result = calculateCartTotals([{ unitPrice: 8.75, quantity: 3 }], 20);

    expect(result.total).toBe(26.25);
    expect(result.amountDue).toBe(6.25);
    expect(result.change).toBe(0);
  });
});

describe("calculateCashDifferences", () => {
  it("calcula as diferenças por forma de pagamento e o resultado geral", () => {
    const result = calculateCashDifferences(
      { closureDate: "2026-08-27", salesCount: 12, cash: 100, debit: 50, credit: 30, pix: 20, total: 200 },
      { countedCash: 95, countedDebit: 50, countedCredit: 35, countedPix: 20 },
    );

    expect(result).toEqual({ cash: -5, debit: 0, credit: 5, pix: 0, total: 0 });
  });

  it("preserva precisão monetária quando o fechamento possui centavos", () => {
    const result = calculateCashDifferences(
      { closureDate: "2026-08-27", salesCount: 1, cash: 19.9, debit: 0, credit: 0, pix: 0, total: 19.9 },
      { countedCash: 20, countedDebit: 0, countedCredit: 0, countedPix: 0 },
    );

    expect(result.cash).toBe(0.1);
    expect(result.total).toBe(0.1);
  });
});

describe("calculateStockAdjustment", () => {
  it("informa a entrada ao aumentar o estoque de um produto unitário", () => {
    expect(calculateStockAdjustment(8, 15)).toEqual({ previousQuantity: 8, resultingQuantity: 15, adjustmentQuantity: 7 });
  });

  it("preserva três casas decimais no ajuste de mercadoria vendida por peso", () => {
    expect(calculateStockAdjustment(2.125, 1.42)).toEqual({ previousQuantity: 2.125, resultingQuantity: 1.42, adjustmentQuantity: -0.705 });
  });
});

describe("catalog controls", () => {
  it("envia o filtro de categoria selecionado junto à busca textual", () => {
    expect(buildCatalogQueryInput("  arroz  ", "12")).toEqual({ search: "arroz", categoryId: 12 });
    expect(buildCatalogQueryInput("", "all")).toEqual({ search: undefined, categoryId: undefined });
  });

  it("acumula os toques no ajuste rápido e impede estoque negativo", () => {
    expect(stepStockQuantity("7", 5, 1)).toBe(8);
    expect(stepStockQuantity("8", 5, 1)).toBe(9);
    expect(stepStockQuantity("0", 5, -1)).toBe(0);
    expect(stepStockQuantity("", 2.125, -0.001)).toBe(2.124);
  });
});
