"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";
import {
  isLockedOut,
  lockoutMessage,
  afterFailedAttempt,
  afterSuccessfulLogin,
} from "@/lib/loginThrottle";

export type LoginState = { error: string } | null;

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Completa usuario y contraseña." };

  const user = await prisma.user.findUnique({ where: { email } });
  // Mismo mensaje si el usuario no existe o si la contraseña está mal:
  // no le damos pistas a quien intenta adivinar cuentas.
  if (!user || !user.active) return { error: "Usuario o contraseña incorrectos." };

  if (isLockedOut(user)) return { error: lockoutMessage(user.lockedUntil!) };

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    await prisma.user.update({
      where: { id: user.id },
      data: afterFailedAttempt(user),
    });
    return { error: "Usuario o contraseña incorrectos." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: afterSuccessfulLogin,
  });
  await createSession(user.id);
  redirect(user.role === "ORGANIZER" ? "/admin" : "/staff/scan");
}
