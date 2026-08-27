import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { parseInventoryNumber, parseInventoryWorkbook } from "../shared/inventoryParser";

describe("inventory parser", () => {
  it("preserva valores com ponto decimal e números no formato brasileiro", () => {
    expect(parseInventoryNumber("32.5")).toBe(32.5);
    expect(parseInventoryNumber("1.234,56")).toBe(1234.56);
  });

  it("mapeia o formato de relatório de inventário para produtos importáveis", () => {
    const rows = [
      ["LIVRO DE REGISTRO DE INVENTÁRIO - MODELO P7"],
      ["Código", null, "Barras", null, "NCM", null, "Discriminação", null, null, null, null, null, "Unid", "Qtd", "Unitário", null, "Total"],
      ["3923", null, "7909937375324", null, "64022000", null, "12303 - RIDER FEEL DEDO AD.", null, null, null, null, null, "PARES", "12.000", "32.5", null, "390.00"],
    ];
    const sheet = XLSX.utils.aoa_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Sheet");

    expect(parseInventoryWorkbook(workbook)).toEqual({
      sheetName: "Sheet",
      errors: [],
      warnings: [],
      items: [{ rowNumber: 3, inventoryCode: "3923", barcode: "7909937375324", name: "RIDER FEEL DEDO AD.", unit: "un", stockCurrent: 12, unitPrice: 32.5 }],
    });
  });

  it("mantém o produto importável quando a planilha contém um código de barras fora do padrão", () => {
    const rows = [["Código", null, "Barras", null, null, null, "Discriminação", null, null, null, null, null, "Unid", "Qtd", "Unitário"], ["22", null, "ABC-22", null, null, null, "Produto sem EAN", null, null, null, null, null, "UN", "2", "5.5"]];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), "Sheet");

    const result = parseInventoryWorkbook(workbook);
    expect(result.errors).toEqual([]);
    expect(result.items[0]).toMatchObject({ inventoryCode: "22", barcode: null, unitPrice: 5.5 });
    expect(result.warnings).toHaveLength(1);
  });
});
