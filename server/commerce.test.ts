import { describe, expect, it } from "vitest";
import { calculateCartTotals, calculateCashDifferences } from "./commerce";

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
