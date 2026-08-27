export type Unit = "un" | "kg";

export type ProductRecord = {
  id: number;
  name: string;
  description: string | null;
  costPrice: string | number;
  salePrice: string | number;
  unit: Unit;
  stockCurrent: string | number;
  stockMinimum: string | number;
  barcode: string | null;
  active: boolean;
};

export type ProductFormValues = {
  name: string;
  description: string;
  costPrice: string;
  salePrice: string;
  unit: Unit;
  stockCurrent: string;
  stockMinimum: string;
  barcode: string;
};

export const emptyProductForm: ProductFormValues = {
  name: "",
  description: "",
  costPrice: "",
  salePrice: "",
  unit: "un",
  stockCurrent: "",
  stockMinimum: "",
  barcode: "",
};

export function productToForm(product: ProductRecord): ProductFormValues {
  return {
    name: product.name,
    description: product.description ?? "",
    costPrice: String(product.costPrice),
    salePrice: String(product.salePrice),
    unit: product.unit,
    stockCurrent: String(product.stockCurrent),
    stockMinimum: String(product.stockMinimum),
    barcode: product.barcode ?? "",
  };
}

export function toNumber(value: string | number | null | undefined): number {
  return Number(value ?? 0);
}

export function formatCurrency(value: string | number | null | undefined) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(toNumber(value));
}

export function formatQuantity(value: string | number | null | undefined, unit: Unit) {
  const number = toNumber(value);
  const formatted = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: unit === "kg" ? 3 : 0,
    maximumFractionDigits: unit === "kg" ? 3 : 3,
  }).format(number);
  return `${formatted} ${unit === "kg" ? "kg" : "un"}`;
}

export function stockIsLow(product: Pick<ProductRecord, "stockCurrent" | "stockMinimum">) {
  return toNumber(product.stockCurrent) <= toNumber(product.stockMinimum);
}

export function normalizeScannerValue(value: string) {
  return value.replace(/\s/g, "").replace(/[^0-9]/g, "");
}
