import { ensureSupabaseSuccess, getSupabase } from "./supabase";

export type ProductPayload = {
  name: string;
  description?: string | null;
  costPrice: number;
  salePrice: number;
  unit: "un" | "kg";
  stockCurrent: number;
  stockMinimum: number;
  categoryId?: number | null;
  useCategoryMinimum?: boolean;
  barcode?: string | null;
  active?: boolean;
};

export type StockAdjustmentPayload = {
  productId: number;
  newQuantity: number;
  reason?: string;
  adjustedBy: number;
};

export type SalePayload = {
  items: Array<{ productId: number; quantity: number }>;
  paymentMethod: "dinheiro" | "debito" | "credito" | "pix";
  amountPaid?: number;
  clientSaleId?: string;
};

export type CashSummary = {
  closureDate: string;
  salesCount: number;
  cash: number;
  debit: number;
  credit: number;
  pix: number;
  total: number;
};

export type CashClosingPayload = {
  closureDate: string;
  countedCash: number;
  countedDebit: number;
  countedCredit: number;
  countedPix: number;
  notes?: string;
  closedBy: number;
};

export type InventoryImportRow = {
  rowNumber: number;
  inventoryCode: string;
  barcode?: string | null;
  name: string;
  unit: "un" | "kg";
  stockCurrent: number;
  unitPrice: number;
};

type SupabaseProduct = {
  id: number;
  name: string;
  description: string | null;
  cost_price: string | number;
  sale_price: string | number;
  unit: "un" | "kg";
  stock_current: string | number;
  stock_minimum: string | number;
  category_id: number | null;
  use_category_minimum: boolean;
  inventory_code: string | null;
  barcode: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

type SupabaseCategory = {
  id: number;
  name: string;
  stock_minimum: string | number;
  created_at: string;
  updated_at: string;
};

type SupabaseSale = {
  id: number;
  client_sale_id: string;
  payment_method: "dinheiro" | "debito" | "credito" | "pix";
  total_amount: string | number;
  amount_paid: string | number;
  change_amount: string | number;
  item_count: number;
  completed_at: string;
};

type SupabaseSaleItem = {
  id: number;
  sale_id: number;
  product_id: number;
  product_name: string;
  barcode: string | null;
  unit: "un" | "kg";
  unit_price: string | number;
  quantity: string | number;
  subtotal: string | number;
};

const toNumber = (value: number | string | null | undefined) => Number(value ?? 0);
const money = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const quantity = (value: number) => Math.round((value + Number.EPSILON) * 1000) / 1000;

function mapCategory(category: SupabaseCategory) {
  return { id: Number(category.id), name: category.name, stockMinimum: quantity(toNumber(category.stock_minimum)), createdAt: category.created_at, updatedAt: category.updated_at };
}

function mapProduct(product: SupabaseProduct, categories = new Map<number, SupabaseCategory>()) {
  const category = product.category_id ? categories.get(product.category_id) : undefined;
  const effectiveStockMinimum = product.use_category_minimum && category ? quantity(toNumber(category.stock_minimum)) : quantity(toNumber(product.stock_minimum));
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    costPrice: product.cost_price,
    salePrice: product.sale_price,
    unit: product.unit,
    stockCurrent: product.stock_current,
    stockMinimum: product.stock_minimum,
    effectiveStockMinimum,
    categoryId: product.category_id,
    usesCategoryMinimum: product.use_category_minimum,
    category: category ? mapCategory(category) : null,
    inventoryCode: product.inventory_code,
    barcode: product.barcode,
    active: product.active,
    createdAt: product.created_at,
    updatedAt: product.updated_at,
  };
}

function mapSale(sale: SupabaseSale) {
  return {
    id: sale.id,
    clientSaleId: sale.client_sale_id,
    paymentMethod: sale.payment_method,
    totalAmount: sale.total_amount,
    amountPaid: sale.amount_paid,
    changeAmount: sale.change_amount,
    itemCount: sale.item_count,
    completedAt: new Date(sale.completed_at),
  };
}

function productValues(input: ProductPayload) {
  return {
    name: input.name.trim(),
    description: input.description?.trim() || null,
    cost_price: money(input.costPrice),
    sale_price: money(input.salePrice),
    unit: input.unit,
    stock_current: quantity(input.stockCurrent),
    stock_minimum: quantity(input.stockMinimum),
    ...(input.categoryId !== undefined ? { category_id: input.categoryId } : {}),
    ...(input.useCategoryMinimum !== undefined ? { use_category_minimum: input.useCategoryMinimum } : {}),
    barcode: input.barcode?.trim() || null,
    active: input.active ?? true,
    updated_at: new Date().toISOString(),
  };
}

