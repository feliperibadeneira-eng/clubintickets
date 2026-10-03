"use server";

import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { findOrCreateBuyer } from "@/lib/buyers";
import { sendBuyerLoginEmail } from "@/lib/email";

const TOKEN_MINUTES = 30;

export type RequestLoginState = { sent: true } | { sent: false; error: string } | null;

// No hace falta haber comprado antes: si el email no tiene cuenta, se crea
// una nueva acá mismo (ver findOrCreateBuyer). Entrar siempre es "pedí el
// link y confirmalo desde tu correo", sea cuenta nueva o existente.
export async function requestBuyerLogin(
  _prev: RequestLoginState,
  formData: FormData,
): Promise<RequestLoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const name = String(formData.get("name") ?? "");
  if (!email) return { sent: false, error: "Escribí tu email." };

  const buyer = await findOrCreateBuyer(email, name);
  const token = await prisma.buyerLoginToken.create({
    data: {
      id: randomUUID(),
      buyerId: buyer.id,
      expiresAt: new Date(Date.now() + TOKEN_MINUTES * 60_000),
    },
  });
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const result = await sendBuyerLoginEmail(
    buyer.email,
    buyer.name,
    `${base}/cuenta/verificar/${token.id}`,
  );
  if (!result.ok) return { sent: false, error: result.error };

  return { sent: true };
}
