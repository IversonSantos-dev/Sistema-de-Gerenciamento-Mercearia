import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { formatCurrency, formatQuantity, normalizeScannerValue, ProductRecord, toNumber, Unit } from "@/lib/commerce";
import { trpc } from "@/lib/trpc";
import { Barcode, Banknote, CreditCard, Keyboard, Loader2, Minus, Plus, ReceiptText, Search, ShoppingBasket, Trash2, WalletCards, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

type CartItem = {
  product: ProductRecord;
  quantity: number;
};
type PaymentMethod = "dinheiro" | "debito" | "credito" | "pix";

const paymentOptions: Array<{ value: PaymentMethod; label: string; icon: typeof Banknote }> = [
  { value: "dinheiro", label: "Dinheiro", icon: Banknote },
  { value: "debito", label: "Débito", icon: CreditCard },
  { value: "credito", label: "Crédito", icon: WalletCards },
  { value: "pix", label: "Pix", icon: ReceiptText },
];

function CartLine({ item, selected, onSelect, onQuantityChange, onRemove }: { item: CartItem; selected: boolean; onSelect: () => void; onQuantityChange: (value: number) => void; onRemove: () => void }) {
  const price = toNumber(item.product.salePrice);
  const isWeight = item.product.unit === "kg";
  return <div role="button" tabIndex={0} onClick={onSelect} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(); } }} className={cn("group grid w-full cursor-pointer grid-cols-[minmax(0,1fr)_auto] gap-3 border-b border-[#edf0eb] px-4 py-3.5 text-left transition last:border-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#79a482] sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center", selected ? "bg-[#f0f8e9]" : "hover:bg-[#fbfcfa]")}>
    <div className="min-w-0"><p className="truncate text-sm font-semibold text-[#263f31]">{item.product.name}</p><p className="mt-0.5 text-xs text-[#7a887f]">{formatCurrency(price)} por {isWeight ? "kg" : "unidade"}</p></div>
    <div onClick={event => event.stopPropagation()} className="flex items-center justify-end gap-1.5 sm:justify-center"><button aria-label="Diminuir quantidade" onClick={() => onQuantityChange(Math.max(isWeight ? 0.001 : 1, item.quantity - (isWeight ? 0.1 : 1)))} className="grid size-7 place-items-center rounded-md border border-[#dbe4d8] text-[#517060] hover:bg-white"><Minus className="size-3.5"/></button><Input aria-label="Quantidade" value={isWeight ? item.quantity.toFixed(3) : item.quantity} onChange={event => { const parsed = Number(event.target.value); if (Number.isFinite(parsed)) onQuantityChange(parsed); }} className="h-7 w-[60px] border-[#dbe4d8] bg-white px-1 text-center text-xs font-semibold"/><button aria-label="Aumentar quantidade" onClick={() => onQuantityChange(item.quantity + (isWeight ? 0.1 : 1))} className="grid size-7 place-items-center rounded-md border border-[#dbe4d8] text-[#517060] hover:bg-white"><Plus className="size-3.5"/></button></div>
    <div className="col-start-2 flex items-center justify-end gap-2 sm:col-start-auto"><p className="text-sm font-bold text-[#264c39]">{formatCurrency(price * item.quantity)}</p><button onClick={onRemove} aria-label={`Remover ${item.product.name}`} className="hidden size-7 place-items-center rounded-md text-[#9a5e59] hover:bg-[#fff0ee] group-hover:grid"><Trash2 className="size-3.5"/></button></div>
  </div>;
}

