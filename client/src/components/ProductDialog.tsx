import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { emptyProductForm, ProductFormValues, ProductRecord, productToForm } from "@/lib/commerce";
import { trpc } from "@/lib/trpc";
import { Barcode, FolderTree, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type ProductDialogProps = {
  open: boolean;
  product?: ProductRecord | null;
  onOpenChange: (open: boolean) => void;
};

export function ProductDialog({ open, product, onOpenChange }: ProductDialogProps) {
  const [form, setForm] = useState<ProductFormValues>(emptyProductForm);
  const utils = trpc.useUtils();
  const createProduct = trpc.commerce.products.create.useMutation();
  const updateProduct = trpc.commerce.products.update.useMutation();
  const { data: categories = [] } = trpc.commerce.categories.list.useQuery();
  const isEditing = Boolean(product);

  useEffect(() => {
    setForm(product ? productToForm(product) : emptyProductForm);
  }, [product, open]);

  function setField<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setForm(current => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const data = {
      name: form.name,
      description: form.description || null,
      costPrice: Number(form.costPrice),
      salePrice: Number(form.salePrice),
      unit: form.unit,
      stockCurrent: Number(form.stockCurrent),
      stockMinimum: Number(form.stockMinimum),
      categoryId: form.categoryId ? Number(form.categoryId) : null,
      useCategoryMinimum: form.categoryId ? form.useCategoryMinimum : false,
      scalePlu: form.scalePlu ? Number(form.scalePlu) : null,
      barcode: form.barcode,
    };
    if (!Number.isFinite(data.costPrice) || !Number.isFinite(data.salePrice) || !Number.isFinite(data.stockCurrent) || !Number.isFinite(data.stockMinimum) || (data.scalePlu !== null && (!Number.isInteger(data.scalePlu) || data.scalePlu < 1 || data.scalePlu > 999999))) {
      toast.error("Preencha preço e estoque com valores numéricos válidos.");
      return;
    }
    try {
      if (product) await updateProduct.mutateAsync({ id: product.id, data });
      else await createProduct.mutateAsync(data);
      await Promise.all([utils.commerce.products.list.invalidate(), utils.commerce.products.lowStock.invalidate(), utils.commerce.dashboard.invalidate()]);
      toast.success(product ? "Produto atualizado." : "Produto cadastrado e pronto para venda.");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar o produto.");
    }
  }

  const saving = createProduct.isPending || updateProduct.isPending;
  const selectedCategory = categories.find(category => String(category.id) === form.categoryId);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto border-[#dce4d9] p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-[#e8ece6] px-6 pb-5 pt-6">
          <DialogTitle className="text-xl text-[#193c32]">{isEditing ? "Editar produto" : "Novo produto"}</DialogTitle>
          <DialogDescription>Registre os dados comerciais e o nível de reposição deste item.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-5 px-6 py-6">
          <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
            <div className="space-y-2"><Label htmlFor="product-name">Nome do produto</Label><Input id="product-name" autoFocus value={form.name} onChange={e => setField("name", e.target.value)} placeholder="Ex.: Café moído 500 g" className="h-11" /></div>
            <div className="space-y-2"><Label htmlFor="product-unit">Unidade de venda</Label><Select value={form.unit} onValueChange={value => setField("unit", value as "un" | "kg")}><SelectTrigger id="product-unit" className="h-11"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="un">Unidade</SelectItem><SelectItem value="kg">Quilograma (kg)</SelectItem></SelectContent></Select></div>
          </div>
          <div className="space-y-2"><Label htmlFor="product-description">Descrição <span className="font-normal text-muted-foreground">(opcional)</span></Label><Textarea id="product-description" value={form.description} onChange={e => setField("description", e.target.value)} placeholder="Marca, tamanho ou observações internas." className="min-h-20 resize-none" /></div>
          <div className="rounded-xl border border-[#dbe6d7] bg-[#f8fbf6] p-4">
            <Label htmlFor="product-category" className="flex items-center gap-2 text-[#254b3b]"><FolderTree className="size-4"/>Categoria</Label>
            <Select value={form.categoryId || "none"} onValueChange={value => { const categoryId = value === "none" ? "" : value; setForm(current => ({ ...current, categoryId, useCategoryMinimum: categoryId ? current.useCategoryMinimum : false })); }}><SelectTrigger id="product-category" className="mt-2 h-11 bg-white"><SelectValue placeholder="Sem categoria"/></SelectTrigger><SelectContent><SelectItem value="none">Sem categoria</SelectItem>{categories.map(category => <SelectItem key={category.id} value={String(category.id)}>{category.name} · mín. {category.stockMinimum}</SelectItem>)}</SelectContent></Select>
            {form.categoryId && <div className="mt-3 flex items-center justify-between gap-4 rounded-lg border border-[#d6e4d1] bg-white px-3 py-2.5"><div><p className="text-sm font-semibold text-[#355343]">Usar mínimo da categoria</p><p className="mt-0.5 text-xs text-[#718078]">{selectedCategory ? `${selectedCategory.name}: ${selectedCategory.stockMinimum} ${form.unit === "kg" ? "kg" : "un"}` : "Use o mínimo definido para esta categoria."}</p></div><Switch checked={form.useCategoryMinimum} onCheckedChange={value => setField("useCategoryMinimum", value)}/></div>}
          </div>
          <div className="rounded-xl border border-dashed border-[#cbdacb] bg-[#f7faf5] p-4">
            <Label htmlFor="product-barcode" className="flex items-center gap-2 text-[#254b3b]"><Barcode className="size-4" /> Código de barras</Label>
            <Input id="product-barcode" inputMode="numeric" value={form.barcode} onChange={e => setField("barcode", e.target.value.replace(/[^0-9]/g, ""))} placeholder="Bipe ou informe EAN-13 / UPC" className="mt-2 h-11 bg-white font-mono tracking-wide" />
            <p className="mt-2 text-xs text-[#66796b]">Leitores USB/Bluetooth em modo teclado preenchem este campo diretamente.</p>
            <div className="mt-4 border-t border-[#dbe6d7] pt-4"><Label htmlFor="product-scale-plu" className="text-xs text-[#345241]">PLU da balança <span className="font-normal text-muted-foreground">(opcional, para etiquetas futuras)</span></Label><Input id="product-scale-plu" inputMode="numeric" maxLength={6} value={form.scalePlu} onChange={e => setField("scalePlu", e.target.value.replace(/[^0-9]/g, ""))} placeholder="Ex.: 12345" className="mt-1.5 h-10 bg-white font-mono"/></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2"><Label htmlFor="product-cost">Preço de custo</Label><Input id="product-cost" type="number" min="0" step="0.01" inputMode="decimal" value={form.costPrice} onChange={e => setField("costPrice", e.target.value)} placeholder="0,00" className="h-11" /></div>
            <div className="space-y-2"><Label htmlFor="product-price">Preço de venda</Label><Input id="product-price" type="number" min="0.01" step="0.01" inputMode="decimal" value={form.salePrice} onChange={e => setField("salePrice", e.target.value)} placeholder="0,00" className="h-11" /></div>
            <div className="space-y-2"><Label htmlFor="product-stock">Estoque atual</Label><Input id="product-stock" type="number" min="0" step="0.001" inputMode="decimal" value={form.stockCurrent} onChange={e => setField("stockCurrent", e.target.value)} placeholder="0" className="h-11" /></div>
            <div className="space-y-2"><Label htmlFor="product-minimum">Estoque mínimo {form.useCategoryMinimum && <span className="font-normal text-[#5f806d]">(categoria ativa)</span>}</Label><Input id="product-minimum" type="number" min="0" step="0.001" inputMode="decimal" value={form.useCategoryMinimum && selectedCategory ? String(selectedCategory.stockMinimum) : form.stockMinimum} onChange={e => setField("stockMinimum", e.target.value)} placeholder="0" disabled={form.useCategoryMinimum} className="h-11" /></div>
          </div>
          <div className="flex flex-col-reverse gap-2 border-t border-[#e8ece6] pt-5 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-10 rounded-xl">Cancelar</Button><Button type="submit" disabled={saving} className="h-10 rounded-xl bg-[#193c32] hover:bg-[#245542]">{saving && <Loader2 className="mr-2 size-4 animate-spin" />}{isEditing ? "Salvar alterações" : "Cadastrar produto"}</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