function safeSearchTerm(value: string) {
  return value.replace(/[,%()]/g, "").trim();
}

export function calculateCartTotals(items: Array<{ unitPrice: number; quantity: number }>, amountPaid = 0) {
  const total = money(items.reduce((acc, item) => acc + money(item.unitPrice * item.quantity), 0));
  const paid = money(amountPaid);
  return { total, amountPaid: paid, change: Math.max(0, money(paid - total)), amountDue: Math.max(0, money(total - paid)) };
}

export function calculateCashDifferences(summary: CashSummary, counted: Pick<CashClosingPayload, "countedCash" | "countedDebit" | "countedCredit" | "countedPix">) {
  const cash = money(counted.countedCash - summary.cash);
  const debit = money(counted.countedDebit - summary.debit);
  const credit = money(counted.countedCredit - summary.credit);
  const pix = money(counted.countedPix - summary.pix);
  return { cash, debit, credit, pix, total: money(cash + debit + credit + pix) };
}

export function calculateStockAdjustment(previousQuantity: number, resultingQuantity: number) {
  const previous = quantity(previousQuantity);
  const resulting = quantity(resultingQuantity);
  return { previousQuantity: previous, resultingQuantity: resulting, adjustmentQuantity: quantity(resulting - previous) };
}

function mapCashSummary(value: Record<string, unknown>, closureDate: string): CashSummary {
  return {
    closureDate: String(value.closureDate ?? closureDate),
    salesCount: Number(value.salesCount ?? 0),
    cash: money(toNumber(value.cash as string | number | null)),
    debit: money(toNumber(value.debit as string | number | null)),
    credit: money(toNumber(value.credit as string | number | null)),
    pix: money(toNumber(value.pix as string | number | null)),
    total: money(toNumber(value.total as string | number | null)),
  };
}

export async function listProducts(search?: string, categoryId?: number) {
  const supabase = getSupabase();
  const term = search ? safeSearchTerm(search) : "";
  let query = supabase.from("products").select("*").order("name", { ascending: true });
  if (term) query = query.or(`name.ilike.%${term}%,barcode.ilike.%${term}%,inventory_code.ilike.%${term}%`);
  if (categoryId) query = query.eq("category_id", categoryId);
  const [{ data, error }, categories] = await Promise.all([query, listCategories()]);
  ensureSupabaseSuccess(error);
  const categoryMap = new Map(categories.map(category => [category.id, { id: category.id, name: category.name, stock_minimum: category.stockMinimum, created_at: category.createdAt, updated_at: category.updatedAt }]));
  return ((data ?? []) as SupabaseProduct[]).map(product => mapProduct(product, categoryMap));
}

export async function getProductByBarcode(barcode: string) {
  const [{ data, error }, categories] = await Promise.all([getSupabase().from("products").select("*").eq("barcode", barcode.trim()).eq("active", true).maybeSingle(), listCategories()]);
  ensureSupabaseSuccess(error);
  const categoryMap = new Map(categories.map(category => [category.id, { id: category.id, name: category.name, stock_minimum: category.stockMinimum, created_at: category.createdAt, updated_at: category.updatedAt }]));
  return data ? mapProduct(data as SupabaseProduct, categoryMap) : null;
}

export async function listCategories() {
  const { data, error } = await getSupabase().from("categories").select("*").order("name", { ascending: true });
  ensureSupabaseSuccess(error);
  return ((data ?? []) as SupabaseCategory[]).map(mapCategory);
}

export async function createCategory(input: { name: string; stockMinimum: number }) {
  const { data, error } = await getSupabase().from("categories").insert({ name: input.name.trim(), stock_minimum: quantity(input.stockMinimum) }).select("id").single();
  ensureSupabaseSuccess(error);
  return { id: Number(data?.id) };
}

export async function updateCategory(id: number, input: { name: string; stockMinimum: number }) {
  const { error } = await getSupabase().from("categories").update({ name: input.name.trim(), stock_minimum: quantity(input.stockMinimum), updated_at: new Date().toISOString() }).eq("id", id);
  ensureSupabaseSuccess(error);
  return { id };
}

export async function createProduct(input: ProductPayload) {
  const { data, error } = await getSupabase().from("products").insert(productValues(input)).select("id").single();
  ensureSupabaseSuccess(error);
  if (!data) throw new Error("O banco principal não retornou o produto criado.");
  return { id: Number(data.id) };
}

export async function updateProduct(id: number, input: ProductPayload) {
  const { error } = await getSupabase().from("products").update(productValues(input)).eq("id", id);
  ensureSupabaseSuccess(error);
  return { id };
}

