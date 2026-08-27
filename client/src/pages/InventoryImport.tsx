import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatQuantity } from "@/lib/commerce";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, CheckCircle2, FileSpreadsheet, FileUp, Info, Loader2, ShieldCheck, Upload, XCircle } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { parseInventoryWorkbook } from "@shared/inventoryParser";

type ParseResult = {
  fileName: string;
  sheetName: string;
  items: ReturnType<typeof parseInventoryWorkbook>["items"];
  errors: Array<{ rowNumber: number; message: string }>;
  warnings: Array<{ rowNumber: number; message: string }>;
};

const supportedMimeTypes = [
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];


export default function InventoryImport() {
  const [result, setResult] = useState<ParseResult | null>(null);
  const [reading, setReading] = useState(false);
  const [stockMinimum, setStockMinimum] = useState("0");
  const inputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();
  const importMutation = trpc.commerce.products.importInventory.useMutation();

  async function selectFile(file?: File) {
    if (!file) return;
    const extension = file.name.toLowerCase().match(/\.(xls|xlsx)$/)?.[1];
    if (!extension || (file.type && !supportedMimeTypes.includes(file.type))) {
      toast.error("Escolha uma planilha XLS ou XLSX válida.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("A planilha não pode exceder 8 MB.");
      return;
    }
    setReading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array", cellText: true, cellDates: false });
      const parsed: ParseResult = { fileName: file.name, ...parseInventoryWorkbook(workbook) };
      setResult(parsed);
      if (parsed.errors.length) toast.warning("A planilha foi lida com pendências. Corrija as linhas indicadas antes de importar.");
      else if (parsed.warnings.length) toast.message(`${parsed.items.length} produtos prontos; ${parsed.warnings.length} código(s) de barras fora do padrão serão ignorados.`);
      else toast.success(`${parsed.items.length} produtos prontos para importação.`);
    } catch (error) {
      setResult(null);
      toast.error(error instanceof Error ? error.message : "Não foi possível ler a planilha.");
    } finally {
      setReading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function importProducts() {
    if (!result || result.errors.length || !result.items.length) return;
    const minimum = Number(stockMinimum.replace(",", "."));
    if (!Number.isFinite(minimum) || minimum < 0) {
      toast.error("Informe um estoque mínimo igual ou maior que zero.");
      return;
    }
    try {
      const summary = await importMutation.mutateAsync({ items: result.items, stockMinimum: minimum });
      await Promise.all([utils.commerce.products.list.invalidate(), utils.commerce.products.lowStock.invalidate(), utils.commerce.dashboard.invalidate()]);
      if (summary.rejected) toast.warning(`Importação concluída: ${summary.created} criado(s), ${summary.updated} atualizado(s) e ${summary.rejected} rejeitado(s).`);
      else toast.success(`Importação concluída: ${summary.created} criado(s) e ${summary.updated} atualizado(s).`);
      setResult(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível importar os produtos.");
    }
  }

  const importing = importMutation.isPending;
  return <div className="space-y-6"><section><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#62786a]">Catálogo</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#193c32]">Importar inventário</h1><p className="mt-2 max-w-2xl text-sm text-[#6b786f]">Importe os produtos e as quantidades de uma planilha XLS ou XLSX sem precisar cadastrar cada item manualmente.</p></section><section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]"><article className="overflow-hidden rounded-2xl border border-[#e0e6dd] bg-white shadow-[0_4px_18px_rgba(31,55,41,0.035)]"><div className="border-b border-[#edf0eb] px-5 py-4"><h2 className="font-semibold text-[#294636]">Arquivo de inventário</h2><p className="mt-1 text-xs text-[#738077]">A leitura ocorre neste dispositivo; os produtos só são enviados após a sua confirmação.</p></div><div className="p-5">{!result ? <label className="grid min-h-[280px] cursor-pointer place-items-center rounded-2xl border-2 border-dashed border-[#bdd3bd] bg-[#f8fbf6] p-6 text-center transition hover:border-[#78a47e] hover:bg-[#f3f9ef]"><input ref={inputRef} type="file" accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="sr-only" onChange={event => selectFile(event.target.files?.[0])}/>{reading ? <div><Loader2 className="mx-auto size-8 animate-spin text-[#2d6146]"/><p className="mt-4 text-sm font-semibold text-[#2b503b]">Lendo a planilha...</p></div> : <div><div className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#e5f2d6] text-[#286144]"><FileUp className="size-7"/></div><p className="mt-4 font-semibold text-[#294b38]">Selecionar planilha</p><p className="mt-1 text-sm text-[#718078]">Clique aqui para escolher um arquivo XLS ou XLSX de até 8 MB.</p><span className="mt-5 inline-flex rounded-xl bg-[#193c32] px-4 py-2.5 text-sm font-semibold text-white">Escolher arquivo</span></div>}</label> : <div className="space-y-5"><div className="flex flex-col justify-between gap-3 rounded-xl border border-[#cfe0ca] bg-[#f5faef] p-4 sm:flex-row sm:items-center"><div className="flex min-w-0 items-center gap-3"><div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e0f0d5] text-[#2c6446]"><FileSpreadsheet className="size-5"/></div><div className="min-w-0"><p className="truncate text-sm font-semibold text-[#264635]">{result.fileName}</p><p className="mt-0.5 text-xs text-[#6c7e71]">Aba: {result.sheetName} · {result.items.length} registro(s) válido(s)</p></div></div><Button onClick={() => setResult(null)} variant="outline" className="h-9 shrink-0 rounded-lg">Trocar</Button></div><div className="flex flex-wrap gap-2"><Badge className="border-0 bg-[#e5f2d6] text-[#286144] hover:bg-[#e5f2d6]"><CheckCircle2 className="mr-1 size-3.5"/>{result.items.length} prontos</Badge>{result.errors.length > 0 && <Badge className="border-0 bg-[#fff0c9] text-[#925806] hover:bg-[#fff0c9]"><AlertTriangle className="mr-1 size-3.5"/>{result.errors.length} pendência(s)</Badge>}</div>{result.errors.length > 0 ? <div className="rounded-xl border border-[#eed7a1] bg-[#fff9e9] p-4"><p className="flex items-center gap-2 text-sm font-semibold text-[#86580d]"><XCircle className="size-4"/>Corrija as pendências antes de importar</p><div className="mt-3 max-h-36 space-y-1 overflow-y-auto text-xs text-[#7a6641]">{result.errors.slice(0, 12).map(error => <p key={`${error.rowNumber}-${error.message}`}>Linha {error.rowNumber}: {error.message}</p>)}</div></div> : <><div className="overflow-x-auto rounded-xl border border-[#e6ece3]"><table className="w-full min-w-[620px] text-left text-sm"><thead className="bg-[#fafcf9] text-[10px] font-bold uppercase tracking-[0.08em] text-[#76847a]"><tr><th className="px-4 py-3">Produto</th><th className="px-3 py-3">Código</th><th className="px-3 py-3">Estoque</th><th className="px-4 py-3 text-right">Preço unitário</th></tr></thead><tbody className="divide-y divide-[#edf0eb]">{result.items.slice(0, 6).map(item => <tr key={item.rowNumber}><td className="max-w-80 truncate px-4 py-3 font-semibold text-[#2b4335]">{item.name}</td><td className="px-3 py-3 font-mono text-xs text-[#708077]">{item.inventoryCode}</td><td className="px-3 py-3 text-[#476050]">{formatQuantity(item.stockCurrent, item.unit)}</td><td className="px-4 py-3 text-right font-semibold text-[#28503d]">{formatCurrency(item.unitPrice)}</td></tr>)}</tbody></table></div>{result.items.length > 6 && <p className="text-center text-xs text-[#748178]">Prévia de 6 produtos. Mais {result.items.length - 6} registro(s) serão processados.</p>}</>}</div>}</div></article><aside className="self-start space-y-4 xl:sticky xl:top-[100px]"><article className="rounded-2xl border border-[#d5e2d0] bg-white p-5 shadow-[0_4px_18px_rgba(31,55,41,0.035)]"><div className="flex items-center gap-2"><div className="grid size-9 place-items-center rounded-xl bg-[#e5f2d6] text-[#286144]"><ShieldCheck className="size-5"/></div><div><h2 className="font-semibold text-[#2a4435]">Como será importado</h2><p className="text-xs text-[#78867d]">Relatório de inventário P7</p></div></div><div className="mt-5 space-y-3 text-sm text-[#65766b]"><p><strong className="text-[#304b3c]">Código</strong> identifica o produto para atualizações futuras.</p><p><strong className="text-[#304b3c]">Barras</strong> vira o EAN/UPC usado pelo leitor no PDV.</p><p><strong className="text-[#304b3c]">Discriminação, Unid e Qtd</strong> definem nome, unidade e estoque atual.</p><p><strong className="text-[#304b3c]">Unitário</strong> preenche o preço de venda; para novos itens, também inicia o preço de custo.</p></div></article><article className="rounded-2xl border border-[#e0e6dd] bg-white p-5"><Label htmlFor="default-minimum" className="text-sm font-semibold text-[#334e3d]">Estoque mínimo para novos produtos</Label><p className="mt-1 text-xs leading-5 text-[#77867d]">Aplicado somente aos produtos criados nesta importação. Itens já existentes preservam o mínimo atual.</p><Input id="default-minimum" type="number" min="0" step="0.001" inputMode="decimal" value={stockMinimum} onChange={event => setStockMinimum(event.target.value)} className="mt-3 h-10"/><Button onClick={importProducts} disabled={!result || Boolean(result.errors.length) || !result.items.length || importing} className="mt-4 h-11 w-full rounded-xl bg-[#193c32] font-semibold hover:bg-[#245542]">{importing ? <Loader2 className="mr-2 size-4 animate-spin"/> : <Upload className="mr-2 size-4"/>}Importar {result?.items.length ?? 0} produto(s)</Button><div className="mt-4 flex gap-2 rounded-lg bg-[#f7faf5] p-3 text-xs leading-5 text-[#617368]"><Info className="mt-0.5 size-4 shrink-0 text-[#578464]"/>Produtos com o mesmo código interno ou código de barras são atualizados; os demais são cadastrados.</div></article></aside></section></div>;
}
