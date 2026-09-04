export type NfeParseIssue = { lineNumber: number; message: string };

export type NfeParsedItem = {
  lineNumber: number;
  productCode: string;
  barcode: string | null;
  name: string;
  unit: "un" | "kg";
  quantity: number;
  unitCost: number;
  lineTotal: number;
};

export type NfeParseResult = {
  accessKey: string;
  number: string;
  series: string;
  issueDate: string | null;
  supplierName: string;
  supplierDocument: string | null;
  totalAmount: number;
  items: NfeParsedItem[];
  errors: NfeParseIssue[];
  warnings: NfeParseIssue[];
};

const decodeXml = (value: string) => value.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&").trim();
const tagPattern = (tag: string) => new RegExp(`<(?:(?:[A-Za-z_][\\w.-]*):)?${tag}\\b[^>]*>([\\s\\S]*?)<\\/(?:(?:[A-Za-z_][\\w.-]*):)?${tag}>`, "i");
const valueOf = (scope: string, tag: string) => decodeXml(scope.match(tagPattern(tag))?.[1] ?? "");
const attrOf = (scope: string, tag: string, attr: string) => decodeXml(scope.match(new RegExp(`<(?:(?:[A-Za-z_][\\w.-]*):)?${tag}\\b[^>]*\\b${attr}=["']([^"']+)["']`, "i"))?.[1] ?? "");
const numberOf = (value: string) => {
  const trimmed = value.trim();
  const normalized = trimmed.includes(",") ? trimmed.replace(/\./g, "").replace(",", ".") : trimmed;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};
const money = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const quantity = (value: number) => Math.round((value + Number.EPSILON) * 1000) / 1000;

export function parseNfeXml(xml: string): NfeParseResult {
  if (!xml.trim() || !/<(?:[A-Za-z_][\w.-]*:)?(?:nfeProc|NFe)\b/i.test(xml)) throw new Error("O arquivo não parece ser um XML de NF-e válido.");
  const infNfe = xml.match(/<(?:(?:[A-Za-z_][\w.-]*):)?infNFe\b[^>]*>([\s\S]*?)<\/(?:(?:[A-Za-z_][\w.-]*):)?infNFe>/i)?.[1] ?? xml;
  const accessKey = (attrOf(xml, "infNFe", "Id").replace(/^NFe/i, "") || valueOf(infNfe, "chNFe")).replace(/\D/g, "");
  const errors: NfeParseIssue[] = [];
  const warnings: NfeParseIssue[] = [];
  if (!/^\d{44}$/.test(accessKey)) errors.push({ lineNumber: 0, message: "A chave de acesso da NF-e não foi encontrada ou não possui 44 dígitos." });

  const emit = infNfe.match(/<(?:(?:[A-Za-z_][\w.-]*):)?emit\b[^>]*>([\s\S]*?)<\/(?:(?:[A-Za-z_][\w.-]*):)?emit>/i)?.[1] ?? "";
  const total = infNfe.match(/<(?:(?:[A-Za-z_][\w.-]*):)?ICMSTot\b[^>]*>([\s\S]*?)<\/(?:(?:[A-Za-z_][\w.-]*):)?ICMSTot>/i)?.[1] ?? "";
  const rawItems = Array.from(infNfe.matchAll(/<(?:(?:[A-Za-z_][\w.-]*):)?det\b[^>]*>([\s\S]*?)<\/(?:(?:[A-Za-z_][\w.-]*):)?det>/gi));
  const items = rawItems.map((match, index) => {
    const scope = match[1];
    const prod = scope.match(/<(?:(?:[A-Za-z_][\w.-]*):)?prod\b[^>]*>([\s\S]*?)<\/(?:(?:[A-Za-z_][\w.-]*):)?prod>/i)?.[1] ?? "";
    const rawUnit = valueOf(prod, "uCom").toUpperCase();
    const barcodeCandidate = valueOf(prod, "cEAN") || valueOf(prod, "cEANTrib");
    const barcode = /^\d{8,14}$/.test(barcodeCandidate) && !/^0+$/.test(barcodeCandidate) ? barcodeCandidate : null;
    const item: NfeParsedItem = {
      lineNumber: index + 1,
      productCode: valueOf(prod, "cProd"),
      barcode,
      name: valueOf(prod, "xProd"),
      unit: /^(KG|KILO|QUILO|G|GR)$/.test(rawUnit) ? "kg" : "un",
      quantity: quantity(numberOf(valueOf(prod, "qCom"))),
      unitCost: money(numberOf(valueOf(prod, "vUnCom"))),
      lineTotal: money(numberOf(valueOf(prod, "vProd"))),
    };
    if (!item.productCode || !item.name) errors.push({ lineNumber: index + 1, message: "Item sem código ou descrição." });
    if (item.quantity <= 0) errors.push({ lineNumber: index + 1, message: "Item com quantidade inválida." });
    if (item.unitCost <= 0) warnings.push({ lineNumber: index + 1, message: "Item sem custo unitário válido; revise antes de confirmar." });
    if (!item.barcode) warnings.push({ lineNumber: index + 1, message: "Item sem GTIN/EAN válido; será necessário associar ou cadastrar manualmente." });
    return item;
  });
  if (!items.length) errors.push({ lineNumber: 0, message: "A NF-e não contém itens de produto para importar." });
  const issueDate = valueOf(infNfe, "dhEmi") || valueOf(infNfe, "dEmi") || null;
  return {
    accessKey,
    number: valueOf(infNfe, "nNF"),
    series: valueOf(infNfe, "serie"),
    issueDate,
    supplierName: valueOf(emit, "xNome"),
    supplierDocument: valueOf(emit, "CNPJ") || valueOf(emit, "CPF") || null,
    totalAmount: money(numberOf(valueOf(total, "vNF"))),
    items,
    errors,
    warnings,
  };
}
