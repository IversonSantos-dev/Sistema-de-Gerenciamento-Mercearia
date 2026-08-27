import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency, toNumber } from "@/lib/commerce";
import { trpc } from "@/lib/trpc";
import { buildClosingReceiptDifference, buildSaleReceiptPayment } from "../../../shared/receiptFormat";
import { Loader2, Printer, ReceiptText } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type CashClosing = {
  id: number;
  closureDate: string;
  expectedCash: number;
  expectedDebit: number;
  expectedCredit: number;
  expectedPix: number;
  countedCash: number;
  countedDebit: number;
  countedCredit: number;
  countedPix: number;
  expectedTotal: number;
  countedTotal: number;
  differenceTotal: number;
  salesCount: number;
  notes: string | null;
  closedAt: string;
};

type SaleReceiptData = {
  id: number | string;
  paymentMethod: string;
  totalAmount: number;
  amountPaid: number;
  changeAmount: number;
  completedAt: Date | string;
  items: Array<{ id: number; productName: string; barcode: string | null; unit: string; unitPrice: number; quantity: number; subtotal: number }>;
};

type ActiveReceipt = { kind: "sale"; saleId: number } | { kind: "localSale"; receipt: SaleReceiptData } | { kind: "closing"; closing: CashClosing } | null;

