import XLSX from "xlsx";

const filePath = process.argv[2];

if (!filePath) {
  throw new Error("Informe o caminho da planilha a ser inspecionada.");
}

const workbook = XLSX.readFile(filePath, { cellDates: true, cellNF: false, cellText: true });
const report = workbook.SheetNames.map(sheetName => {
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: false });
  return {
    sheetName,
    rowCount: rows.length,
    samples: rows.slice(0, 12),
  };
});

console.log(JSON.stringify(report, null, 2));
