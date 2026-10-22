import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getCurrentUser } from "./auth";

// Totem e painel da TV não têm login. Para a internet não ficar com a porta aberta,
// cada aparelho é "pareado" uma vez com a chave secreta DEVICE_KEY (que só a T.I. conhece)
// e passa a levar um cookie. Sem o cookie, as duas telas ficam bloqueadas.
const COOKIE = "cf_device";
const MIN_KEY_LENGTH = 16;
const ONE_YEAR_S = 365 * 24 * 60 * 60;

function configuredKey() {
  const key = process.env.DEVICE_KEY?.trim();
  return key && key.length >= MIN_KEY_LENGTH ? key : null;
}

// O cookie guarda um hash da chave, nunca a chave em si.
const digest = (key: string) =>
  createHash("sha256").update(`clinicafluxo-device:${key}`).digest("hex");

function safeEqual(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export function keyIsConfigured() {
  return configuredKey() !== null;
}

/** A chave digitada confere com a DEVICE_KEY do servidor? */
export function checkDeviceKey(candidate: string) {
  const key = configuredKey();
  return key !== null && safeEqual(digest(candidate), digest(key));
}

/** Marca este navegador como aparelho autorizado (cookie de longa duração). */
export async function authorizeThisDevice() {
  const key = configuredKey();
  if (!key) return;
  (await cookies()).set(COOKIE, digest(key), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ONE_YEAR_S,
  });
}

/**
 * Este navegador pode usar o totem/painel?
 * - equipe logada: sim (ex.: a T.I. testando);
 * - aparelho pareado com a chave certa: sim;
 * - sem DEVICE_KEY: liberado só em desenvolvimento; em produção, bloqueado.
 */
export async function isDeviceAuthorized() {
  if (await getCurrentUser()) return true;

  const key = configuredKey();
  if (!key) return process.env.NODE_ENV !== "production";

  const token = (await cookies()).get(COOKIE)?.value;
  return token !== undefined && safeEqual(token, digest(key));
}