function PaymentDialog({ open, total, onOpenChange, onConfirm, loading }: { open: boolean; total: number; onOpenChange: (value: boolean) => void; onConfirm: (method: PaymentMethod, amountPaid: number) => void; loading: boolean }) {
  const [method, setMethod] = useState<PaymentMethod>("dinheiro");
  const [amountPaid, setAmountPaid] = useState("");
  useEffect(() => { if (open) { setMethod("dinheiro"); setAmountPaid(""); } }, [open]);
  const paid = Number(amountPaid.replace(",", ".")) || 0;
  const change = Math.max(0, paid - total);
  const due = Math.max(0, total - paid);
  const canConfirm = method !== "dinheiro" || paid >= total;

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="border-[#dce4d9] p-0 sm:max-w-lg"><DialogHeader className="border-b border-[#e8ece6] px-6 pb-5 pt-6"><DialogTitle className="text-xl text-[#193c32]">Finalizar venda</DialogTitle><DialogDescription>Escolha a forma de pagamento e confirme a operação.</DialogDescription></DialogHeader><div className="space-y-5 px-6 py-5"><div className="rounded-2xl bg-[#193c32] px-5 py-4 text-center text-white"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#b7db79]">Total a receber</p><p className="mt-1 text-3xl font-semibold tracking-tight">{formatCurrency(total)}</p></div><div><Label className="mb-2.5 block">Forma de pagamento</Label><div className="grid grid-cols-2 gap-2">{paymentOptions.map(option => { const Icon = option.icon; const active = method === option.value; return <button key={option.value} onClick={() => setMethod(option.value)} className={cn("flex h-12 items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition", active ? "border-[#5b966b] bg-[#edf7e7] text-[#22563e] ring-1 ring-[#87b991]" : "border-[#dce4d9] text-[#65766c] hover:bg-[#fafcf8]")}><Icon className="size-4"/>{option.label}</button>; })}</div></div>{method === "dinheiro" && <div className="space-y-2"><Label htmlFor="amount-paid">Valor recebido</Label><Input id="amount-paid" autoFocus inputMode="decimal" value={amountPaid} onChange={event => setAmountPaid(event.target.value.replace(/[^0-9,.]/g, ""))} placeholder="0,00" className="h-12 text-lg font-semibold"/><div className="flex justify-between text-sm"><span className="text-[#728078]">{due > 0 ? "Falta receber" : "Troco"}</span><span className={cn("font-bold", due > 0 ? "text-[#b66c14]" : "text-[#286144]")}>{formatCurrency(due > 0 ? due : change)}</span></div></div>}<div className="flex flex-col-reverse gap-2 border-t border-[#e8ece6] pt-5 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading} className="h-10 rounded-xl">Voltar</Button><Button type="button" onClick={() => onConfirm(method, method === "dinheiro" ? paid : total)} disabled={!canConfirm || loading} className="h-10 rounded-xl bg-[#193c32] hover:bg-[#245542]">{loading && <Loader2 className="mr-2 size-4 animate-spin"/>}Confirmar venda</Button></div></div></DialogContent></Dialog>;
}

