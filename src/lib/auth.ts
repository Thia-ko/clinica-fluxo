import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { Role } from "@prisma/client";
import { readSessionUser } from "./session";

/** Lê o usuário uma vez por requisição, mesmo se vários componentes pedirem. */
export const getCurrentUser = cache(readSessionUser);

/**
 * Camada de acesso: toda página e toda ação protegida começa chamando isto.
 * - sem login → vai para /login
 * - cargo não permitido → vai para /acesso-negado
 * O ADMIN passa em qualquer verificação de cargo.
 */
export async function requireUser(allowed?: readonly Role[]) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (allowed && user.role !== "ADMIN" && !allowed.includes(user.role)) {
    redirect("/acesso-negado");
  }
  return user;
}
