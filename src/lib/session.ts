import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { prisma } from "./db";

const COOKIE_NAME = "cf_session";
const SESSION_HOURS = 8; // um turno de trabalho
const REMEMBER_DAYS = 7; // "manter conectado" (só em aparelho pessoal)

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

/** Cria a sessão no banco e entrega o token ao navegador num cookie HttpOnly. */
export async function createSession(
  userId: number,
  options: { remember?: boolean } = {},
) {
  const token = randomBytes(32).toString("base64url");
  const lifetimeMs = options.remember
    ? REMEMBER_DAYS * 24 * 60 * 60 * 1000
    : SESSION_HOURS * 60 * 60 * 1000;
  const expiresAt = new Date(Date.now() + lifetimeMs);
  const userAgent = (await headers()).get("user-agent")?.slice(0, 300) ?? null;

  await prisma.session.create({
    data: { id: hashToken(token), userId, expiresAt, userAgent },
  });

  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true, // JavaScript da página não consegue ler o cookie
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/** Devolve o usuário logado (ou null se não há sessão válida e ativa). */
export async function readSessionUser() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { id: hashToken(token) },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          active: true,
          mustChangePassword: true,
        },
      },
    },
  });

  if (!session || session.expiresAt < new Date() || !session.user.active)
    return null;
  return session.user;
}

/** Identificador (hash) da sessão deste navegador, para marcá-la na lista de sessões. */
export async function currentSessionId() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  return token ? hashToken(token) : null;
}

/** Sessões ainda válidas de uma pessoa, da mais recente para a mais antiga. */
export async function listActiveSessions(userId: number) {
  return prisma.session.findMany({
    where: { userId, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
    select: { id: true, createdAt: true, expiresAt: true, userAgent: true },
  });
}

/** Encerra todas as sessões da pessoa, menos a que está em uso (se informada). */
export async function revokeOtherSessions(
  userId: number,
  keepId: string | null,
) {
  await prisma.session.deleteMany({
    where: { userId, ...(keepId ? { id: { not: keepId } } : {}) },
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { id: hashToken(token) } });
  }
  jar.delete(COOKIE_NAME);
}