export default function PointOfSale() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [barcode, setBarcode] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const scannerInputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();
  const productSearchInput = useMemo(() => ({ search: productSearch.length >= 2 ? productSearch : undefined }), [productSearch]);
  const { data: searchResults = [] } = trpc.commerce.products.list.useQuery(productSearchInput);
  const finalizeSale = trpc.commerce.sales.finalize.useMutation();

  const total = useMemo(() => cart.reduce((sum, item) => sum + toNumber(item.product.salePrice) * item.quantity, 0), [cart]);
  const selectedItem = cart.find(item => item.product.id === selectedProductId) ?? null;

  const focusScanner = useCallback(() => { window.setTimeout(() => scannerInputRef.current?.focus(), 0); }, []);

  const addProduct = useCallback((product: ProductRecord) => {
    const available = toNumber(product.stockCurrent);
    setCart(current => {
      const exists = current.find(item => item.product.id === product.id);
      const nextQuantity = (exists?.quantity ?? 0) + 1;
      if (nextQuantity > available) {
        toast.error(`${product.name}: estoque disponível insuficiente.`);
        return current;
      }
      if (exists) return current.map(item => item.product.id === product.id ? { ...item, quantity: nextQuantity } : item);
      return [...current, { product, quantity: 1 }];
    });
    setSelectedProductId(product.id);
    setProductSearch("");
  }, []);

  const lookupBarcode = useCallback(async (rawBarcode: string) => {
    const code = normalizeScannerValue(rawBarcode);
    if (!code) return;
    try {
      const product = await utils.commerce.products.byBarcode.fetch({ barcode: code });
      if (!product) { toast.error(`Código ${code} não encontrado.`, { description: "Cadastre o produto ou confira a leitura." }); return; }
      addProduct(product as ProductRecord);
      toast.success(product.name, { description: "Item adicionado ao carrinho." });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível localizar o produto.");
    } finally {
      setBarcode("");
      focusScanner();
    }
  }, [addProduct, focusScanner, utils.commerce.products.byBarcode]);

  function updateQuantity(productId: number, value: number, unit: Unit) {
    const normalized = unit === "kg" ? Math.round(value * 1000) / 1000 : Math.round(value);
    if (normalized <= 0) { removeItem(productId); return; }
    setCart(current => current.map(item => {
      if (item.product.id !== productId) return item;
      const stock = toNumber(item.product.stockCurrent);
      if (normalized > stock) { toast.error(`${item.product.name}: estoque disponível é ${formatQuantity(stock, unit)}.`); return item; }
      return { ...item, quantity: normalized };
    }));
  }

  function removeItem(productId: number) {
    setCart(current => current.filter(item => item.product.id !== productId));
    setSelectedProductId(current => current === productId ? null : current);
    focusScanner();
  }

  function cancelSale() {
    if (!cart.length) return;
    setCart([]); setSelectedProductId(null); setProductSearch(""); setBarcode("");
    toast.message("Venda cancelada."); focusScanner();
  }

  async function confirmSale(method: PaymentMethod, amountPaid: number) {
    try {
      const result = await finalizeSale.mutateAsync({ items: cart.map(item => ({ productId: item.product.id, quantity: item.quantity })), paymentMethod: method, amountPaid });
      toast.success("Venda finalizada com sucesso.", { description: result.change > 0 ? `Troco: ${formatCurrency(result.change)}` : `Total: ${formatCurrency(result.total)}` });
      setCart([]); setSelectedProductId(null); setPaymentOpen(false); setBarcode("");
      await Promise.all([utils.commerce.products.list.invalidate(), utils.commerce.products.lowStock.invalidate(), utils.commerce.dashboard.invalidate(), utils.commerce.sales.recent.invalidate()]);
      focusScanner();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível finalizar a venda."); }
  }

  useEffect(() => {
    focusScanner();
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.getAttribute("contenteditable") === "true";
      if (event.key === "F2") { event.preventDefault(); focusScanner(); }
      if (event.key === "F4") { event.preventDefault(); if (cart.length) setPaymentOpen(true); }
      if (event.key === "Escape" && !paymentOpen) { event.preventDefault(); cancelSale(); }
      if (event.key === "Delete" && selectedItem && !isTyping) { event.preventDefault(); removeItem(selectedItem.product.id); }
      if (event.key === "F3") { event.preventDefault(); document.getElementById("product-search")?.focus(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [cart.length, cancelSale, focusScanner, paymentOpen, selectedItem]);

  return <div className="space-y-5"><section className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#62786a]">Frente de caixa</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#193c32]">Ponto de venda</h1><p className="mt-2 text-sm text-[#6b786f]">Bipe, confira e finalize com agilidade.</p></div><Badge className="w-fit border-0 bg-[#e5f2d6] px-3 py-1.5 text-[#286144] hover:bg-[#e5f2d6]"><span className="mr-2 size-2 rounded-full bg-[#4e9965]"/>Caixa pronto</Badge></section><section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_410px]"><div className="space-y-4"><article className="rounded-2xl border border-[#bfd6be] bg-[#eff8eb] p-4 shadow-[0_4px_20px_rgba(31,75,46,0.04)]"><div className="flex flex-col gap-3 sm:flex-row sm:items-center"><div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#193c32] text-[#d7f0b5]"><Barcode className="size-5"/></div><div className="flex-1"><Label htmlFor="barcode-scan" className="font-semibold text-[#28503d]">Leitor de código de barras</Label><form onSubmit={event => { event.preventDefault(); lookupBarcode(barcode); }} className="relative mt-1.5"><Input ref={scannerInputRef} id="barcode-scan" value={barcode} onChange={event => setBarcode(event.target.value)} inputMode="numeric" autoComplete="off" placeholder="Bipe o produto ou digite o código e pressione Enter" className="h-11 border-[#aacaa9] bg-white pl-10 pr-24 font-mono text-sm tracking-wide shadow-sm focus-visible:ring-[#4c865a]"/><Barcode className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#4b8060]"/><button type="submit" className="absolute right-1.5 top-1.5 h-8 rounded-lg bg-[#193c32] px-3 text-xs font-semibold text-white hover:bg-[#245542]">Adicionar</button></form></div></div><p className="mt-3 pl-0 text-xs text-[#557463] sm:pl-[52px]">Compatível com leitores USB e Bluetooth configurados no modo de emulação de teclado.</p></article><article className="rounded-2xl border border-[#e0e6dd] bg-white"><div className="border-b border-[#edf0eb] p-4"><Label htmlFor="product-search" className="text-sm font-semibold text-[#345241]">Adicionar por busca</Label><div className="relative mt-2"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#829087]"/><Input id="product-search" value={productSearch} onChange={event => setProductSearch(event.target.value)} placeholder="Nome ou código do produto" className="h-11 pl-9"/></div></div>{productSearch.length >= 2 ? <div className="max-h-52 divide-y divide-[#edf0eb] overflow-y-auto">{searchResults.length ? (searchResults as ProductRecord[]).slice(0, 8).map(product => <button key={product.id} onClick={() => addProduct(product)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-[#f7faf5]"><div className="min-w-0"><p className="truncate text-sm font-semibold text-[#2a4335]">{product.name}</p><p className="mt-0.5 text-xs text-[#7e8b83]">{formatQuantity(product.stockCurrent, product.unit)} disponíveis</p></div><p className="shrink-0 text-sm font-bold text-[#24523b]">{formatCurrency(product.salePrice)}</p></button>) : <p className="px-4 py-6 text-center text-sm text-[#78867d]">Nenhum produto encontrado.</p>}</div> : <div className="grid min-h-24 place-items-center px-4 text-center"><p className="text-sm text-[#829087]">Digite ao menos dois caracteres para buscar no catálogo.</p></div>}</article><article className="rounded-2xl border border-[#e0e6dd] bg-white"><div className="flex items-center justify-between border-b border-[#edf0eb] px-4 py-3.5"><div><h2 className="font-semibold text-[#2a4435]">Carrinho atual</h2><p className="mt-0.5 text-xs text-[#7d8a82]">{cart.length ? `${cart.length} tipo(s) de produto` : "Aguardando itens"}</p></div>{cart.length > 0 && <button onClick={cancelSale} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-[#a75b52] hover:bg-[#fff1ef]"><X className="size-3.5"/>Cancelar</button>}</div>{cart.length ? <div>{cart.map(item => <CartLine key={item.product.id} item={item} selected={item.product.id === selectedProductId} onSelect={() => setSelectedProductId(item.product.id)} onQuantityChange={value => updateQuantity(item.product.id, value, item.product.unit)} onRemove={() => removeItem(item.product.id)}/>)}</div> : <div className="grid min-h-[220px] place-items-center px-6 text-center"><div><div className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#e9efec] text-[#436253]"><ShoppingBasket className="size-6"/></div><p className="mt-4 text-sm font-semibold text-[#304a3a]">Carrinho vazio</p><p className="mt-1 text-xs leading-5 text-[#7d8b82]">Use o leitor de código ou pesquise um produto para iniciar a venda.</p></div></div>}</article></div><aside className="self-start rounded-2xl border border-[#cfdfc9] bg-white p-5 shadow-[0_8px_26px_rgba(26,55,38,0.06)] xl:sticky xl:top-[100px]"><div className="flex items-center gap-2"><div className="grid size-9 place-items-center rounded-xl bg-[#e5f2d6] text-[#2d6146]"><ReceiptText className="size-4.5"/></div><div><h2 className="font-semibold text-[#213e2e]">Resumo da venda</h2><p className="text-xs text-[#7d8a82]">Confira antes de finalizar.</p></div></div><Separator className="my-5"/><div className="space-y-3 text-sm"><div className="flex justify-between text-[#728078]"><span>Itens</span><span>{cart.reduce((sum, item) => sum + item.quantity, 0).toLocaleString("pt-BR", { maximumFractionDigits: 3 })}</span></div><div className="flex justify-between text-[#728078]"><span>Produtos diferentes</span><span>{cart.length}</span></div></div><div className="my-5 rounded-2xl bg-[#f3f8ef] px-4 py-4"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#607b69]">Total</p><p className="mt-1 text-3xl font-semibold tracking-tight text-[#193c32]">{formatCurrency(total)}</p></div><Button onClick={() => setPaymentOpen(true)} disabled={!cart.length} className="h-12 w-full rounded-xl bg-[#193c32] text-sm font-semibold hover:bg-[#245542]"><Banknote className="mr-2 size-4"/>Finalizar venda <span className="ml-auto rounded-md bg-white/15 px-1.5 py-0.5 text-[10px]">F4</span></Button><div className="mt-5 rounded-xl border border-dashed border-[#d5e0d2] bg-[#fafcf8] p-3"><div className="flex items-center gap-2"><Keyboard className="size-4 text-[#537865]"/><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#567061]">Atalhos rápidos</p></div><div className="mt-2.5 grid grid-cols-2 gap-y-2 text-xs text-[#69786f]"><span><kbd className="mr-1 rounded border bg-white px-1.5 py-0.5 font-sans text-[10px] font-semibold">F2</kbd>Bipar código</span><span><kbd className="mr-1 rounded border bg-white px-1.5 py-0.5 font-sans text-[10px] font-semibold">F3</kbd>Buscar</span><span><kbd className="mr-1 rounded border bg-white px-1.5 py-0.5 font-sans text-[10px] font-semibold">Del</kbd>Remover item</span><span><kbd className="mr-1 rounded border bg-white px-1.5 py-0.5 font-sans text-[10px] font-semibold">Esc</kbd>Cancelar</span></div></div></aside></section><PaymentDialog open={paymentOpen} total={total} onOpenChange={setPaymentOpen} onConfirm={confirmSale} loading={finalizeSale.isPending}/></div>;
}
