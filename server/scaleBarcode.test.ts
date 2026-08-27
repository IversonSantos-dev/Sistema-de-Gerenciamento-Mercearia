import { calculateGs1CheckDigit, decodeScalePriceBarcode, deriveWeightFromScaleTotal, validateScaleBarcodeConfig } from "../shared/scaleBarcode";
import { describe, expect, it } from "vitest";

const preparedConfig = {
  enabled: true,
  prefix: "20",
  pluDigits: 5,
  amountDigits: 5,
  amountKind: "total_price" as const,
  includesCheckDigit: true,
};

function barcode(payload: string) {
  return `${payload}${calculateGs1CheckDigit(payload)}`;
}

describe("etiqueta de preço de balança", () => {
  it("decodifica PLU e preço total em centavos com dígito verificador", () => {
    const code = barcode("201234500999");

    expect(decodeScalePriceBarcode(code, preparedConfig)).toEqual({ plu: 12345, totalPrice: 9.99, rawCode: code });
  });

  it("mantém o código disponível para a leitura EAN/UPC quando a etiqueta estiver desativada ou for inválida", () => {
    expect(decodeScalePriceBarcode(barcode("201234500999"), { ...preparedConfig, enabled: false })).toBeNull();
    expect(decodeScalePriceBarcode("2012345009990", preparedConfig)).toBeNull();
  });

  it("aceita somente formatos completos de treze dígitos", () => {
    expect(validateScaleBarcodeConfig(preparedConfig)).toBe(true);
    expect(validateScaleBarcodeConfig({ ...preparedConfig, amountDigits: 4 })).toBe(false);
  });

  it("deriva um peso de três casas somente quando o total é compatível com o preço/kg", () => {
    expect(deriveWeightFromScaleTotal(10, 12.34)).toBe(1.234);
    expect(deriveWeightFromScaleTotal(100, 0.01)).toBeNull();
  });
});
