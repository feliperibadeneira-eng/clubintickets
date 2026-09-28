"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";

export type LoginState = { error: string } | null;

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Completá usuario y contraseña." };

  const user = await prisma.user.findUnique({ where: { email } });
  // Mismo mensaje si el usuario no existe o si la contraseña está mal:
  // no le damos pistas a quien intenta adivinar cuentas.
  if (!user || !user.active) return { error: "Usuario o contraseña incorrectos." };

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return { error: "Usuario o contraseña incorrectos." };

  await createSession(user.id);
  redirect("/staff/scan");
}
