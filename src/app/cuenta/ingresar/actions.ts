"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { createBuyerSession } from "@/lib/buyerAuth";
import {
  isLockedOut,
  lockoutMessage,
  afterFailedAttempt,
  afterSuccessfulLogin,
} from "@/lib/loginThrottle";

export type LoginState = { error: string } | null;

export async function loginBuyer(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Completa email y contraseña." };

  const buyer = await prisma.buyer.findUnique({ where: { email } });
  // Mismo mensaje si el email no existe o si la contraseña está mal: no le
  // damos pistas a quien intenta adivinar cuentas.
  if (!buyer) return { error: "Email o contraseña incorrectos." };

  if (isLockedOut(buyer)) return { error: lockoutMessage(buyer.lockedUntil!) };

  const valid = await verifyPassword(password, buyer.passwordHash);
  if (!valid) {
    await prisma.buyer.update({
      where: { id: buyer.id },
      data: afterFailedAttempt(buyer),
    });
    return { error: "Email o contraseña incorrectos." };
  }

  await prisma.buyer.update({
    where: { id: buyer.id },
    data: afterSuccessfulLogin,
  });
  await createBuyerSession(buyer.id);
  redirect("/cuenta");
}