export async function adjustProductStock(input: StockAdjustmentPayload) {
  const { data, error } = await getSupabase().rpc("adjust_product_stock", {
    p_product_id: input.productId,
    p_new_quantity: quantity(input.newQuantity),
    p_reason: input.reason?.trim() || "Ajuste manual de estoque",
    p_user_id: input.adjustedBy,
  });
  ensureSupabaseSuccess(error);
  const result = (typeof data === "string" ? JSON.parse(data) : data ?? {}) as Record<string, unknown>;
  return {
    productId: Number(result.productId),
    ...calculateStockAdjustment(
    toNumber(result.previousQuantity as string | number),
    toNumber(result.resultingQuantity as string | number),
    ),
  };
}

export async function importInventory(items: InventoryImportRow[], stockMinimum: number) {
  const supabase = getSupabase();
  const codes = Array.from(new Set(items.map(item => item.inventoryCode).filter(Boolean)));
  const barcodes = Array.from(new Set(items.map(item => item.barcode).filter((barcode): barcode is string => Boolean(barcode))));
  if (codes.length !== items.length) throw new Error("A importação contém códigos internos duplicados.");
  if (barcodes.length !== items.filter(item => item.barcode).length) throw new Error("A importação contém códigos de barras duplicados.");

  const [{ data: byCode, error: codeError }, { data: byBarcode, error: barcodeError }] = await Promise.all([
    supabase.from("products").select("*").in("inventory_code", codes),
    barcodes.length ? supabase.from("products").select("*").in("barcode", barcodes) : Promise.resolve({ data: [], error: null }),
  ]);
  ensureSupabaseSuccess(codeError);
  ensureSupabaseSuccess(barcodeError);
  const existing = [...((byCode ?? []) as SupabaseProduct[]), ...((byBarcode ?? []) as SupabaseProduct[])];
  const existingByCode = new Map(existing.filter(product => product.inventory_code).map(product => [product.inventory_code!, product]));
  const existingByBarcode = new Map(existing.filter(product => product.barcode).map(product => [product.barcode!, product]));
  const errors: Array<{ rowNumber: number; message: string }> = [];
  const createRows: Array<Record<string, unknown>> = [];
  const updateRows: Array<{ id: number; values: Record<string, unknown> }> = [];

  for (const item of items) {
    const byInternalCode = existingByCode.get(item.inventoryCode);
    const byScannedCode = item.barcode ? existingByBarcode.get(item.barcode) : undefined;
    if (byInternalCode && byScannedCode && byInternalCode.id !== byScannedCode.id) {
      errors.push({ rowNumber: item.rowNumber, message: "O código interno e o código de barras correspondem a produtos diferentes." });
      continue;
    }
    const matched = byInternalCode ?? byScannedCode;
    const values = { name: item.name.trim(), unit: item.unit, stock_current: quantity(item.stockCurrent), inventory_code: item.inventoryCode, barcode: item.barcode?.trim() || null, active: true, updated_at: new Date().toISOString() };
    if (matched) updateRows.push({ id: matched.id, values: { ...values, sale_price: money(item.unitPrice) } });
    else createRows.push({ ...values, description: null, cost_price: money(item.unitPrice), sale_price: money(item.unitPrice), stock_minimum: quantity(stockMinimum) });
  }

  if (createRows.length) {
    const { error } = await supabase.from("products").insert(createRows);
    ensureSupabaseSuccess(error);
  }
  for (const update of updateRows) {
    const { error } = await supabase.from("products").update(update.values).eq("id", update.id);
    ensureSupabaseSuccess(error);
  }
  return { created: createRows.length, updated: updateRows.length, rejected: errors.length, errors: errors.slice(0, 30) };
}

export async function listLowStockProducts() {
  const products = await listProducts();
  return products.filter(product => product.active && toNumber(product.stockCurrent) <= product.effectiveStockMinimum).sort((left, right) => toNumber(left.stockCurrent) - toNumber(right.stockCurrent) || left.name.localeCompare(right.name));
}

