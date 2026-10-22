import "server-only";
import { headers } from "next/headers";

/**
 * IP de quem fez a requisição. Atrás de um proxy (como a Vercel) ele vem em
 * `x-forwarded-for`; o primeiro da lista é o do visitante.
 */
export async function getClientIp() {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || h.get("x-real-ip") || null;
}
