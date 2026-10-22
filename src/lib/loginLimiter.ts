// Freio simples contra tentativa de adivinhar senha: 5 erros por e-mail a cada 15 minutos.
// Fica na memória do servidor (basta para estudo; em produção usaríamos o banco ou Redis).
const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000;

const failures = new Map<string, { count: number; since: number }>();

export function isLocked(email: string) {
  const entry = failures.get(email);
  if (!entry) return false;
  if (Date.now() - entry.since > WINDOW_MS) {
    failures.delete(email);
    return false;
  }
  return entry.count >= MAX_FAILURES;
}

export function registerFailure(email: string) {
  const entry = failures.get(email);
  if (!entry || Date.now() - entry.since > WINDOW_MS) {
    failures.set(email, { count: 1, since: Date.now() });
  } else {
    entry.count += 1;
  }
}

export function clearFailures(email: string) {
  failures.delete(email);
}
