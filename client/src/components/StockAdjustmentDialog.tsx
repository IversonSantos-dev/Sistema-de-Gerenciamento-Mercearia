import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatQuantity, ProductRecord, toNumber } from "@/lib/commerce";
import { stepStockQuantity } from "@/lib/catalogControls";
import { trpc } from "@/lib/trpc";
import { Loader2, Minus, Plus, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type StockAdjustmentDialogProps = {
  open: boolean;
  product: ProductRecord | null;
  onOpenChange: (open: boolean) => void;
};

function formatSignedQuantity(value: number, unit: ProductRecord["unit"]) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatQuantity(value, unit)}`;
}

export function StockAdjustmentDialog({ open, product, onOpenChange }: StockAdjustmentDialogProps) {
  const [newQuantity, setNewQuantity] = useState("");
  const [reason, setReason] = useState("");
  const utils = trpc.useUtils();
  const adjustStock = trpc.commerce.products.adjustStock.useMutation();

  useEffect(() => {
    setNewQuantity(product ? String(product.stockCurrent) : "");
    setReason("");
  }, [product, open]);

  const currentQuantity = product ? toNumber(product.stockCurrent) : 0;
  const enteredQuantity = Number(newQuantity);
  const validQuantity = Number.isFinite(enteredQuantity) && enteredQuantity >= 0;
  const difference = validQuantity ? enteredQuantity - currentQuantity : 0;
  const step = product?.unit === "kg" ? 0.001 : 1;
  const hasChange = validQuantity && Math.abs(difference) > 0.0001;
  const direction = useMemo(() => difference > 0 ? "entrada" : difference < 0 ? "baixa" : "sem alteração", [difference]);

  function changeQuantity(amount: number) {
    setNewQuantity(String(stepStockQuantity(newQuantity, currentQuantity, amount)));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!product || !validQuantity) {
      toast.error("Informe uma quantidade de estoque válida.");
      return;
    }
    if (!hasChange) {
      toast.message("O estoque informado já é igual ao estoque atual.");
      return;
    }
    try {
      const result = await adjustStock.mutateAsync({ productId: product.id, newQuantity: enteredQuantity, reason: reason || undefined });
      await Promise.all([utils.commerce.products.list.invalidate(), utils.commerce.products.lowStock.invalidate(), utils.commerce.dashboard.invalidate()]);
      toast.success(`${product.name}: estoque ajustado para ${formatQuantity(result.resultingQuantity, product.unit)}.`, { description: `Movimentação registrada: ${formatSignedQuantity(result.adjustmentQuantity, product.unit)}.` });
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível ajustar o estoque.");
    }
  }

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="border-[#dce4d9] p-0 sm:max-w-md"><DialogHeader className="border-b border-[#e8ece6] px-6 pb-5 pt-6"><DialogTitle className="flex items-center gap-2 text-xl text-[#193c32]"><SlidersHorizontal className="size-5"/>Ajustar estoque</DialogTitle><DialogDescription>Atualize a quantidade física e registre o motivo da movimentação.</DialogDescription></DialogHeader>{product && <form onSubmit={submit} className="space-y-5 px-6 py-6"><div className="rounded-xl border border-[#dce5d9] bg-[#f8fbf6] p-4"><p className="font-semibold text-[#294536]">{product.name}</p><p className="mt-1 text-xs text-[#718078]">Estoque atual: <span className="font-semibold text-[#355443]">{formatQuantity(currentQuantity, product.unit)}</span></p></div><div className="space-y-2"><Label htmlFor="adjusted-stock">Novo estoque físico</Label><div className="flex gap-2"><Button type="button" variant="outline" onClick={() => changeQuantity(-step)} className="size-11 shrink-0 rounded-xl px-0" aria-label="Diminuir estoque"><Minus className="size-4"/></Button><Input id="adjusted-stock" type="number" min="0" step={step} inputMode="decimal" autoFocus value={newQuantity} onChange={event => setNewQuantity(event.target.value)} className="h-11 text-center font-semibold"/><Button type="button" variant="outline" onClick={() => changeQuantity(step)} className="size-11 shrink-0 rounded-xl px-0" aria-label="Aumentar estoque"><Plus className="size-4"/></Button></div></div><div className="rounded-xl border border-[#e0e8dc] bg-white px-4 py-3"><p className="text-[11px] font-bold uppercase tracking-wide text-[#849289]">Movimentação prevista</p><p className={`mt-1 text-sm font-semibold ${difference > 0 ? "text-[#286144]" : difference < 0 ? "text-[#a05d08]" : "text-[#65776c]"}`}>{validQuantity ? `${formatSignedQuantity(difference, product.unit)} · ${direction}` : "Informe uma quantidade válida"}</p></div><div className="space-y-2"><Label htmlFor="adjustment-reason">Motivo <span className="font-normal text-muted-foreground">(opcional)</span></Label><Input id="adjustment-reason" value={reason} onChange={event => setReason(event.target.value)} maxLength={300} placeholder="Ex.: entrada de mercadoria, conferência, perda" className="h-11"/></div><div className="flex flex-col-reverse gap-2 border-t border-[#e8ece6] pt-5 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-10 rounded-xl">Cancelar</Button><Button type="submit" disabled={adjustStock.isPending || !validQuantity || !hasChange} className="h-10 rounded-xl bg-[#193c32] hover:bg-[#245542]">{adjustStock.isPending && <Loader2 className="mr-2 size-4 animate-spin"/>}Confirmar ajuste</Button></div></form>}</DialogContent></Dialog>;
}
