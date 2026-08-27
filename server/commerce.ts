import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  inArray,
  like,
  lte,
  or,
  sql,
  sum,
} from "drizzle-orm";
import type { MySqlTransaction } from "drizzle-orm/mysql-core";
import { getDb } from "./db";
import { products, saleItems, sales } from "../drizzle/schema";

export type ProductPayload = {
  name: string;
  description?: string | null;
  costPrice: number;
  salePrice: number;
  unit: "un" | "kg";
  stockCurrent: number;
  stockMinimum: number;
  barcode?: string | null;
  active?: boolean;
};

export type SalePayload = {
  items: Array<{ productId: number; quantity: number }>;
  paymentMethod: "dinheiro" | "debito" | "credito" | "pix";
  amountPaid?: number;
};

const toNumber = (value: number | string | null | undefined) => Number(value ?? 0);
const money = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const quantity = (value: number) => Math.round((value + Number.EPSILON) * 1000) / 1000;

function productValues(input: ProductPayload) {
  return {
    name: input.name.trim(),
    description: input.description?.trim() || null,
    costPrice: money(input.costPrice).toFixed(2),
    salePrice: money(input.salePrice).toFixed(2),
    unit: input.unit,
    stockCurrent: quantity(input.stockCurrent).toFixed(3),
    stockMinimum: quantity(input.stockMinimum).toFixed(3),
    barcode: input.barcode?.trim() || null,
    active: input.active ?? true,
  };
}

export function calculateCartTotals(
  items: Array<{ unitPrice: number; quantity: number }>,
  amountPaid = 0,
) {
  const total = money(
    items.reduce((acc, item) => acc + money(item.unitPrice * item.quantity), 0),
  );
  const paid = money(amountPaid);
  return {
    total,
    amountPaid: paid,
    change: Math.max(0, money(paid - total)),
    amountDue: Math.max(0, money(total - paid)),
  };
}

export async function listProducts(search?: string) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");

  const term = search?.trim();
  const where = term
    ? or(like(products.name, `%${term}%`), like(products.barcode, `%${term}%`))
    : undefined;

  return db.select().from(products).where(where).orderBy(asc(products.name));
}

export async function getProductByBarcode(barcode: string) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");

  const result = await db
    .select()
    .from(products)
    .where(and(eq(products.barcode, barcode.trim()), eq(products.active, true)))
    .limit(1);

  return result[0] ?? null;
}

export async function createProduct(input: ProductPayload) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");

  const result = await db.insert(products).values(productValues(input));
  return { id: Number(result[0].insertId) };
}

export async function updateProduct(id: number, input: ProductPayload) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");

  await db.update(products).set(productValues(input)).where(eq(products.id, id));
  return { id };
}

export async function listLowStockProducts() {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");

  return db
    .select()
    .from(products)
    .where(and(eq(products.active, true), lte(products.stockCurrent, products.stockMinimum)))
    .orderBy(asc(products.stockCurrent), asc(products.name));
}

export async function getDashboardSummary() {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");

  const [productCount] = await db
    .select({ total: count() })
    .from(products)
    .where(eq(products.active, true));
  const lowStock = await listLowStockProducts();
  const [salesSummary] = await db
    .select({ total: sum(sales.totalAmount), count: count() })
    .from(sales)
    .where(gte(sales.completedAt, new Date(new Date().setHours(0, 0, 0, 0))));

  return {
    activeProducts: productCount?.total ?? 0,
    lowStockCount: lowStock.length,
    lowStock,
    todaySalesCount: salesSummary?.count ?? 0,
    todaySalesTotal: toNumber(salesSummary?.total),
  };
}

export async function listRecentSales() {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");

  return db.select().from(sales).orderBy(desc(sales.completedAt)).limit(10);
}

type Transaction = MySqlTransaction<any, any, any, any>;

async function decrementProductStock(
  tx: Transaction,
  productId: number,
  requestedQuantity: number,
) {
  const result = await tx
    .update(products)
    .set({
      stockCurrent: sql`${products.stockCurrent} - ${requestedQuantity.toFixed(3)}`,
    })
    .where(
      and(
        eq(products.id, productId),
        eq(products.active, true),
        gte(products.stockCurrent, requestedQuantity.toFixed(3)),
      ),
    );

  return Number(result[0].affectedRows) > 0;
}

export async function finalizeSale(input: SalePayload) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");

  const mergedItems = Array.from(
    input.items.reduce((map, item) => {
      const current = map.get(item.productId) ?? 0;
      map.set(item.productId, quantity(current + item.quantity));
      return map;
    }, new Map<number, number>()),
  ).map(([productId, itemQuantity]) => ({ productId, quantity: itemQuantity }));

  if (!mergedItems.length) throw new Error("Inclua ao menos um item na venda.");

  return db.transaction(async tx => {
    const ids = mergedItems.map(item => item.productId);
    const selectedProducts = await tx
      .select()
      .from(products)
      .where(and(inArray(products.id, ids), eq(products.active, true)));

    if (selectedProducts.length !== ids.length) {
      throw new Error("Um ou mais produtos não estão disponíveis para venda.");
    }

    const productById = new Map(selectedProducts.map(product => [product.id, product]));
    const computedItems = mergedItems.map(item => {
      const product = productById.get(item.productId);
      if (!product) throw new Error("Produto não encontrado.");
      return {
        product,
        quantity: item.quantity,
        unitPrice: toNumber(product.salePrice),
        subtotal: money(toNumber(product.salePrice) * item.quantity),
      };
    });

    const totals = calculateCartTotals(
      computedItems.map(item => ({ unitPrice: item.unitPrice, quantity: item.quantity })),
      input.amountPaid ?? 0,
    );

    if (input.paymentMethod === "dinheiro" && totals.amountDue > 0) {
      throw new Error("O valor recebido é menor que o total da compra.");
    }

    const paidAmount =
      input.paymentMethod === "dinheiro" ? totals.amountPaid : totals.total;
    const changeAmount = input.paymentMethod === "dinheiro" ? totals.change : 0;

    for (const item of computedItems) {
      const decremented = await decrementProductStock(tx, item.product.id, item.quantity);
      if (!decremented) {
        throw new Error(`Estoque insuficiente para ${item.product.name}.`);
      }
    }

    const saleResult = await tx.insert(sales).values({
      paymentMethod: input.paymentMethod,
      totalAmount: totals.total.toFixed(2),
      amountPaid: paidAmount.toFixed(2),
      changeAmount: changeAmount.toFixed(2),
      itemCount: computedItems.length,
    });
    const saleId = Number(saleResult[0].insertId);

    await tx.insert(saleItems).values(
      computedItems.map(item => ({
        saleId,
        productId: item.product.id,
        productName: item.product.name,
        barcode: item.product.barcode,
        unit: item.product.unit,
        unitPrice: item.unitPrice.toFixed(2),
        quantity: item.quantity.toFixed(3),
        subtotal: item.subtotal.toFixed(2),
      })),
    );

    return {
      saleId,
      total: totals.total,
      amountPaid: paidAmount,
      change: changeAmount,
    };
  });
}
