import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getLocalStoreStatus, listPendingSales } from "@/lib/offlineStore";
import { formatCurrency, toNumber } from "@/lib/commerce";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, Banknote, CalendarCheck2, CheckCircle2, CreditCard, Landmark, Loader2, ReceiptText, WalletCards } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type CountedFields = { cash: string; debit: string; credit: string; pix: string };

function brazilDate() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const piece = (type: Intl.DateTimeFormatPartTypes) => parts.find(part => part.type === type)?.value ?? "";
  return `${piece("year")}-${piece("month")}-${piece("day")}`;
}

function differenceTone(value: number) { return Math.abs(value) < 0.005 ? "text-[#286144]" : value < 0 ? "text-[#a25e08]" : "text-[#3865a3]"; }

function PaymentRow({ icon: Icon, label, expected, value, onChange }: { icon: typeof Banknote; label: string; expected: number; value: string; onChange: (value: string) => void }) {
  const counted = toNumber(value.replace(",", "."));
  const difference = counted - expected;
  return <article className="grid gap-3 rounded-xl border border-[#e4e9e1] bg-[#fcfdfb] p-4 sm:grid-cols-[minmax(150px,1fr)_135px_135px] sm:items-center"><div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-xl bg-[#e7f0e1] text-[#2b6245]"><Icon className="size-4.5"/></div><div><p className="text-sm font-semibold text-[#294536]">{label}</p><p className="mt-0.5 text-xs text-[#77857c]">Apurado: <strong className="text-[#496155]">{formatCurrency(expected)}</strong></p></div></div><div className="space-y-1"><Label className="text-[10px] font-bold uppercase tracking-wide text-[#829087]">Valor conferido</Label><Input value={value} inputMode="decimal" onChange={event => onChange(event.target.value.replace(/[^0-9,.]/g, ""))} className="h-9 bg-white text-right text-sm font-semibold" placeholder="0,00"/></div><div className="space-y-1"><p className="text-[10px] font-bold uppercase tracking-wide text-[#829087]">Diferença</p><p className={`pt-1.5 text-right text-sm font-bold ${differenceTone(difference)}`}>{difference > 0 ? "+" : ""}{formatCurrency(difference)}</p></div></article>;
}

export default function CashClosing() {
  const [closureDate, setClosureDate] = useState(brazilDate);
  const [counted, setCounted] = useState<CountedFields>({ cash: "", debit: "", credit: "", pix: "" });
  const [notes, setNotes] = useState("");
  const [pendingCount, setPendingCount] = useState(0);
  const [completed, setCompleted] = useState<{ id: number; difference: number } | null>(null);
  const summaryInput = useMemo(() => ({ closureDate }), [closureDate]);
  const { data: summary, isLoading } = trpc.commerce.cash.summary.useQuery(summaryInput);
  const { data: recentClosings = [] } = trpc.commerce.cash.recentClosings.useQuery();
  const closeMutation = trpc.commerce.cash.closeDay.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (!summary) return;
    setCounted({ cash: String(summary.cash), debit: String(summary.debit), credit: String(summary.credit), pix: String(summary.pix) });
    setCompleted(null);
  }, [summary?.closureDate, summary?.cash, summary?.debit, summary?.credit, summary?.pix]);

  useEffect(() => { void (async () => { try { if ((await getLocalStoreStatus()).ready) setPendingCount((await listPendingSales()).length); } catch { setPendingCount(0); } })(); }, []);

  const values = { cash: toNumber(counted.cash.replace(",", ".")), debit: toNumber(counted.debit.replace(",", ".")), credit: toNumber(counted.credit.replace(",", ".")), pix: toNumber(counted.pix.replace(",", ".")) };
  const expectedTotal = summary?.total ?? 0;
  const countedTotal = values.cash + values.debit + values.credit + values.pix;
  const totalDifference = countedTotal - expectedTotal;

  async function closeDay() {
    if (!summary) return;
    if (pendingCount) { toast.error("Sincronize as vendas pendentes antes do fechamento."); return; }
    try {
      const result = await closeMutation.mutateAsync({ closureDate, countedCash: values.cash, countedDebit: values.debit, countedCredit: values.credit, countedPix: values.pix, notes });
      setCompleted({ id: result.id, difference: result.differences.total });
      window.dispatchEvent(new CustomEvent("pdv:print-closing", { detail: { closingId: result.id } }));
      await Promise.all([utils.commerce.cash.summary.invalidate({ closureDate }), utils.commerce.cash.recentClosings.invalidate(), utils.commerce.dashboard.invalidate()]);
      toast.success("Caixa fechado e registrado.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível fechar o caixa."); }
  }

  return <div className="space-y-6"><section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#62786a]">Rotina financeira</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#193c32]">Fechamento de caixa</h1><p className="mt-2 text-sm text-[#6b786f]">Confira o recebido por pagamento e registre o resultado ao fim do expediente.</p></div><div className="rounded-xl border border-[#dbe5d8] bg-white px-4 py-2.5"><Label htmlFor="closure-date" className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7d8b82]">Data do movimento</Label><Input id="closure-date" type="date" value={closureDate} onChange={event => setClosureDate(event.target.value)} className="mt-1 h-8 border-0 p-0 text-sm font-semibold shadow-none focus-visible:ring-0"/></div></section>{pendingCount > 0 && <section className="flex items-start gap-3 rounded-xl border border-[#ead8a7] bg-[#fff9e8] p-4 text-sm text-[#765d22]"><AlertTriangle className="mt-0.5 size-4 shrink-0"/><p><strong>{pendingCount} venda(s) aguardam sincronização.</strong> Volte ao PDV, conecte-se à internet e use <strong>Sincronizar vendas</strong> antes de fechar o caixa.</p></section>}{completed && <section className="flex items-center gap-3 rounded-xl border border-[#c9e0c6] bg-[#f2faee] p-4 text-sm text-[#2b6044]"><CheckCircle2 className="size-5 shrink-0"/><p><strong>Fechamento registrado.</strong> Resultado final: <strong className={differenceTone(completed.difference)}>{formatCurrency(completed.difference)}</strong>. O histórico foi atualizado.</p></section>}<section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_350px]"><article className="rounded-2xl border border-[#e0e6dd] bg-white p-5 shadow-[0_4px_18px_rgba(31,55,41,0.035)]"><div className="flex items-start justify-between gap-4"><div><h2 className="font-semibold text-[#294536]">Conferência do dia</h2><p className="mt-1 text-xs text-[#748178]">Preencha os valores efetivamente conferidos no caixa, maquininhas e Pix.</p></div><Badge className="border-0 bg-[#e5f2d6] text-[#286144] hover:bg-[#e5f2d6]"><ReceiptText className="mr-1.5 size-3.5"/>{summary?.salesCount ?? 0} venda(s)</Badge></div>{isLoading ? <div className="grid h-72 place-items-center"><Loader2 className="size-6 animate-spin text-[#577463]"/></div> : <div className="mt-5 space-y-3"><PaymentRow icon={Banknote} label="Dinheiro" expected={summary?.cash ?? 0} value={counted.cash} onChange={cash => setCounted(value => ({ ...value, cash }))}/><PaymentRow icon={CreditCard} label="Cartão de débito" expected={summary?.debit ?? 0} value={counted.debit} onChange={debit => setCounted(value => ({ ...value, debit }))}/><PaymentRow icon={WalletCards} label="Cartão de crédito" expected={summary?.credit ?? 0} value={counted.credit} onChange={credit => setCounted(value => ({ ...value, credit }))}/><PaymentRow icon={Landmark} label="Pix" expected={summary?.pix ?? 0} value={counted.pix} onChange={pix => setCounted(value => ({ ...value, pix }))}/></div>}<div className="mt-5 space-y-2 border-t border-[#edf0eb] pt-5"><Label htmlFor="closing-notes">Observações <span className="font-normal text-muted-foreground">(opcional)</span></Label><Textarea id="closing-notes" value={notes} onChange={event => setNotes(event.target.value)} placeholder="Ex.: diferença de caixa conferida com o responsável." className="min-h-20 resize-none"/></div></article><aside className="self-start rounded-2xl border border-[#cfe0c9] bg-white p-5 shadow-[0_8px_26px_rgba(26,55,38,0.06)] xl:sticky xl:top-[100px]"><div className="flex items-center gap-2"><div className="grid size-9 place-items-center rounded-xl bg-[#e5f2d6] text-[#2d6146]"><CalendarCheck2 className="size-4.5"/></div><div><h2 className="font-semibold text-[#213e2e]">Resumo do fechamento</h2><p className="text-xs text-[#7d8a82]">{new Date(`${closureDate}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</p></div></div><div className="mt-5 space-y-3 rounded-2xl bg-[#f4f8f1] p-4 text-sm"><div className="flex justify-between text-[#6e7e74]"><span>Vendas apuradas</span><strong className="text-[#294a38]">{formatCurrency(expectedTotal)}</strong></div><div className="flex justify-between text-[#6e7e74]"><span>Total conferido</span><strong className="text-[#294a38]">{formatCurrency(countedTotal)}</strong></div><div className="border-t border-[#dce8d8] pt-3"><p className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#627a69]">Diferença geral</p><p className={`mt-1 text-2xl font-semibold tracking-tight ${differenceTone(totalDifference)}`}>{totalDifference > 0 ? "+" : ""}{formatCurrency(totalDifference)}</p><p className="mt-1 text-xs text-[#77877d]">{Math.abs(totalDifference) < 0.005 ? "Conferência sem diferença." : totalDifference < 0 ? "Valor contado abaixo do apurado." : "Valor contado acima do apurado."}</p></div></div><Button onClick={() => void closeDay()} disabled={isLoading || closeMutation.isPending || pendingCount > 0} className="mt-5 h-12 w-full rounded-xl bg-[#193c32] text-sm font-semibold hover:bg-[#245542]">{closeMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin"/>}<CalendarCheck2 className="mr-2 size-4"/>Confirmar fechamento</Button><p className="mt-3 text-center text-xs leading-5 text-[#77867d]">O fechamento é registrado uma única vez por data e permanece disponível no histórico.</p></aside></section><section className="overflow-hidden rounded-2xl border border-[#e0e6dd] bg-white"><header className="border-b border-[#edf0eb] px-5 py-4"><h2 className="font-semibold text-[#294536]">Histórico recente</h2><p className="mt-1 text-xs text-[#748178]">Últimos fechamentos realizados.</p></header>{recentClosings.length ? <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-[#fbfcfa] text-[10px] font-bold uppercase tracking-[0.08em] text-[#75837a]"><tr><th className="px-5 py-3">Data</th><th className="px-4 py-3">Vendas</th><th className="px-4 py-3">Apurado</th><th className="px-4 py-3">Conferido</th><th className="px-5 py-3 text-right">Diferença</th></tr></thead><tbody className="divide-y divide-[#edf0eb]">{recentClosings.map(closing => <tr key={closing.id}><td className="px-5 py-3.5 font-semibold capitalize text-[#2d4638]">{new Date(`${closing.closureDate}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}</td><td className="px-4 py-3.5 text-[#64766b]">{closing.salesCount}</td><td className="px-4 py-3.5 text-[#40584b]">{formatCurrency(closing.expectedTotal)}</td><td className="px-4 py-3.5 text-[#40584b]">{formatCurrency(closing.countedTotal)}</td><td className={`px-5 py-3.5 text-right font-bold ${differenceTone(closing.differenceTotal)}`}>{closing.differenceTotal > 0 ? "+" : ""}{formatCurrency(closing.differenceTotal)}</td></tr>)}</tbody></table></div> : <div className="grid min-h-40 place-items-center px-6 text-center"><div><div className="mx-auto grid size-10 place-items-center rounded-xl bg-[#e9efec] text-[#436253]"><CalendarCheck2 className="size-5"/></div><p className="mt-3 text-sm font-semibold text-[#304a3a]">Nenhum fechamento registrado</p><p className="mt-1 text-xs text-[#7d8b82]">Os fechamentos confirmados aparecerão aqui.</p></div></div>}</section></div>;
}
