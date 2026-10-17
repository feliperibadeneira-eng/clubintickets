"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";

export type ResetPasswordState = { error: string } | null;

export async function resetPassword(
  token: string,
  _prev: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 8)
    return { error: "La contraseña tiene que tener al menos 8 caracteres." };
  if (password !== confirm)
    return { error: "Las contraseñas no coinciden." };

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { id: token },
  });
  const valid =
    resetToken && !resetToken.usedAt && resetToken.expiresAt > new Date();
  if (!valid) redirect("/login/recuperar?expirado=1");

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: {
        passwordHash: await hashPassword(password),
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    }),
    prisma.passwordResetToken.update({
      where: { id: token },
      data: { usedAt: new Date() },
    }),
  ]);

  redirect("/login?recuperada=1");
}
