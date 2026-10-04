"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { createBuyerSession } from "@/lib/buyerAuth";

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

  const valid = await verifyPassword(password, buyer.passwordHash);
  if (!valid) return { error: "Email o contraseña incorrectos." };

  await createBuyerSession(buyer.id);
  redirect("/cuenta");
}
