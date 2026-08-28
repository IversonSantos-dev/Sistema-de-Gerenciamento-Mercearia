import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;

export function normalizeUsername(value: string) {
  const username = value.trim().toLowerCase();
  if (!/^[a-z0-9._-]{3,40}$/.test(username)) throw new Error("O usuário deve ter de 3 a 40 caracteres: letras, números, ponto, hífen ou sublinhado.");
  return username;
}

export function validatePassword(value: string) {
  if (value.length < 12 || value.length > 128) throw new Error("A senha deve ter entre 12 e 128 caracteres.");
  return value;
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = await scrypt(password, salt, KEY_LENGTH) as Buffer;
  return `scrypt$${salt}$${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, encoded: string) {
  const [algorithm, salt, expectedHash] = encoded.split("$");
  if (algorithm !== "scrypt" || !salt || !expectedHash) return false;
  const expected = Buffer.from(expectedHash, "hex");
  const actual = await scrypt(password, salt, expected.length) as Buffer;
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
