import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatQuantity, ProductRecord } from "@/lib/commerce";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, CheckCircle2, FileCheck2, FileUp, Loader2, PackageCheck, ShieldCheck, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { NfeParsedItem, NfeParseResult, parseNfeXml } from "@shared/nfeParser";

type DraftItem = NfeParsedItem & { productId: number | null; salePrice: string };

function decimal(value: string) { return Number(value.replace(",", ".")); }

export function NfeImportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [reading, setReading] = useState(false);
  const [parsed, setParsed] = useState<NfeParseResult | null>(null);
  const [items, setItems] = useState<DraftItem[]>([]);
  const { data: products = [] } = trpc.commerce.products.list.useQuery(undefined, { enabled: open });
  const importNfe = trpc.commerce.nfe.import.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (!open) { setParsed(null); setItems([]); if (inputRef.current) inputRef.current.value = ""; }
  }, [open]);

  function findProduct(item: NfeParsedItem) {
    const list = products as ProductRecord[];
    return (item.barcode && list.find(product => product.barcode === item.barcode)) || list.find(product => product.inventoryCode === item.productCode) || null;
  }

  async function selectFile(file?: File) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".xml")) { toast.error("Escolha um arquivo XML da NF-e."); return; }
    if (file.size > 8 * 1024 * 1024) { toast.error("O XML não pode exceder 8 MB."); return; }
    setReading(true);
    try {
      const result = parseNfeXml(await file.text());
      setParsed(result);
      setItems(result.items.map(item => { const product = findProduct(item); return { ...item, productId: product?.id ?? null, salePrice: "" }; }));
      if (result.errors.length) toast.warning("A NF-e foi lida com pendências bloqueantes. Revise o XML antes de continuar.");
      else toast.success(`${result.items.length} item(ns) lido(s). Revise os valores antes de confirmar.`);
    } catch (error) { setParsed(null); setItems([]); toast.error(error instanceof Error ? error.message : "Não foi possível ler o XML da NF-e."); }
    finally { setReading(false); if (inputRef.current) inputRef.current.value = ""; }
  }

  function updateItem(index: number, patch: Partial<DraftItem>) { setItems(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item)); }
  function selectProduct(index: number, value: string) {
    const productId = value === "new" ? null : Number(value);
    const product = (products as ProductRecord[]).find(candidate => candidate.id === productId);
    updateItem(index, { productId, unit: product?.unit ?? items[index].unit, salePrice: product ? "" : items[index].salePrice });
  }

  async function confirmImport() {
    if (!parsed || parsed.errors.length || !items.length) return;
    const invalid = items.find(item => !Number.isFinite(decimal(String(item.quantity))) || decimal(String(item.quantity)) <= 0 || !Number.isFinite(decimal(String(item.unitCost))) || decimal(String(item.unitCost)) < 0 || (item.productId === null && (!item.salePrice || decimal(item.salePrice) <= 0)));
    if (invalid) { toast.error("Revise quantidade, custo e preço de venda dos itens novos antes de confirmar."); return; }
    try {
      const result = await importNfe.mutateAsync({ accessKey: parsed.accessKey, invoiceNumber: parsed.number, series: parsed.series || null, issueDate: parsed.issueDate ? new Date(parsed.issueDate).toISOString() : null, supplierName: parsed.supplierName, supplierDocument: parsed.supplierDocument, totalAmount: parsed.totalAmount, items: items.map(item => ({ productId: item.productId, productCode: item.productCode, barcode: item.barcode, name: item.name, unit: item.unit, quantity: decimal(String(item.quantity)), unitCost: decimal(String(item.unitCost)), ...(item.productId === null ? { salePrice: decimal(item.salePrice) } : {}) })) });
      await Promise.all([utils.commerce.products.list.invalidate(), utils.commerce.products.lowStock.invalidate(), utils.commerce.dashboard.invalidate()]);
      toast.success(`NF-e importada: ${result.createdProducts} produto(s) novo(s) e ${result.updatedProducts} atualizado(s).`);
      onOpenChange(false);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível confirmar a entrada da NF-e."); }
  }

  const busy = reading || importNfe.isPending;
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[94vh] max-w-6xl overflow-y-auto border-[#dce4d9] p-0"><DialogHeader className="border-b border-[#e8ece6] px-6 pb-5 pt-6"><DialogTitle className="flex items-center gap-2 text-xl text-[#193c32]"><FileCheck2 className="size-5"/>Entrada de NF-e</DialogTitle><DialogDescription>Envie o XML baixado pelo operador, revise custos, quantidades e associações e só então confirme a entrada no estoque.</DialogDescription></DialogHeader><div className="space-y-5 p-5 sm:p-6">{!parsed ? <label className="grid min-h-[240px] cursor-pointer place-items-center rounded-2xl border-2 border-dashed border-[#bdd3bd] bg-[#f8fbf6] p-6 text-center transition hover:border-[#78a47e] hover:bg-[#f3f9ef]"><input ref={inputRef} type="file" accept=".xml,text/xml,application/xml" className="sr-only" onChange={event => void selectFile(event.target.files?.[0])}/>{reading ? <div><Loader2 className="mx-auto size-8 animate-spin text-[#2d6146]"/><p className="mt-3 text-sm font-semibold text-[#2b503b]">Lendo XML da NF-e...</p></div> : <div><div className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#e5f2d6] text-[#286144]"><FileUp className="size-7"/></div><p className="mt-4 font-semibold text-[#294b38]">Selecionar XML autorizado</p><p className="mt-1 text-sm text-[#718078]">O arquivo é lido neste dispositivo e só é enviado após a confirmação.</p><span className="mt-5 inline-flex rounded-xl bg-[#193c32] px-4 py-2.5 text-sm font-semibold text-white">Escolher XML</span></div>}</label> : <><section className="grid gap-3 rounded-xl border border-[#d5e2d0] bg-[#f7faf5] p-4 sm:grid-cols-4"><div className="sm:col-span-2"><p className="text-[10px] font-bold uppercase tracking-wide text-[#7b887f]">Fornecedor</p><p className="mt-1 font-semibold text-[#294636]">{parsed.supplierName || "Não informado"}</p><p className="mt-0.5 text-xs text-[#75847b]">{parsed.supplierDocument || "Documento não informado"}</p></div><div><p className="text-[10px] font-bold uppercase tracking-wide text-[#7b887f]">NF-e</p><p className="mt-1 font-semibold text-[#294636]">Nº {parsed.number || "—"} · série {parsed.series || "—"}</p></div><div><p className="text-[10px] font-bold uppercase tracking-wide text-[#7b887f]">Total informado</p><p className="mt-1 font-semibold text-[#294636]">{formatCurrency(parsed.totalAmount)}</p></div></section><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap gap-2"><Badge className="border-0 bg-[#e5f2d6] text-[#286144] hover:bg-[#e5f2d6]"><CheckCircle2 className="mr-1 size-3.5"/>{items.length} item(ns)</Badge><Badge className="border-0 bg-[#edf2ef] text-[#496355] hover:bg-[#edf2ef]"><PackageCheck className="mr-1 size-3.5"/>{items.filter(item => item.productId !== null).length} associado(s)</Badge>{parsed.warnings.length > 0 && <Badge className="border-0 bg-[#fff0c9] text-[#925806] hover:bg-[#fff0c9]"><AlertTriangle className="mr-1 size-3.5"/>{parsed.warnings.length} aviso(s)</Badge>}</div><Button onClick={() => { setParsed(null); setItems([]); }} variant="outline" className="h-9 rounded-lg">Trocar XML</Button></div>{parsed.errors.length > 0 ? <div className="rounded-xl border border-[#eed7a1] bg-[#fff9e9] p-4"><p className="flex items-center gap-2 text-sm font-semibold text-[#86580d]"><XCircle className="size-4"/>Corrija o XML antes de continuar</p>{parsed.errors.slice(0, 8).map(issue => <p key={`${issue.lineNumber}-${issue.message}`} className="mt-1 text-xs text-[#7a6641]">{issue.lineNumber ? `Item ${issue.lineNumber}: ` : ""}{issue.message}</p>)}</div> : <section><div className="mb-2 flex items-center gap-2"><ShieldCheck className="size-4 text-[#568060]"/><p className="text-sm font-semibold text-[#355242]">Revise cada item antes de confirmar a entrada</p></div><div className="overflow-x-auto rounded-xl border border-[#e6ece3]"><table className="w-full min-w-[1020px] text-left text-sm"><thead className="bg-[#fafcf9] text-[10px] font-bold uppercase tracking-[0.08em] text-[#76847a]"><tr><th className="px-3 py-3">Produto da NF-e</th><th className="px-3 py-3">Correspondência</th><th className="px-3 py-3">Un.</th><th className="px-3 py-3">Quantidade</th><th className="px-3 py-3">Custo unit.</th><th className="px-3 py-3">Venda novo</th></tr></thead><tbody className="divide-y divide-[#edf0eb]">{items.map((item, index) => <tr key={`${item.lineNumber}-${item.productCode}`}><td className="max-w-56 px-3 py-3"><p className="truncate font-semibold text-[#2b4335]">{item.name}</p><p className="mt-0.5 text-xs text-[#7b887f]">Código: {item.productCode}{item.barcode ? ` · GTIN ${item.barcode}` : ""}</p></td><td className="px-3 py-3"><select value={item.productId === null ? "new" : String(item.productId)} onChange={event => selectProduct(index, event.target.value)} className="h-9 max-w-64 rounded-lg border border-[#dfe6dc] bg-white px-2 text-xs text-[#304a3b]"><option value="new">Cadastrar como novo</option>{(products as ProductRecord[]).filter(product => product.active).map(product => <option key={product.id} value={product.id}>{product.name}</option>)}</select></td><td className="px-3 py-3 font-semibold text-[#4f6657]">{item.unit}</td><td className="px-3 py-3"><Input value={String(item.quantity)} onChange={event => updateItem(index, { quantity: decimal(event.target.value) })} type="number" min="0.001" step="0.001" className="h-9 w-24"/></td><td className="px-3 py-3"><Input value={String(item.unitCost)} onChange={event => updateItem(index, { unitCost: decimal(event.target.value) })} type="number" min="0" step="0.01" className="h-9 w-28"/></td><td className="px-3 py-3">{item.productId === null ? <Input value={item.salePrice} onChange={event => updateItem(index, { salePrice: event.target.value })} type="number" min="0.01" step="0.01" placeholder="Obrigatório" className="h-9 w-28"/> : <span className="text-xs text-[#829087]">Preço atual</span>}</td></tr>)}</tbody></table></div></section>}<div className="flex flex-col-reverse justify-between gap-3 border-t border-[#edf0eb] pt-4 sm:flex-row sm:items-center"><p className="text-xs text-[#718078]">A entrada soma as quantidades ao estoque e atualiza o custo do produto associado.</p><div className="flex gap-2"><Button onClick={() => onOpenChange(false)} variant="outline" className="h-10 rounded-xl">Cancelar</Button><Button onClick={() => void confirmImport()} disabled={busy || !parsed || Boolean(parsed.errors.length) || !items.length} className="h-10 rounded-xl bg-[#193c32] hover:bg-[#245542]">{importNfe.isPending ? <Loader2 className="mr-2 size-4 animate-spin"/> : <PackageCheck className="mr-2 size-4"/>}Confirmar entrada</Button></div></div></>}</div></DialogContent></Dialog>;
}
