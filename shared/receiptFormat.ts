export function money(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function buildSaleReceiptPayment(paymentMethod: string, total: number, amountPaid: number, change: number) {
  return {
    paymentMethod: paymentMethod.toUpperCase(),
    total: money(total),
    amountPaid: money(amountPaid),
    change: Math.max(0, money(change)),
    showChange: change > 0,
  };
}

export function buildClosingReceiptDifference(expected: number, counted: number) {
  return money(counted - expected);
}