function Divider() { return <p className="my-2 overflow-hidden whitespace-nowrap text-[10px] tracking-[0.12em] text-black">------------------------------------------------</p>; }
function qty(value: number, unit: string) { return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 3 })} ${unit === "kg" ? "kg" : "un"}`; }
function printedAt(value: Date | string) { return new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }); }

function SaleReceipt({ receipt }: { receipt: SaleReceiptData }) {
  const payment = buildSaleReceiptPayment(receipt.paymentMethod, receipt.totalAmount, receipt.amountPaid, receipt.changeAmount);
  return <div id="thermal-receipt" className="receipt-paper bg-white font-mono text-[11px] leading-[1.35] text-black"><header className="text-center"><p className="text-sm font-bold">MERCEARIA PDV</p><p>COMPROVANTE NÃO FISCAL</p><p className="mt-1">Venda #{receipt.id}</p><p>{printedAt(receipt.completedAt)}</p></header><Divider/><section>{receipt.items.map(item => <div key={item.id} className="mb-2"><p className="break-words font-bold">{item.productName}</p><p>{qty(toNumber(item.quantity), item.unit)} × {formatCurrency(item.unitPrice)}</p><p className="text-right font-bold">{formatCurrency(item.subtotal)}</p></div>)}</section><Divider/><div className="space-y-1"><p className="flex justify-between font-bold"><span>TOTAL</span><span>{formatCurrency(payment.total)}</span></p><p className="flex justify-between"><span>PAGAMENTO</span><span>{payment.paymentMethod}</span></p>{payment.showChange && <p className="flex justify-between"><span>TROCO</span><span>{formatCurrency(payment.change)}</span></p>}</div><Divider/><footer className="text-center"><p>Obrigado pela preferência!</p><p className="mt-1 text-[9px]">Documento sem valor fiscal.</p></footer></div>;
}

function ClosingReceipt({ closing }: { closing: CashClosing }) {
  const rows = [["Dinheiro", closing.expectedCash, closing.countedCash], ["Débito", closing.expectedDebit, closing.countedDebit], ["Crédito", closing.expectedCredit, closing.countedCredit], ["Pix", closing.expectedPix, closing.countedPix]];
  return <div id="thermal-receipt" className="receipt-paper bg-white font-mono text-[11px] leading-[1.35] text-black"><header className="text-center"><p className="text-sm font-bold">MERCEARIA PDV</p><p>FECHAMENTO DE CAIXA</p><p className="mt-1">Data: {new Date(`${closing.closureDate}T12:00:00`).toLocaleDateString("pt-BR")}</p><p>Registro: #{closing.id}</p><p>{printedAt(closing.closedAt)}</p></header><Divider/><p>{closing.salesCount} venda(s) apurada(s)</p>{rows.map(([label, expected, counted]) => <div key={String(label)} className="mt-2"><p className="font-bold">{label}</p><p className="flex justify-between"><span>Apurado</span><span>{formatCurrency(expected as number)}</span></p><p className="flex justify-between"><span>Conferido</span><span>{formatCurrency(counted as number)}</span></p><p className="flex justify-between"><span>Diferença</span><span>{formatCurrency(buildClosingReceiptDifference(expected as number, counted as number))}</span></p></div>)}<Divider/><p className="flex justify-between font-bold"><span>TOTAL APURADO</span><span>{formatCurrency(closing.expectedTotal)}</span></p><p className="flex justify-between font-bold"><span>TOTAL CONFERIDO</span><span>{formatCurrency(closing.countedTotal)}</span></p><p className="mt-1 flex justify-between text-xs font-bold"><span>DIFERENÇA GERAL</span><span>{closing.differenceTotal > 0 ? "+" : ""}{formatCurrency(closing.differenceTotal)}</span></p>{closing.notes && <><Divider/><p className="font-bold">OBSERVAÇÕES</p><p className="whitespace-pre-wrap break-words">{closing.notes}</p></>}<Divider/><footer className="text-center"><p>Comprovante interno não fiscal.</p></footer></div>;
}

export default function ReceiptCenter() {
  const [active, setActive] = useState<ActiveReceipt>(null);
  const saleId = active?.kind === "sale" ? active.saleId : 0;
  const saleQuery = trpc.commerce.sales.receipt.useQuery({ saleId }, { enabled: saleId > 0 });
  const utils = trpc.useUtils();

  useEffect(() => {
    const openSaleReceipt = (event: Event) => { const saleId = Number((event as CustomEvent<{ saleId?: number }>).detail?.saleId); if (saleId) setActive({ kind: "sale", saleId }); };
    const openLocalSaleReceipt = (event: Event) => { const receipt = (event as CustomEvent<{ receipt?: SaleReceiptData }>).detail?.receipt; if (receipt) setActive({ kind: "localSale", receipt }); };
    const openClosingReceipt = async (event: Event) => {
      const closingId = Number((event as CustomEvent<{ closingId?: number }>).detail?.closingId);
      if (!closingId) return;
      try {
        const closings = await utils.commerce.cash.recentClosings.fetch();
        const closing = closings.find(item => item.id === closingId);
        if (!closing) throw new Error("Fechamento não encontrado.");
        setActive({ kind: "closing", closing: closing as CashClosing });
      } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível abrir o comprovante de fechamento."); }
    };
    window.addEventListener("pdv:print-sale", openSaleReceipt);
    window.addEventListener("pdv:print-local-sale", openLocalSaleReceipt);
    window.addEventListener("pdv:print-closing", openClosingReceipt);
    return () => { window.removeEventListener("pdv:print-sale", openSaleReceipt); window.removeEventListener("pdv:print-local-sale", openLocalSaleReceipt); window.removeEventListener("pdv:print-closing", openClosingReceipt); };
  }, [utils.commerce.cash.recentClosings]);

  const saleReceipt = active?.kind === "localSale" ? active.receipt : saleQuery.data as SaleReceiptData | undefined;
  const closingReady = active?.kind === "closing" && active.closing;
  return <><style>{`@media print { @page { size: 80mm auto; margin: 0; } body * { visibility: hidden !important; } #thermal-receipt, #thermal-receipt * { visibility: visible !important; } #thermal-receipt { position: fixed !important; inset: 0 auto auto 0 !important; width: 80mm !important; margin: 0 !important; padding: 4mm !important; box-shadow: none !important; } }`}</style><Dialog open={Boolean(active)} onOpenChange={open => { if (!open) setActive(null); }}><DialogContent className="max-h-[94vh] overflow-y-auto border-[#dfe5dc] p-0 sm:max-w-md"><DialogHeader className="border-b border-[#edf0eb] px-6 pb-4 pt-6"><DialogTitle className="flex items-center gap-2 text-[#193c32]"><ReceiptText className="size-5"/>{active?.kind === "closing" ? "Comprovante de fechamento" : "Comprovante de venda"}</DialogTitle><DialogDescription>Prévia em 80 mm para impressora térmica não fiscal.</DialogDescription></DialogHeader><div className="bg-[#f3f5f1] p-5">{active?.kind === "sale" && saleQuery.isLoading ? <div className="grid h-80 place-items-center"><Loader2 className="size-6 animate-spin text-[#416252]"/></div> : saleReceipt ? <SaleReceipt receipt={saleReceipt}/> : closingReady ? <ClosingReceipt closing={closingReady}/> : <p className="text-center text-sm text-[#6c7c72]">Não foi possível carregar o comprovante.</p>}</div><div className="flex gap-2 border-t border-[#edf0eb] px-6 py-4"><Button variant="outline" onClick={() => setActive(null)} className="h-10 flex-1 rounded-xl">Fechar</Button><Button onClick={() => window.print()} disabled={!saleReceipt && !closingReady} className="h-10 flex-1 rounded-xl bg-[#193c32] hover:bg-[#245542]"><Printer className="mr-2 size-4"/>Imprimir</Button></div></DialogContent></Dialog></>;
}
