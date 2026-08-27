import * as XLSX from "xlsx";

export type InventoryImportRow = {
  rowNumber: number;
  inventoryCode: string;
  barcode: string | null;
  name: string;
  unit: "un" | "kg";
  stockCurrent: number;
  unitPrice: number;
};

export type InventoryParseResult = {
  sheetName: string;
  items: InventoryImportRow[];
  errors: Array<{ rowNumber: number; message: string }>;
  warnings: Array<{ rowNumber: number; message: string }>;
};

function cellText(value: unknown) {
  return String(value ?? "").trim();
}

export function parseInventoryNumber(value: unknown) {
  const raw = cellText(value).replace(/\s/g, "");
  const normalized = raw.includes(",") ? raw.replace(/\./g, "").replace(",", ".") : raw;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : Number.NaN;
}

function productName(value: unknown) {
  return cellText(value).replace(/^\d+\s*-\s*/, "").trim();
}

function normalizeUnit(value: unknown): "un" | "kg" {
  const unit = cellText(value).toLowerCase();
  return /^(kg|quilo|quilos|kilograma|kilogramas)$/.test(unit) ? "kg" : "un";
}

export function parseInventoryWorkbook(workbook: XLSX.WorkBook): InventoryParseResult {
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error("A planilha não possui nenhuma aba.");
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null, raw: false });
  const headerIndex = rows.findIndex(row => cellText(row[0]).toLowerCase() === "código" && row.some(value => cellText(value).toLowerCase() === "discriminação"));
  if (headerIndex === -1) throw new Error("Não encontramos o cabeçalho de inventário esperado. Use uma planilha com as colunas Código, Barras, Discriminação, Unid, Qtd e Unitário.");

  const items: InventoryImportRow[] = [];
  const errors: Array<{ rowNumber: number; message: string }> = [];
  const warnings: Array<{ rowNumber: number; message: string }> = [];
  const codes = new Set<string>();
  const barcodes = new Set<string>();

  rows.slice(headerIndex + 1).forEach((row, offset) => {
    const rowNumber = headerIndex + offset + 2;
    const inventoryCode = cellText(row[0]);
    const rawBarcode = cellText(row[2]).replace(/\D/g, "");
    const name = productName(row[6]);
    const hasProductCells = [rawBarcode, name, cellText(row[12]), cellText(row[13]), cellText(row[14])].some(Boolean);
    if (!hasProductCells) return;
    const quantity = parseInventoryNumber(row[13]);
    const unitPrice = parseInventoryNumber(row[14]);
    if (!inventoryCode || !name || !Number.isFinite(quantity) || quantity < 0 || !Number.isFinite(unitPrice) || unitPrice <= 0) {
      errors.push({ rowNumber, message: "Informe código, descrição, quantidade não negativa e preço unitário maior que zero." });
      return;
    }
    const barcode = rawBarcode && /^\d{12,13}$/.test(rawBarcode) ? rawBarcode : null;
    if (rawBarcode && !barcode) warnings.push({ rowNumber, message: "O código de barras não possui 12 ou 13 dígitos e será ignorado." });
    if (codes.has(inventoryCode)) {
      errors.push({ rowNumber, message: `O código interno ${inventoryCode} está duplicado na planilha.` });
      return;
    }
    if (barcode && barcodes.has(barcode)) {
      errors.push({ rowNumber, message: `O código de barras ${barcode} está duplicado na planilha.` });
      return;
    }
    codes.add(inventoryCode);
    if (barcode) barcodes.add(barcode);
    items.push({ rowNumber, inventoryCode, barcode, name, unit: normalizeUnit(row[12]), stockCurrent: quantity, unitPrice });
  });

  return { sheetName, items, errors, warnings };
}