export async function getDashboardSummary() {
  const [products, lowStock, sales] = await Promise.all([
    listProducts(),
    listLowStockProducts(),
    getSupabase().from("sales").select("total_amount").gte("completed_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
  ]);
  ensureSupabaseSuccess(sales.error);
  return { activeProducts: products.filter(product => product.active).length, lowStockCount: lowStock.length, lowStock, todaySalesCount: sales.data?.length ?? 0, todaySalesTotal: (sales.data ?? []).reduce((sum, sale) => sum + toNumber(sale.total_amount), 0) };
}

export async function listRecentSales() {
  const { data, error } = await getSupabase().from("sales").select("*").order("completed_at", { ascending: false }).limit(10);
  ensureSupabaseSuccess(error);
  return ((data ?? []) as SupabaseSale[]).map(mapSale);
}

export async function getSaleReceipt(saleId: number) {
  const supabase = getSupabase();
  const [{ data: sale, error: saleError }, { data: items, error: itemsError }] = await Promise.all([
    supabase.from("sales").select("*").eq("id", saleId).single(),
    supabase.from("sale_items").select("*").eq("sale_id", saleId).order("id", { ascending: true }),
  ]);
  ensureSupabaseSuccess(saleError);
  ensureSupabaseSuccess(itemsError);
  return {
    ...mapSale(sale as SupabaseSale),
    items: ((items ?? []) as SupabaseSaleItem[]).map(item => ({
      id: Number(item.id),
      productName: item.product_name,
      barcode: item.barcode,
      unit: item.unit,
      unitPrice: money(toNumber(item.unit_price)),
      quantity: quantity(toNumber(item.quantity)),
      subtotal: money(toNumber(item.subtotal)),
    })),
  };
}

export async function finalizeSale(input: SalePayload) {
  if (!input.items.length) throw new Error("Inclua ao menos um item na venda.");
  const operationId = input.clientSaleId ?? crypto.randomUUID();
  const { data, error } = await getSupabase().rpc("finalize_sale", {
    p_operation_id: operationId,
    p_payment_method: input.paymentMethod,
    p_amount_paid: input.amountPaid ?? 0,
    p_items: input.items,
  });
  ensureSupabaseSuccess(error);
  const result = typeof data === "string" ? JSON.parse(data) : data;
  return { saleId: Number(result.saleId), total: toNumber(result.total), amountPaid: toNumber(result.amountPaid), change: toNumber(result.change), clientSaleId: operationId };
}

export async function getCashSummary(closureDate: string) {
  const { data, error } = await getSupabase().rpc("get_cash_summary", { p_closure_date: closureDate });
  ensureSupabaseSuccess(error);
  const result = typeof data === "string" ? JSON.parse(data) : data;
  return mapCashSummary((result ?? {}) as Record<string, unknown>, closureDate);
}

export async function closeCashDay(input: CashClosingPayload) {
  const { data, error } = await getSupabase().rpc("close_cash_day", {
    p_closure_date: input.closureDate,
    p_counted_cash: money(input.countedCash),
    p_counted_debit: money(input.countedDebit),
    p_counted_credit: money(input.countedCredit),
    p_counted_pix: money(input.countedPix),
    p_notes: input.notes?.trim() || "",
    p_closed_by: input.closedBy,
  });
  ensureSupabaseSuccess(error);
  const result = (typeof data === "string" ? JSON.parse(data) : data ?? {}) as Record<string, unknown>;
  const summary = mapCashSummary(result, input.closureDate);
  return { id: Number(result.id), closedAt: String(result.closedAt ?? new Date().toISOString()), summary, differences: calculateCashDifferences(summary, input) };
}

export async function listCashClosings() {
  const { data, error } = await getSupabase().from("cash_closings").select("*").order("closure_date", { ascending: false }).limit(14);
  ensureSupabaseSuccess(error);
  return (data ?? []).map((closing: Record<string, unknown>) => ({
    id: Number(closing.id),
    closureDate: String(closing.closure_date),
    expectedCash: money(toNumber(closing.expected_cash as string | number)),
    expectedDebit: money(toNumber(closing.expected_debit as string | number)),
    expectedCredit: money(toNumber(closing.expected_credit as string | number)),
    expectedPix: money(toNumber(closing.expected_pix as string | number)),
    countedCash: money(toNumber(closing.counted_cash as string | number)),
    countedDebit: money(toNumber(closing.counted_debit as string | number)),
    countedCredit: money(toNumber(closing.counted_credit as string | number)),
    countedPix: money(toNumber(closing.counted_pix as string | number)),
    expectedTotal: money(toNumber(closing.expected_cash as string | number) + toNumber(closing.expected_debit as string | number) + toNumber(closing.expected_credit as string | number) + toNumber(closing.expected_pix as string | number)),
    countedTotal: money(toNumber(closing.counted_cash as string | number) + toNumber(closing.counted_debit as string | number) + toNumber(closing.counted_credit as string | number) + toNumber(closing.counted_pix as string | number)),
    differenceTotal: money(toNumber(closing.difference_total as string | number)),
    salesCount: Number(closing.sales_count ?? 0),
    notes: closing.notes ? String(closing.notes) : null,
    closedAt: String(closing.closed_at),
  }));
}
