import { timingSafeEqual } from "node:crypto";

export function validSetupKey(candidate: string) {
  const expected = process.env.PDV_SETUP_KEY ?? "";
  const provided = candidate.trim();
  if (!expected || !provided) return false;
  const expectedBytes = Buffer.from(expected);
  const providedBytes = Buffer.from(provided);
  return expectedBytes.length === providedBytes.length && timingSafeEqual(expectedBytes, providedBytes);
}
