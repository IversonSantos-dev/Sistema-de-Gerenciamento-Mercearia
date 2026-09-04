import { describe, expect, it } from "vitest";
import { parseNfeXml } from "../shared/nfeParser";

const xml = `<?xml version="1.0" encoding="UTF-8"?><nfeProc><NFe><infNFe Id="NFe35260112345678000199550010000001231234567890"><ide><nNF>123</nNF><serie>1</serie><dhEmi>2026-09-04T10:00:00-03:00</dhEmi></ide><emit><CNPJ>12345678000199</CNPJ><xNome>Fornecedor Teste</xNome></emit><det nItem="1"><prod><cProd>AB-01</cProd><cEAN>7891234567895</cEAN><xProd>Queijo Minas</xProd><uCom>KG</uCom><qCom>2.500</qCom><vUnCom>3.25</vUnCom><vProd>8.13</vProd></prod></det><total><ICMSTot><vNF>8.13</vNF></ICMSTot></total></infNFe></NFe></nfeProc>`;

describe("NF-e XML parser", () => {
  it("normaliza cabeçalho, item por peso e valores decimais", () => {
    const result = parseNfeXml(xml);
    expect(result.accessKey).toHaveLength(44);
    expect(result.number).toBe("123");
    expect(result.supplierName).toBe("Fornecedor Teste");
    expect(result.totalAmount).toBe(8.13);
    expect(result.items[0]).toMatchObject({ productCode: "AB-01", barcode: "7891234567895", unit: "kg", quantity: 2.5, unitCost: 3.25, lineTotal: 8.13 });
    expect(result.errors).toEqual([]);
  });

  it("retorna aviso para item sem GTIN válido", () => {
    const result = parseNfeXml(xml.replace("7891234567895", "SEM GTIN"));
    expect(result.items).toHaveLength(1);
    expect(result.items[0].barcode).toBeNull();
    expect(result.warnings.some(issue => issue.message.includes("GTIN"))).toBe(true);
  });

  it("rejeita conteúdo que não é uma NF-e", () => {
    expect(() => parseNfeXml("<documento />")).toThrow("não parece ser um XML de NF-e válido");
  });
});
