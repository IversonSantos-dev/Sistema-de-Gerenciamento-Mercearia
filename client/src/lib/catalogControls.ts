export function buildCatalogQueryInput(search: string, categoryFilter: string) {
  const categoryId = Number(categoryFilter);
  return {
    search: search.trim() || undefined,
    categoryId: categoryFilter !== "all" && Number.isInteger(categoryId) && categoryId > 0 ? categoryId : undefined,
  };
}

export function stepStockQuantity(currentInput: string, fallbackQuantity: number, increment: number) {
  const enteredQuantity = currentInput.trim() === "" ? Number.NaN : Number(currentInput);
  const baseQuantity = Number.isFinite(enteredQuantity) && enteredQuantity >= 0 ? enteredQuantity : fallbackQuantity;
  return Math.max(0, Math.round((baseQuantity + increment) * 1000) / 1000);
}
