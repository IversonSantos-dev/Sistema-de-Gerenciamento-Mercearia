export type ScaleBarcodeConfig = {
  enabled: boolean;
  prefix: string;
  pluDigits: number;
  amountDigits: number;
  includesCheckDigit: boolean;
  amountKind: "total_price";
};

export type DecodedScalePriceBarcode = {
  plu: number;
  totalPrice: number;
  rawCode: string;
};

export function calculateGs1CheckDigit(value: string) {
  if (!/^\d+$/.test(value)) throw new Error("O cálculo do dígito verificador requer somente números.");
  const sum = value.split("").reverse().reduce((total, digit, index) => total + Number(digit) * (index % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10;
}

export function validateScaleBarcodeConfig(config: ScaleBarcodeConfig) {
  const payloadLength = config.prefix.length + config.pluDigits + config.amountDigits;
  const expectedLength = payloadLength + (config.includesCheckDigit ? 1 : 0);
  return /^\d{2,4}$/.test(config.prefix) && config.pluDigits >= 3 && config.pluDigits <= 6 && config.amountDigits >= 4 && config.amountDigits <= 6 && expectedLength === 13;
}

export function decodeScalePriceBarcode(rawCode: string, config: ScaleBarcodeConfig): DecodedScalePriceBarcode | null {
  const code = rawCode.replace(/\D/g, "");
  if (!config.enabled || !validateScaleBarcodeConfig(config) || code.length !== 13 || !code.startsWith(config.prefix)) return null;
  const payload = config.includesCheckDigit ? code.slice(0, -1) : code;
  if (config.includesCheckDigit && Number(code.at(-1)) !== calculateGs1CheckDigit(payload)) return null;
  const pluStart = config.prefix.length;
  const plu = Number(payload.slice(pluStart, pluStart + config.pluDigits));
  const amount = Number(payload.slice(pluStart + config.pluDigits, pluStart + config.pluDigits + config.amountDigits));
  if (!Number.isInteger(plu) || plu <= 0 || !Number.isInteger(amount) || amount <= 0) return null;
  return { plu, totalPrice: Math.round(amount) / 100, rawCode: code };
}

export function deriveWeightFromScaleTotal(unitPrice: number, totalPrice: number) {
  if (!Number.isFinite(unitPrice) || unitPrice <= 0 || !Number.isFinite(totalPrice) || totalPrice <= 0) return null;
  const estimatedWeight = totalPrice / unitPrice;
  const candidates = Array.from({ length: 11 }, (_, index) => Math.round((estimatedWeight + (index - 5) / 1000) * 1000) / 1000).filter(value => value > 0);
  const compatibleWeight = candidates.find(value => Math.round((unitPrice * value + Number.EPSILON) * 100) / 100 === Math.round((totalPrice + Number.EPSILON) * 100) / 100);
  return compatibleWeight ?? null;
}
