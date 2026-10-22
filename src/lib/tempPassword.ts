import "server-only";
import { randomInt } from "node:crypto";

// Sem caracteres que se confundem ao ler (0/O, 1/l/I): a senha provisória
// costuma ser passada por telefone ou papel.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

/** Senha provisória aleatória (12 caracteres), mostrada uma única vez ao Admin. */
export function generateTempPassword(length = 12) {
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}
