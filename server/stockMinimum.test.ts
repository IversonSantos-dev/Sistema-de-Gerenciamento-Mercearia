import { describe, expect, it } from "vitest";
import { stockIsLow } from "../client/src/lib/commerce";

describe("estoque mínimo efetivo", () => {
  it("usa o mínimo da categoria quando ele está disponível", () => {
    expect(stockIsLow({ stockCurrent: 3, stockMinimum: 1, effectiveStockMinimum: 5 })).toBe(true);
  });

  it("mantém o mínimo individual quando o produto não usa categoria", () => {
    expect(stockIsLow({ stockCurrent: 3, stockMinimum: 2 })).toBe(false);
  });

  it("considera o produto no mínimo como alerta de reposição", () => {
    expect(stockIsLow({ stockCurrent: "2.000", stockMinimum: "2.000", effectiveStockMinimum: "2.000" })).toBe(true);
  });
});
