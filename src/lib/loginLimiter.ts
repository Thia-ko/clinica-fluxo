import { prisma } from "./db";

// Freios contra tentativa de adivinhar senha, guardados no banco: na nuvem cada
// requisição pode cair numa instância diferente, então a memória do servidor não serviria.
//
//  - por e-mail: 5 erros a cada 15 minutos (protege cada conta);
//  - por origem (IP): 20 erros a cada 15 minutos (impede que uma única origem
//    fique tentando muitas contas, ou trancando contas alheias de propósito).
const MAX_FAILURES_PER_EMAIL = 5;
const MAX_FAILURES_PER_IP = 20;
const WINDOW_MS = 15 * 60 * 1000;

export async function isLocked(email: string, ip?: string | null) {
  const since = new Date(Date.now() - WINDOW_MS);

  const byEmail = await prisma.loginAttempt.count({
    where: { email, createdAt: { gte: since } },
  });
  if (byEmail >= MAX_FAILURES_PER_EMAIL) return true;

  if (!ip) return false;
  const byIp = await prisma.loginAttempt.count({
    where: { ip, createdAt: { gte: since } },
  });
  return byIp >= MAX_FAILURES_PER_IP;
}

export async function registerFailure(email: string, ip?: string | null) {
  await prisma.loginAttempt.create({ data: { email, ip: ip ?? null } });
  // Faxina: tentativas com mais de um dia não servem para mais nada.
  await prisma.loginAttempt.deleteMany({
    where: { createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
  });
}

/** Login certo: zera a contagem do e-mail (a da origem expira sozinha). */
export async function clearFailures(email: string) {
  await prisma.loginAttempt.deleteMany({ where: { email } });
}
