import type { ProductRecord } from "./commerce";

const DATABASE_NAME = "mercearia-pdv-offline";
const DATABASE_VERSION = 1;
const CATALOG_STORE = "catalog";
const PENDING_SALES_STORE = "pending-sales";

export type PendingSale = {
  clientSaleId: string;
  items: Array<{ productId: number; quantity: number }>;
  paymentMethod: "dinheiro" | "debito" | "credito" | "pix";
  amountPaid: number;
  queuedAt: number;
};

type CatalogSnapshot = { key: "main"; products: ProductRecord[]; updatedAt: number };

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onerror = () => reject(request.error ?? new Error("Não foi possível abrir a base local."));
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(CATALOG_STORE)) database.createObjectStore(CATALOG_STORE, { keyPath: "key" });
      if (!database.objectStoreNames.contains(PENDING_SALES_STORE)) database.createObjectStore(PENDING_SALES_STORE, { keyPath: "clientSaleId" });
    };
    request.onsuccess = () => resolve(request.result);
  });
}

function requestResult<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Não foi possível acessar a base local."));
  });
}

function transactionFinished(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error ?? new Error("A gravação local foi interrompida."));
    transaction.onerror = () => reject(transaction.error ?? new Error("A gravação local falhou."));
  });
}

export async function readCachedProducts() {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(CATALOG_STORE, "readonly");
    const result = await requestResult(transaction.objectStore(CATALOG_STORE).get("main"));
    return (result as CatalogSnapshot | undefined)?.products ?? [];
  } finally {
    database.close();
  }
}

export async function cacheProducts(products: ProductRecord[]) {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(CATALOG_STORE, "readwrite");
    transaction.objectStore(CATALOG_STORE).put({ key: "main", products, updatedAt: Date.now() } satisfies CatalogSnapshot);
    await transactionFinished(transaction);
  } finally {
    database.close();
  }
}

export async function reduceCachedStock(items: PendingSale["items"]) {
  const products = await readCachedProducts();
  const updated = applyStockReduction(products, items);
  await cacheProducts(updated);
  return updated;
}

export function applyStockReduction(products: ProductRecord[], items: PendingSale["items"]) {
  const quantityByProduct = new Map<number, number>();
  items.forEach(item => quantityByProduct.set(item.productId, (quantityByProduct.get(item.productId) ?? 0) + item.quantity));
  return products.map(product => {
    const quantity = quantityByProduct.get(product.id);
    if (!quantity) return product;
    return { ...product, stockCurrent: Math.max(0, Number(product.stockCurrent) - quantity) };
  });
}

export async function listPendingSales() {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(PENDING_SALES_STORE, "readonly");
    const sales = await requestResult(transaction.objectStore(PENDING_SALES_STORE).getAll());
    return (sales as PendingSale[]).sort((a, b) => a.queuedAt - b.queuedAt);
  } finally {
    database.close();
  }
}

export async function queuePendingSale(sale: PendingSale) {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(PENDING_SALES_STORE, "readwrite");
    transaction.objectStore(PENDING_SALES_STORE).put(sale);
    await transactionFinished(transaction);
  } finally {
    database.close();
  }
}

export async function removePendingSale(clientSaleId: string) {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(PENDING_SALES_STORE, "readwrite");
    transaction.objectStore(PENDING_SALES_STORE).delete(clientSaleId);
    await transactionFinished(transaction);
  } finally {
    database.close();
  }
}
