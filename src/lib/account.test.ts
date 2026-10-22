import { describe, expect, it, vi } from "vitest";
import { passwordStrength, validateNewPassword } from "./passwordPolicy";
import { describeUserAgent } from "./userAgent";

// tempPassword usa "server-only", que só existe dentro do Next: neutralizamos no teste.
vi.mock("server-only", () => ({}));

describe("validateNewPassword", () => {
  it("aceita uma senha longa e comum de variedade", () => {
    expect(validateNewPassword("cavalo-azul-72-janela")).toBeNull();
  });

  it("recusa senha curta, mostrando o mínimo", () => {
    expect(validateNewPassword("abc123")).toMatch(/pelo menos 10/);
  });

  it("recusa senha gigante (o hash é caro de calcular)", () => {
    expect(validateNewPassword("a1b2".repeat(40))).toMatch(/no máximo 128/);
  });

  it("recusa caractere repetido e senhas comuns", () => {
    expect(validateNewPassword("aaaaaaaaaaaa")).toMatch(/variedade/);
    expect(validateNewPassword("Password123")).toMatch(/comum/);
    expect(validateNewPassword("clinica-demo-123")).toMatch(/comum/);
  });

  it("recusa senha que contém o próprio e-mail", () => {
    expect(
      validateNewPassword("ritarecepcao2026", {
        email: "ritarecepcao@clinica.test",
      }),
    ).toMatch(/e-mail/);
  });
});

describe("passwordStrength", () => {
  it("cresce com o tamanho e a variedade", () => {
    expect(passwordStrength("").score).toBe(0);
    expect(passwordStrength("abc").score).toBe(0);
    expect(passwordStrength("abcdefghij").score).toBe(1);
    expect(passwordStrength("abcdefghijklmn").score).toBe(2);
    expect(passwordStrength("Abcdefghij1k").score).toBe(2);
    expect(passwordStrength("Abcdefghijklm1!").score).toBe(3);
    expect(passwordStrength("Cavalo-Azul-72-Janela-Aberta").score).toBe(4);
  });
});

describe("describeUserAgent", () => {
  it("reconhece navegador e sistema", () => {
    expect(
      describeUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      ),
    ).toBe("Chrome · Windows");
    expect(
      describeUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36 Edg/124.0",
      ),
    ).toBe("Edge · Windows");
    expect(
      describeUserAgent(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1",
      ),
    ).toBe("Safari · iOS");
  });

  it("não quebra sem dado", () => {
    expect(describeUserAgent(null)).toBe("Aparelho desconhecido");
    expect(describeUserAgent("???")).toBe("Aparelho desconhecido");
  });
});

describe("generateTempPassword", () => {
  it("gera senhas provisórias que passam na própria regra de senha", async () => {
    const { generateTempPassword } = await import("./tempPassword");
    const seen = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const pwd = generateTempPassword();
      expect(pwd).toHaveLength(12);
      expect(pwd).not.toMatch(/[0OIl1]/);
      expect(validateNewPassword(pwd)).toBeNull();
      seen.add(pwd);
    }
    expect(seen.size).toBe(50);
  });
});
