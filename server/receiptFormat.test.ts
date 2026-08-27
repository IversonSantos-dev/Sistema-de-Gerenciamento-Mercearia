import { describe, expect, it } from "vitest";
import { buildClosingReceiptDifference, buildSaleReceiptPayment } from "../shared/receiptFormat";

describe("dados para comprovante térmico", () => {
  it("monta o total, pagamento e troco de uma venda", () => {
    const result = buildSaleReceiptPayment("dinheiro", 18.4, 20, 1.6);

    expect(result).toEqual({ paymentMethod: "DINHEIRO", total: 18.4, amountPaid: 20, change: 1.6, showChange: true });
  });

  it("omite o troco quando não há valor a devolver", () => {
    expect(buildSaleReceiptPayment("pix", 8.5, 8.5, 0).showChange).toBe(false);
  });

  it("calcula a diferença exibida no fechamento", () => {
    expect(buildClosingReceiptDifference(45.9, 43.4)).toBe(-2.5);
    expect(buildClosingReceiptDifference(12.1, 12.2)).toBe(0.1);
  });
});
