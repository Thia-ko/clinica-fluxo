import { randomBytes } from "node:crypto";

/** Link secreto e impossível de adivinhar: 128 bits aleatórios. */
export function newFeedbackToken() {
  return randomBytes(16).toString("base64url");
}
