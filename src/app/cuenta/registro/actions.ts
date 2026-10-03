"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { createBuyerSession } from "@/lib/buyerAuth";

export type RegisterState = { error: string } | null;

export async function registerBuyer(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (name.length < 3) return { error: "Escribí tu nombre completo." };
  if (!email) return { error: "Escribí tu email." };
  if (password.length < 8)
    return { error: "La contraseña tiene que tener al menos 8 caracteres." };

  const existing = await prisma.buyer.findUnique({ where: { email } });
  if (existing)
    return { error: "Ya existe una cuenta con ese email — iniciá sesión." };

  const buyer = await prisma.buyer.create({
    data: { name, email, passwordHash: await hashPassword(password) },
  });

  await createBuyerSession(buyer.id);
  redirect("/cuenta");
}
