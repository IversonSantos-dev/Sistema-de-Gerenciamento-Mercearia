import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatCurrency, ProductRecord } from "@/lib/commerce";
import { trpc } from "@/lib/trpc";
import { Barcode, Eraser, Loader2, Save, Scale, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export function ScalePluDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [search, setSearch] = useState("");
  const [values, setValues] = useState<Record<number, string>>({});
  const queryInput = useMemo(() => ({ search: search.trim() || undefined }), [search]);
  const { data: products = [], isLoading } = trpc.commerce.products.weightProductsForScale.useQuery(queryInput, { enabled: open });
  const updateScalePlu = trpc.commerce.products.updateScalePlu.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (!open) { setSearch(""); setValues({}); }
  }, [open]);

  function currentValue(product: ProductRecord) { return values[product.id] ?? (product.scalePlu ? String(product.scalePlu) : ""); }
  function changeValue(productId: number, value: string) { setValues(current => ({ ...current, [productId]: value.replace(/\D/g, "").slice(0, 6) })); }

  async function save(product: ProductRecord) {
    const value = currentValue(product);
    const nextPlu = value ? Number(value) : null;
    if (nextPlu !== null && (!Number.isInteger(nextPlu) || nextPlu < 1 || nextPlu > 999999)) { toast.error("Informe um PLU de 1 a 6 dígitos."); return; }
    if (nextPlu === (product.scalePlu ?? null)) { toast.message("Não há alteração de PLU para salvar."); return; }
    try {
      await updateScalePlu.mutateAsync({ productId: product.id, scalePlu: nextPlu });
      await Promise.all([utils.commerce.products.weightProductsForScale.invalidate(), utils.commerce.products.list.invalidate(), utils.commerce.products.byScalePlu.invalidate()]);
      setValues(current => { const next = { ...current }; delete next[product.id]; return next; });
      toast.success(nextPlu ? `PLU ${nextPlu} atribuído a ${product.name}.` : `PLU removido de ${product.name}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível salvar o PLU.";
      toast.error(/duplicate|unique|já existe/i.test(message) ? "Este PLU já está em uso por outro produto." : message);
    }
  }

  const typedProducts = products as ProductRecord[];
  const withPlu = typedProducts.filter(product => product.scalePlu).length;
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[92vh] overflow-y-auto border-[#dce4d9] p-0 sm:max-w-3xl"><DialogHeader className="border-b border-[#e8ece6] px-6 pb-5 pt-6"><DialogTitle className="flex items-center gap-2 text-xl text-[#193c32]"><Scale className="size-5"/>PLUs da balança</DialogTitle><DialogDescription>Associe um PLU de 1 a 6 dígitos aos produtos vendidos por peso. Este código será usado nas etiquetas quando a balança for ativada.</DialogDescription></DialogHeader><div className="space-y-4 px-4 py-5 sm:px-6"><div className="grid gap-3 rounded-xl border border-[#d8e5d4] bg-[#f7faf5] p-4 sm:grid-cols-[1fr_auto]"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#809087]"/><Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar por nome, código interno ou PLU" className="h-10 bg-white pl-9"/></div><div className="flex items-center gap-2 text-xs text-[#6d7e73]"><Badge className="border-0 bg-[#e4f1d9] text-[#2b6145] hover:bg-[#e4f1d9]">{withPlu} configurado(s)</Badge><span>{typedProducts.length} por peso</span></div></div><div className="overflow-hidden rounded-xl border border-[#e1e8de]">{isLoading ? <div className="grid h-44 place-items-center"><Loader2 className="size-5 animate-spin text-[#5b7365]"/></div> : typedProducts.length ? <div className="divide-y divide-[#edf0eb]">{typedProducts.map(product => { const value = currentValue(product); const changed = value !== (product.scalePlu ? String(product.scalePlu) : ""); return <article key={product.id} className="flex flex-col gap-3 bg-white p-4 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-[#2a4435]">{product.name}</p><p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#78867c]"><span>{product.category?.name || "Sem categoria"}</span><span>•</span><span>{formatCurrency(product.salePrice)}/kg</span>{product.inventoryCode && <><span>•</span><span>Cód. {product.inventoryCode}</span></>}</p></div><div className="flex items-center gap-2 sm:w-[250px]"><div className="relative min-w-0 flex-1"><Barcode className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[#6e8075]"/><Input value={value} onChange={event => changeValue(product.id, event.target.value)} inputMode="numeric" placeholder="Sem PLU" aria-label={`PLU de ${product.name}`} className="h-10 bg-[#fbfcfa] pl-8 font-mono text-sm"/></div>{product.scalePlu && !value && <Button type="button" variant="outline" onClick={() => void save(product)} disabled={updateScalePlu.isPending} className="h-10 rounded-lg px-3 text-[#9c5c52]" aria-label={`Remover PLU de ${product.name}`}><Eraser className="size-4"/></Button>}<Button type="button" onClick={() => void save(product)} disabled={updateScalePlu.isPending || !changed} className="h-10 rounded-lg bg-[#193c32] px-3 hover:bg-[#245542]" aria-label={`Salvar PLU de ${product.name}`}>{updateScalePlu.isPending ? <Loader2 className="size-4 animate-spin"/> : <Save className="size-4"/>}</Button></div></article>; })}</div> : <div className="grid min-h-40 place-items-center px-6 text-center"><div><Scale className="mx-auto size-6 text-[#6b8575]"/><p className="mt-3 text-sm font-semibold text-[#365343]">Nenhum produto por peso encontrado</p><p className="mt-1 text-xs text-[#78867c]">Cadastre produtos com unidade em quilograma para atribuir seus PLUs.</p></div></div>}</div><p className="rounded-lg border border-[#e9ddbd] bg-[#fffaf0] px-3 py-2.5 text-xs leading-5 text-[#745f2c]"><strong>Ativação futura:</strong> os PLUs podem ser cadastrados agora. A leitura de etiquetas continua desativada até a escolha e a homologação da balança.</p></div></DialogContent></Dialog>;
}
