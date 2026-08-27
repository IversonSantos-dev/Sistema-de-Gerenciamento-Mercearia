import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Edit3, FolderTree, Loader2, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Category = { id: number; name: string; stockMinimum: number | string };

export function CategoryDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [stockMinimum, setStockMinimum] = useState("0");
  const { data: categories = [], isLoading } = trpc.commerce.categories.list.useQuery();
  const createCategory = trpc.commerce.categories.create.useMutation();
  const updateCategory = trpc.commerce.categories.update.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => { if (!open) { setEditingId(null); setName(""); setStockMinimum("0"); } }, [open]);
  function edit(category: Category) { setEditingId(category.id); setName(category.name); setStockMinimum(String(category.stockMinimum)); }
  function newCategory() { setEditingId(null); setName(""); setStockMinimum("0"); }
  async function save() {
    const minimum = Number(stockMinimum.replace(",", "."));
    if (name.trim().length < 2 || !Number.isFinite(minimum) || minimum < 0) { toast.error("Informe o nome da categoria e um mínimo válido."); return; }
    try {
      if (editingId) await updateCategory.mutateAsync({ id: editingId, data: { name, stockMinimum: minimum } });
      else await createCategory.mutateAsync({ name, stockMinimum: minimum });
      await Promise.all([utils.commerce.categories.list.invalidate(), utils.commerce.products.list.invalidate(), utils.commerce.products.lowStock.invalidate(), utils.commerce.dashboard.invalidate()]);
      toast.success(editingId ? "Categoria atualizada." : "Categoria criada.");
      newCategory();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível salvar a categoria."); }
  }
  const saving = createCategory.isPending || updateCategory.isPending;
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[90vh] overflow-y-auto border-[#dce4d9] p-0 sm:max-w-xl"><DialogHeader className="border-b border-[#e8ece6] px-6 pb-5 pt-6"><DialogTitle className="flex items-center gap-2 text-xl text-[#193c32]"><FolderTree className="size-5"/>Categorias</DialogTitle><DialogDescription>Defina o estoque mínimo padrão. Produtos podem usar este valor ou manter uma exceção individual.</DialogDescription></DialogHeader><div className="space-y-5 px-6 py-5"><div className="rounded-xl border border-[#d9e5d5] bg-[#f7faf5] p-4"><p className="text-sm font-semibold text-[#30513f]">{editingId ? "Editar categoria" : "Nova categoria"}</p><div className="mt-3 grid gap-3 sm:grid-cols-[1fr_145px]"><div className="space-y-1.5"><Label htmlFor="category-name">Nome</Label><Input id="category-name" value={name} onChange={event => setName(event.target.value)} placeholder="Ex.: Bebidas" className="h-10 bg-white"/></div><div className="space-y-1.5"><Label htmlFor="category-min">Mínimo padrão</Label><Input id="category-min" type="number" min="0" step="0.001" value={stockMinimum} onChange={event => setStockMinimum(event.target.value)} className="h-10 bg-white"/></div></div><div className="mt-3 flex justify-end gap-2">{editingId && <Button onClick={newCategory} variant="outline" className="h-9 rounded-lg">Cancelar edição</Button>}<Button onClick={() => void save()} disabled={saving} className="h-9 rounded-lg bg-[#193c32] hover:bg-[#245542]">{saving ? <Loader2 className="mr-2 size-4 animate-spin"/> : <Plus className="mr-2 size-4"/>}{editingId ? "Salvar" : "Criar categoria"}</Button></div></div><section><div className="flex items-center justify-between"><p className="text-sm font-semibold text-[#355242]">Categorias configuradas</p><p className="text-xs text-[#75847a]">{categories.length} grupo(s)</p></div>{isLoading ? <div className="grid h-28 place-items-center"><Loader2 className="size-5 animate-spin text-[#597364]"/></div> : categories.length ? <div className="mt-3 divide-y divide-[#edf0eb] overflow-hidden rounded-xl border border-[#e3e9df]">{(categories as Category[]).map(category => <div key={category.id} className="flex items-center justify-between gap-3 bg-white px-4 py-3"><div><p className="text-sm font-semibold text-[#304a3a]">{category.name}</p><p className="mt-0.5 text-xs text-[#76847b]">Estoque mínimo padrão: {category.stockMinimum}</p></div><button onClick={() => edit(category)} aria-label={`Editar ${category.name}`} className="grid size-8 place-items-center rounded-lg border border-[#dce5d9] text-[#4c6d5b] hover:bg-[#f1f7ed]"><Edit3 className="size-3.5"/></button></div>)}</div> : <div className="mt-3 rounded-xl border border-dashed border-[#d7e2d4] p-5 text-center text-sm text-[#748278]">Crie uma categoria para definir seu mínimo padrão de estoque.</div>}</section><p className="rounded-lg bg-[#fff9e9] p-3 text-xs leading-5 text-[#746132]">Para uma reposição mais precisa, agrupe produtos com a mesma unidade de medida quando eles utilizarem o mínimo padrão da categoria.</p></div></DialogContent></Dialog>;
}
