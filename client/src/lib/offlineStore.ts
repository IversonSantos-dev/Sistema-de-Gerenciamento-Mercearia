import type { ProductRecord } from "./commerce";

const HANDLE_DATABASE = "mercearia-pdv-local-access";
const HANDLE_STORE = "authorized-folder";
const HANDLE_KEY = "cashier-folder";
const LOCAL_FILE_NAME = "pdv-local.json";

type LocalFileHandle = {
  getFile: () => Promise<File>;
  createWritable: () => Promise<{ write: (contents: string) => Promise<void>; close: () => Promise<void> }>;
};

type LocalDirectoryHandle = {
  name: string;
  getFileHandle: (name: string, options?: { create?: boolean }) => Promise<LocalFileHandle>;
  queryPermission?: (descriptor: { mode: "readwrite" }) => Promise<PermissionState>;
  requestPermission?: (descriptor: { mode: "readwrite" }) => Promise<PermissionState>;
};

type LocalFilePicker = (options: { mode: "readwrite" }) => Promise<LocalDirectoryHandle>;

export type PendingSale = {
  clientSaleId: string;
  items: Array<{ productId: number; quantity: number }>;
  paymentMethod: "dinheiro" | "debito" | "credito" | "pix";
  amountPaid: number;
  queuedAt: number;
};

export type LocalPdvData = {
  version: 1;
  updatedAt: number;
  products: ProductRecord[];
  pendingSales: PendingSale[];
};

export type LocalStoreStatus = { ready: boolean; folderName?: string };

function openHandleDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(HANDLE_DATABASE, 1);
    request.onerror = () => reject(request.error ?? new Error("Não foi possível recuperar a autorização da pasta local."));
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(HANDLE_STORE)) request.result.createObjectStore(HANDLE_STORE);
    };
    request.onsuccess = () => resolve(request.result);
  });
}

function requestResult<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Não foi possível acessar a autorização local."));
  });
}

function transactionFinished(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Não foi possível salvar a autorização local."));
    transaction.onabort = () => reject(transaction.error ?? new Error("A autorização da pasta foi interrompida."));
  });
}

async function getStoredDirectory() {
  const database = await openHandleDatabase();
  try {
    const transaction = database.transaction(HANDLE_STORE, "readonly");
    return await requestResult(transaction.objectStore(HANDLE_STORE).get(HANDLE_KEY)) as LocalDirectoryHandle | undefined;
  } finally {
    database.close();
  }
}

async function saveDirectory(directory: LocalDirectoryHandle) {
  const database = await openHandleDatabase();
  try {
    const transaction = database.transaction(HANDLE_STORE, "readwrite");
    transaction.objectStore(HANDLE_STORE).put(directory, HANDLE_KEY);
    await transactionFinished(transaction);
  } finally {
    database.close();
  }
}

async function permissionGranted(directory: LocalDirectoryHandle) {
  if (!directory.queryPermission) return true;
  return (await directory.queryPermission({ mode: "readwrite" })) === "granted";
}

async function requireAuthorizedDirectory() {
  const directory = await getStoredDirectory();
  if (!directory || !(await permissionGranted(directory))) throw new Error("Escolha e autorize a pasta do PDV para habilitar a operação em arquivo local.");
  return directory;
}

export function createEmptyLocalPdvData(): LocalPdvData {
  return { version: 1, updatedAt: Date.now(), products: [], pendingSales: [] };
}

export function parseLocalPdvData(value: string): LocalPdvData {
  if (!value.trim()) return createEmptyLocalPdvData();
  const data = JSON.parse(value) as Partial<LocalPdvData>;
  if (data.version !== 1 || !Array.isArray(data.products) || !Array.isArray(data.pendingSales)) throw new Error("O arquivo pdv-local.json não possui o formato esperado.");
  return { version: 1, updatedAt: Number(data.updatedAt) || Date.now(), products: data.products, pendingSales: data.pendingSales };
}

async function readLocalData() {
  const directory = await requireAuthorizedDirectory();
  const fileHandle = await directory.getFileHandle(LOCAL_FILE_NAME, { create: true });
  const file = await fileHandle.getFile();
  return { directory, data: parseLocalPdvData(await file.text()) };
}

async function writeLocalData(directory: LocalDirectoryHandle, data: LocalPdvData) {
  const fileHandle = await directory.getFileHandle(LOCAL_FILE_NAME, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(JSON.stringify({ ...data, updatedAt: Date.now() }, null, 2));
  await writable.close();
}

export async function selectLocalDirectory(): Promise<LocalStoreStatus> {
  const picker = (window as unknown as { showDirectoryPicker?: LocalFilePicker }).showDirectoryPicker;
  if (!picker) throw new Error("Este navegador não oferece suporte à escolha de pasta local. Use Chrome ou Edge atualizado no computador do caixa.");
  const directory = await picker({ mode: "readwrite" });
  if (directory.requestPermission && (await directory.requestPermission({ mode: "readwrite" })) !== "granted") throw new Error("A autorização de leitura e gravação da pasta é necessária para operar sem internet.");
  await saveDirectory(directory);
  const fileHandle = await directory.getFileHandle(LOCAL_FILE_NAME, { create: true });
  const file = await fileHandle.getFile();
  if (!file.size) await writeLocalData(directory, createEmptyLocalPdvData());
  return { ready: true, folderName: directory.name };
}

export async function getLocalStoreStatus(): Promise<LocalStoreStatus> {
  try {
    const directory = await getStoredDirectory();
    if (!directory || !(await permissionGranted(directory))) return { ready: false };
    await directory.getFileHandle(LOCAL_FILE_NAME, { create: true });
    return { ready: true, folderName: directory.name };
  } catch {
    return { ready: false };
  }
}

export async function readCachedProducts() {
  return (await readLocalData()).data.products;
}

export async function cacheProducts(products: ProductRecord[]) {
  const { directory, data } = await readLocalData();
  await writeLocalData(directory, { ...data, products });
}

export function applyStockReduction(products: ProductRecord[], items: PendingSale["items"]) {
  const quantityByProduct = new Map<number, number>();
  items.forEach(item => quantityByProduct.set(item.productId, (quantityByProduct.get(item.productId) ?? 0) + item.quantity));
  return products.map(product => {
    const quantity = quantityByProduct.get(product.id);
    return quantity ? { ...product, stockCurrent: Math.max(0, Number(product.stockCurrent) - quantity) } : product;
  });
}

export async function reduceCachedStock(items: PendingSale["items"]) {
  const { directory, data } = await readLocalData();
  const products = applyStockReduction(data.products, items);
  await writeLocalData(directory, { ...data, products });
  return products;
}

export async function listPendingSales() {
  return (await readLocalData()).data.pendingSales.sort((a, b) => a.queuedAt - b.queuedAt);
}

export async function queuePendingSale(sale: PendingSale) {
  const { directory, data } = await readLocalData();
  const withoutDuplicate = data.pendingSales.filter(item => item.clientSaleId !== sale.clientSaleId);
  await writeLocalData(directory, { ...data, pendingSales: [...withoutDuplicate, sale] });
}

export async function removePendingSale(clientSaleId: string) {
  const { directory, data } = await readLocalData();
  await writeLocalData(directory, { ...data, pendingSales: data.pendingSales.filter(sale => sale.clientSaleId !== clientSaleId) });
}
