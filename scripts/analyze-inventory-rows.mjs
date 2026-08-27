import XLSX from "xlsx";

const filePath = process.argv[2];
if (!filePath) throw new Error("Informe o caminho da planilha.");

const workbook = XLSX.readFile(filePath, { cellDates: true, cellText: true });
const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: null, raw: false });
const records = rows
  .map((row, index) => ({
    row: index + 1,
    code: row[0],
    barcode: row[2],
    name: row[6],
    unit: row[12],
    quantity: row[13],
    unitPrice: row[14],
    total: row[16],
  }))
  .filter(record =>
    typeof record.code === "string" &&
    /^\d+$/.test(record.code) &&
    typeof record.name === "string" &&
    typeof record.quantity === "string" &&
    typeof record.unitPrice === "string",
  );

const units = Object.entries(
  records.reduce((acc, record) => {
    const unit = String(record.unit ?? "(vazio)");
    acc[unit] = (acc[unit] ?? 0) + 1;
    return acc;
  }, {}),
).sort(([, a], [, b]) => b - a);

console.log(JSON.stringify({
  totalRows: rows.length,
  detectedRecords: records.length,
  units,
  firstRecords: records.slice(0, 20),
  lastRecords: records.slice(-5),
}, null, 2));
