import { describe, expect, it } from "vitest";
import {
  hourInClinicTz,
  startOfDay,
  startOfDaysAgo,
  startOfToday,
} from "./dates";

// Brasília é UTC-3 (sem horário de verão desde 2019).
describe("datas no fuso da clínica", () => {
  it("às 23h30 de Brasília ainda é o mesmo dia (mesmo já sendo o dia seguinte em UTC)", () => {
    const now = new Date("2026-10-22T02:30:00Z"); // 21/10 23:30 em Brasília
    expect(startOfToday(now).toISOString()).toBe("2026-10-21T03:00:00.000Z");
    expect(hourInClinicTz(now)).toBe(23);
  });

  it("a meia-noite de Brasília o dia vira", () => {
    const now = new Date("2026-10-22T03:00:00Z");
    expect(startOfToday(now).toISOString()).toBe("2026-10-22T03:00:00.000Z");
    expect(hourInClinicTz(now)).toBe(0);
  });

  it("startOfDay funciona para qualquer instante do dia", () => {
    expect(startOfDay(new Date("2026-10-21T15:45:10Z")).toISOString()).toBe(
      "2026-10-21T03:00:00.000Z",
    );
  });

  it("startOfDaysAgo volta o número certo de dias", () => {
    const now = new Date("2026-10-22T12:00:00Z");
    expect(startOfDaysAgo(0, now).toISOString()).toBe(
      "2026-10-22T03:00:00.000Z",
    );
    expect(startOfDaysAgo(6, now).toISOString()).toBe(
      "2026-10-16T03:00:00.000Z",
    );
    expect(startOfDaysAgo(29, now).toISOString()).toBe(
      "2026-09-23T03:00:00.000Z",
    );
  });
});
