import { prisma } from "./db";

// Freio contra tentativa de adivinhar senha: 5 erros por e-mail a cada 15 minutos.
// As tentativas ficam no banco: na nuvem cada requisição pode cair numa instância
// diferente, então a memória do servidor não serviria.
const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000;

export async function isLocked(email: string) {
  const failures = await prisma.loginAttempt.count({
    where: { email, createdAt: { gte: new Date(Date.now() - WINDOW_MS) } },
  });
  return failures >= MAX_FAILURES;
}

export async function registerFailure(email: string) {
  await prisma.loginAttempt.create({ data: { email } });
  // Faxina: tentativas com mais de um dia não servem para mais nada.
  await prisma.loginAttempt.deleteMany({
    where: { createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
  });
}

export async function clearFailures(email: string) {
  await prisma.loginAttempt.deleteMany({ where: { email } });
}
