// Regras de senha. Valem no servidor (é lá que contam) e a tela reaproveita
// as mesmas funções só para orientar a pessoa enquanto digita.
//
// Seguimos a orientação atual de especialistas (NIST): o tamanho importa mais
// do que símbolos obrigatórios, e senhas comuns precisam ser barradas.

export const MIN_PASSWORD_LENGTH = 10;
// Limite máximo: o hash é caro de calcular, então não aceitamos textos gigantes.
export const MAX_PASSWORD_LENGTH = 128;

const COMMON_PASSWORDS = new Set([
  "1234567890",
  "12345678910",
  "0123456789",
  "9876543210",
  "abcdefghij",
  "qwertyuiop",
  "asdfghjkl",
  "password",
  "password1",
  "password123",
  "senha12345",
  "senha123456",
  "senhasenha",
  "mudar123",
  "mudar12345",
  "clinica123",
  "clinica1234",
  "clinica-demo-123",
  "admin12345",
  "administrador",
  "123456789a",
  "minhasenha",
  "brasil2026",
  "brasil12345",
  "iloveyou12",
]);

type Context = { email?: string; name?: string };

/** Devolve o motivo de a senha não servir, ou null se ela serve. */
export function validateNewPassword(
  password: string,
  context: Context = {},
): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return `A senha pode ter no máximo ${MAX_PASSWORD_LENGTH} caracteres.`;
  }
  if (new Set(password).size < 4) {
    return "Use uma senha com mais variedade de caracteres.";
  }
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    return "Essa senha é muito comum. Escolha outra.";
  }

  const emailPart = context.email?.split("@")[0]?.toLowerCase();
  if (
    emailPart &&
    emailPart.length >= 4 &&
    password.toLowerCase().includes(emailPart)
  ) {
    return "A senha não pode conter o seu e-mail.";
  }
  return null;
}

export type Strength = { score: 0 | 1 | 2 | 3 | 4; label: string };

const LABELS: Record<Strength["score"], string> = {
  0: "Muito fraca",
  1: "Fraca",
  2: "Razoável",
  3: "Boa",
  4: "Forte",
};

/** Indicador simples para a tela. Não substitui a validação do servidor. */
export function passwordStrength(password: string): Strength {
  if (!password) return { score: 0, label: LABELS[0] };

  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) =>
    r.test(password),
  ).length;

  let score = 0;
  if (password.length >= MIN_PASSWORD_LENGTH) score += 1;
  if (password.length >= 14) score += 1;
  if (classes >= 3) score += 1;
  if (password.length >= 18) score += 1;

  const capped = Math.min(score, 4) as Strength["score"];
  return { score: capped, label: LABELS[capped] };
}
