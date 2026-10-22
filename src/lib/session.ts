import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "./db";

const COOKIE_NAME = "cf_session";
const SESSION_HOURS = 8; // um turno de trabalho

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

/** Cria a sessão no banco e entrega o token ao navegador num cookie HttpOnly. */
export async function createSession(userId: number) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000);

  await prisma.session.create({
    data: { id: hashToken(token), userId, expiresAt },
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
        select: { id: true, name: true, email: true, role: true, active: true },
      },
    },
  });

  if (!session || session.expiresAt < new Date() || !session.user.active)
    return null;
  return session.user;
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { id: hashToken(token) } });
  }
  jar.delete(COOKIE_NAME);
}
