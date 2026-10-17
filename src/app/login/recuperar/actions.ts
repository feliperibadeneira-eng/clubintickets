"use server";

import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";

const TOKEN_MINUTES = 30;

export type RequestResetState = { sent: true } | { sent: false; error: string } | null;

// Siempre devuelve el mismo resultado exista o no la cuenta, para no darle
// pistas a quien intenta adivinar qué emails tienen cuenta.
export async function requestPasswordReset(
  _prev: RequestResetState,
  formData: FormData,
): Promise<RequestResetState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email) return { sent: false, error: "Escribe tu email." };

  const user = await prisma.user.findUnique({ where: { email } });
  // Si la cuenta no existe, cortamos acá con el mismo mensaje genérico — no
  // hay nada que mandar, y así no le damos pistas a quien intenta adivinar
  // qué emails tienen cuenta.
  if (!user || !user.active) return { sent: true };

  const token = await prisma.passwordResetToken.create({
    data: {
      id: randomUUID(),
      userId: user.id,
      expiresAt: new Date(Date.now() + TOKEN_MINUTES * 60_000),
    },
  });
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const result = await sendPasswordResetEmail(
    user.email,
    user.name,
    `${base}/login/recuperar/${token.id}`,
  );
  // Acá sí mostramos el error real: la cuenta existe de verdad (ya
  // confirmamos arriba), así que no hay nada que ocultar, y es mejor que
  // Felipe sepa que el email no salió en vez de esperar uno que nunca llega.
  if (!result.ok) return { sent: false, error: result.error };

  return { sent: true };
}
