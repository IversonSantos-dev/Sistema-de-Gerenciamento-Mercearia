import XLSX from "xlsx";
import { parseInventoryWorkbook } from "../shared/inventoryParser";

const filePath = process.argv[2];
if (!filePath) throw new Error("Informe o arquivo XLS ou XLSX a ser validado.");

const workbook = XLSX.readFile(filePath, { cellText: true, cellDates: false });
const parsed = parseInventoryWorkbook(workbook);
const errorSummary = parsed.errors.reduce<Record<string, number>>((summary, error) => {
  summary[error.message] = (summary[error.message] ?? 0) + 1;
  return summary;
}, {});
const sourceRows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[parsed.sheetName], { header: 1, defval: null, raw: false });
const rawErrors = parsed.errors.slice(0, 10).map(error => ({
  ...error,
  source: sourceRows[error.rowNumber - 1],
}));

console.log(JSON.stringify({
  sheetName: parsed.sheetName,
  validProducts: parsed.items.length,
  errors: parsed.errors.length,
  warnings: parsed.warnings.length,
  errorSummary,
  firstProducts: parsed.items.slice(0, 3),
  firstErrors: parsed.errors.slice(0, 5),
  rawErrors,
}, null, 2));
