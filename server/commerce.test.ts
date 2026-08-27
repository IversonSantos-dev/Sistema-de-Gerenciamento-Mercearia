import { describe, expect, it } from "vitest";
import { calculateCartTotals } from "./commerce";

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
