import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { Role } from "@prisma/client";
import { readSessionUser } from "./session";

/** Lê o usuário uma vez por requisição, mesmo se vários componentes pedirem. */
export const getCurrentUser = cache(readSessionUser);

/**
 * Exige apenas estar logado (qualquer cargo), mesmo com senha provisória.
 * Usada pela área "Minha conta", onde a pessoa troca a senha.
 */
export async function requireSession() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Camada de acesso: toda página e toda ação protegida começa chamando isto.
 * - sem login → vai para /login
 * - senha provisória → vai para /conta (precisa trocá-la antes de qualquer coisa)
 * - cargo não permitido → vai para /acesso-negado
 * O ADMIN passa em qualquer verificação de cargo.
 */
export async function requireUser(allowed?: readonly Role[]) {
  const user = await requireSession();
  if (user.mustChangePassword) redirect("/conta");

  if (allowed && user.role !== "ADMIN" && !allowed.includes(user.role)) {
    redirect("/acesso-negado");
  }
  return user;
}
